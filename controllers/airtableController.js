import { envVariables } from "../config/constants.js";
import AsyncWrapper from "../helpers/AsyncWrapper.js";
import { AuthorizationCode } from "simple-oauth2";
import SuccessMessage from "../helpers/SuccessMessage.js";
import crypto from "crypto";
import AirTableModel from "../models/AirTableTokens.js";
import UserModel from "../models/UserModel.js";
import syncAirTableData from "../helpers/AirTableDataSync.js";
import { randomUUID } from "crypto";
// import puppeteer from "puppeteer";
import ErrorHandler from "../helpers/ErrorHandler.js";
import mongoose from "mongoose";
import flattenData from "../helpers/flattenData.js";
import AirTableBasesModel from "../models/AirTableBasesModel.js";
import AirTablesModel from "../models/AirTablesModel.js";
import AirTablesTicketModel from "../models/AirTableTicketsModel.js";
import scrapper from "../helpers/Scrapper.js";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AirTableRevisionModel from "../models/AirTableRevisionModel.js";
import { revisionDTO } from "../helpers/Dto.js";
puppeteer.use(StealthPlugin());

const {
  airtableCallback,
  airtableClientId,
  airtableClientSecret,
  frontendUrl,
} = envVariables;

function base64URLEncode(str) {
  return str
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest();
}

const stateStore = new Map();
const codeVerifierStore = new Map();
const sessionMap = new Map();

const config = {
  client: {
    id: airtableClientId,
    secret: airtableClientSecret,
  },
  auth: {
    tokenHost: "https://airtable.com",
    tokenPath: "/oauth2/v1/token",
    authorizePath: "/oauth2/v1/authorize",
  },
};

