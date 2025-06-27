import { envVariables } from "../config/constants.js";
import AsyncWrapper from "../helpers/AsyncWrapper.js";
import { AuthorizationCode } from "simple-oauth2";
import SuccessMessage from "../helpers/SuccessMessage.js";
import crypto from "crypto";
import AirTableModel from "../models/AirTableTokens.js";
import UserModel from "../models/UserModel.js";
import syncAirTableData from "../helpers/AirTableDataSync.js";
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