export const connectAirtable = AsyncWrapper(async (req, res, next) => {
  const client = new AuthorizationCode(config);
  const state = req.user._id;

  const integration = await AirTableModel.findOne({ userId: state });
  if (integration) {
    return next(
      new ErrorHandler(
        "You have already connected your airtable. Please remove it first and then try again",
        403
      )
    );
  }
  // Generate code verifier (random string)
  const codeVerifier = crypto.randomBytes(32).toString("hex");

  // Generate code challenge (hashed & base64url)
  const codeChallenge = base64URLEncode(sha256(codeVerifier));

  // Store state and codeVerifier (tie them to user/session in real app)
  stateStore.set(state, true);
  codeVerifierStore.set(state, codeVerifier);
  const authorizationUri = client.authorizeURL({
    redirect_uri: airtableCallback,
    response_type: "code",
    state: state,
    scope:
      "data.records:read data.records:write data.recordComments:read data.recordComments:write schema.bases:read schema.bases:write",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return SuccessMessage(res, "Oauth url", { redirectUrl: authorizationUri });
});

export const airTableCallBack = AsyncWrapper(async (req, res, next) => {
  const { code, state } = req.query;

  const codeVerifier = codeVerifierStore.get(state);

  stateStore.delete(state);
  codeVerifierStore.delete(state);

  const client = new AuthorizationCode(config);
  const tokenParams = {
    code,
    redirect_uri: airtableCallback,
    code_verifier: codeVerifier,
  };

  const accessToken = await client.getToken(tokenParams);

  const newAirTable = new AirTableModel({
    userId: state,
    accessToken: accessToken?.token?.access_token,
    refreshToken: accessToken?.token?.refresh_token,
  });

  const result = await newAirTable.save();
  if (!result) {
    return next(
      new ErrorHandler("Something went wrong while storing airtable data", 400)
    );
  }

  setImmediate(() => {
    syncAirTableData(result)
      .then(() => {
        console.log("Air tabe data sync successfully");
      })
      .catch((err) => {
        console.error("Error syncing airtable data:", err);
      });
  });

  await UserModel.updateOne({ _id: state }, { airTable: result._id });
  return res.redirect(`${frontendUrl}/profile`);
});

export const loginAirTable = AsyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  const userId = req.user._id;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
  );
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto("https://airtable.com/login", { waitUntil: "networkidle2" });
  await page.type('input[type="email"]', email);
  await page.click('button[type="submit"]');

  const emailCheckResult = await Promise.race([
    // Valid email → page moves to password
    page
      .waitForFunction(() => window.location.hash === "#password", {
        timeout: 900000,
      })
      .then(() => "valid")
      .catch(() => null),

    // Invalid email → error message appears
    page
      .waitForFunction(
        () => {
          const error = Array.from(
            document.querySelectorAll('div[role="paragraph"]')
          ).find((el) =>
            el.textContent?.includes(
              "The email you entered does not belong to any account"
            )
          );
          return !!error;
        },
        { timeout: 900000 }
      )
      .then(() => "invalid")
      .catch(() => null),
  ]);

  if (emailCheckResult !== "valid") {
    await browser.close();
    return next(new ErrorHandler("Invalid email address", 400));
  }

  await page.type('input[type="password"]', password);

  await page.click('button[type="submit"]');

  // Wait for either MFA, navigation, or password error
  const loginCheckResult = await Promise.race([
    // MFA input appears
    page
      .waitForSelector('input[name="code"]', { timeout: 90000 })
      .then(() => "mfa")
      .catch(() => null),

    // Navigation = success
    page
      .waitForNavigation({ waitUntil: "networkidle2", timeout: 90000 })
      .then(() => "success")
      .catch(() => null),

    // Password error appears
    page
      .waitForFunction(
        () => {
          const error = Array.from(
            document.querySelectorAll('div[role="paragraph"]')
          ).find(
            (el) => el.textContent?.trim().toLowerCase() === "invalid password"
          );
          return !!error;
        },
        { timeout: 90000 }
      )
      .then(() => "invalid-password")
      .catch(() => null),
  ]);

  if (loginCheckResult === "invalid-password") {
    await browser.close();
    return next(new ErrorHandler("Invalid password. Please try again.", 400));
  }

  if (loginCheckResult === "mfa") {
    const sessionId = randomUUID();
    sessionMap.set(sessionId, { browser, page });
    return SuccessMessage(res, "MFA Activated", {
      mfa: { required: true },
      sessionId,
    });
  }

  if (loginCheckResult === "success") {
    setImmediate(() => {
      scrapper(userId, browser, page)
        .then(() => {
          sessionMap.clear();
          console.log("scrapping completed successfully");
        })
        .catch((err) => {
          console.error("Error scrapping airtable:", err);
        });
    });

    return SuccessMessage(
      res,
      "Scrapping started successfully. We will send a notification when scrapping is completed.",
      {
        mfa: { required: false },
        dataScrap: "PENDING",
      }
    );
  }

  await browser.close();
  return next(new ErrorHandler("Login failed or timed out", 500));
});

export const verifyMFA = AsyncWrapper(async (req, res, next) => {
  const { sessionId, code } = req.body;
  const userId = req.user._id;

  const session = sessionMap.get(sessionId);
  if (!session) {
    return res.status(400).json({ error: "Invalid or expired session ID" });
  }

  const { page, browser } = session;
  // Clear the input before typing the code (optional, in case of retries)
  await page.evaluate(() => {
    const input = document.querySelector('input[name="code"]');
    if (input) input.value = "";
  });

  await page.type('input[name="code"]', code, { delay: 300 });
  await page.keyboard.press("Enter");

  const mfaResult = await Promise.race([
    page
      .waitForNavigation({ waitUntil: "networkidle2", timeout: 90000 })
      .then(() => "success")
      .catch(() => null),

    page
      .waitForFunction(
        () => {
          const el = Array.from(
            document.querySelectorAll("div.small.strong.quiet")
          ).find((e) => e.textContent?.trim().toLowerCase() === "invalid code");
          return !!el;
        },
        { timeout: 90000 }
      )
      .then(() => "invalid-code")
      .catch(() => null),
  ]);

  if (mfaResult === "invalid-code") {
    return SuccessMessage(res, "Incorrect code", { isValid: false, sessionId });
  }

  if (mfaResult === "success") {
    setImmediate(() => {
      scrapper(userId, browser, page)
        .then(() => {
          sessionMap.clear();
          console.log("scrapping completed successfully");
        })
        .catch((err) => {
          console.error("Error scrapping airtable:", err);
        });
    });
    return SuccessMessage(res, "MFA verified successfully.", {
      isValid: true,
      dataScrap: "PENDING",
    });
  }
  await browser.close();
  return next(new ErrorHandler("MFA failed or timed out", 500));
});

export const getAllCollections = AsyncWrapper(async (req, res, next) => {
  const userData = await UserModel.findById(req.user._id).populate("airTable");
  if (!userData?.airTable || userData?.airTable?.dataSync !== "COMPLETED") {
    return next(
      new ErrorHandler(
        "You have not connected AirTable yet or the data is not sync yet",
        400
      )
    );
  }

  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections
    .filter(
      (col) =>
        col.name.toLowerCase().includes("airtable") &&
        col.name.toLowerCase() !== "airtableintegrations"
    )
    .map((col) => col.name);

  return SuccessMessage(res, "Collection fetched successfully", {
    collectionNames,
  });
});

export const getSingleCollectionData = AsyncWrapper(async (req, res, next) => {
  const { collectionName } = req.params;
  const userId = req.user._id;
  const { page = 1, limit = 20 } = req.query;

  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections
    .filter(
      (col) =>
        col.name.toLowerCase().includes("airtable") &&
        col.name.toLowerCase() !== "airtableintegrations"
    )
    .map((col) => col.name);

  const matchedCollection = collectionNames.find(
    (colName) => colName.toLowerCase() === collectionName.toLowerCase()
  );

  if (!matchedCollection) {
    return next(new ErrorHandler("Collection not found", 404));
  }

  const skip = (page - 1) * limit;

  const CollectionModel = mongoose.connection.db.collection(matchedCollection);
  let data = await CollectionModel.find({
    userId: new mongoose.Types.ObjectId(userId),
  })
    .skip(skip)
    .limit(parseInt(limit))
    .toArray();

  if (collectionName.toLowerCase() === "airtablerevisions") {
    data = data.map((item) => revisionDTO(item));
  } else {
    data = data.map((item) => flattenData(item));
  }

  const total = await CollectionModel.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
  });
  return SuccessMessage(res, "Collection data fetched successfully", {
    data,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
    totalItems: total,
    itemsPerPage: parseInt(limit),
  });
});

export const removeAirTableData = AsyncWrapper(async (req, res, next) => {
  const userId = req.user._id;
  const integration = await AirTableModel.findOne({ userId });
  if (!integration) {
    return next(new ErrorHandler("You havenot connected AirTable", 400));
  }

  await AirTableBasesModel.deleteMany({ userId });
  await AirTablesModel.deleteMany({ userId });
  await AirTablesTicketModel.deleteMany({ userId });
  await AirTableModel.deleteOne({ userId });
  await AirTableRevisionModel.deleteMany({ userId });

  return SuccessMessage(res, "Your data has been delete successfully");
});

export const revisionPerRecords = AsyncWrapper(async (req, res, next) => {
  const userId = req.user._id;
  const { recordId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;
  let revisionData = await AirTableRevisionModel.find({
    userId: userId,
    issueId: recordId,
  })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await AirTableRevisionModel.countDocuments({
    userId: userId,
    issueId: recordId,
  });
  revisionData = revisionData.map((item) => revisionDTO(item));
  return SuccessMessage(res, "Revision history fetched successfully", {
    revisionData,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
    totalItems: total,
    itemsPerPage: parseInt(limit),
  });
});
