import AsyncWrapper from "../helpers/AsyncWrapper.js";
import { userDto } from "../helpers/Dto.js";
import ErrorHandler from "../helpers/ErrorHandler.js";
import {
  generateTokens,
  storeTokens,
  verifyRefreshToken,
} from "../helpers/JwtService.js";
import SuccessMessage from "../helpers/SuccessMessage.js";
import UserModel from "../models/UserModel.js";
import bcrypt from "bcrypt";
import { OAuthApp } from "@octokit/oauth-app";
import { Octokit } from "@octokit/rest";
import { envVariables } from "../config/constants.js";
import GithubIntegration from "../models/GithubIntegrationModel.js";
import GithubOrganizations from "../models/GithubOrganizations.js";
import { syncFullGithubData } from "../helpers/githubDataSync.js";
const { frontendUrl, githubCallbackUrl, githubClientId, githubClientSecret } =
  envVariables;

const oauthApp = new OAuthApp({
  clientType: "oauth-app",
  clientId: githubClientId,
  clientSecret: githubClientSecret,
});

export const login = AsyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await UserModel.findOne({ email }).populate("github");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 422));
  }

  // Check if account is locked
  if (user.lockUntil && user.lockUntil > new Date()) {
    const unlockTime = user.lockUntil.toLocaleString();
    return next(
      new ErrorHandler(`Account is locked. Try again after: ${unlockTime}`, 400)
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    user.passwordTries += 1;

    // Lock account if tries reach 5
    if (user.passwordTries >= 5) {
      user.lockUntil = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours
    }

    await user.save();
    return next(new ErrorHandler("Invalid email or password", 422));
  }

  // Reset passwordTries and lockUntil on successful login
  user.passwordTries = 0;
  user.lockUntil = null;
  await user.save();

  const { accessToken, refreshToken } = generateTokens({
    _id: user._id,
    role: user.role,
  });

  const userData = userDto(user);

  await storeTokens(accessToken, refreshToken, user._id);
  return SuccessMessage(
    res,
    "Logged in successfully",
    { userData: userData, accessToken, refreshToken },
    200
  );
});

export const register = AsyncWrapper(async (req, res, next) => {
  const { fullName, email, password } = req.body;
  const existingEmail = await UserModel.exists({ email });
  if (existingEmail) {
    return next(new ErrorHandler("Email already exists", 409));
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new UserModel({
    fullName,
    email,
    password: hashedPassword,
  });
  const result = await newUser.save();
  if (!result) {
    return next(new ErrorHandler("Failed to register user", 500));
  }
  return SuccessMessage(res, "User registered successfully", null, 201);
});

export const autoLogin = AsyncWrapper(async (req, res, next) => {
  const { refreshToken: refreshTokenFromBody } = req.body;
  const user = await verifyRefreshToken(refreshTokenFromBody);

  const { accessToken, refreshToken } = generateTokens({
    _id: user._id,
    role: user.role,
  });

  await storeTokens(accessToken, refreshToken, user._id, user.role);
  const dbUser = await UserModel.findById(user._id).populate("github");
  const userData = userDto(dbUser);

  return SuccessMessage(res, "Logged in successfully", {
    userData,
    accessToken,
    refreshToken,
  });
});

export const logout = AsyncWrapper(async (req, res, next) => {
  const { _id } = req.user;
  await UserModel.findByIdAndUpdate(_id, {
    accessToken: null,
    refreshToken: null,
  });
  return SuccessMessage(res, "Logged out successfully");
});

export const githubLogin = AsyncWrapper(async (req, res, next) => {
  const user = await UserModel.findById(req.user._id).populate("github");
  if (user.github) {
    return next(new ErrorHandler("GitHub account already connected", 400));
  }

  const response = oauthApp.getWebFlowAuthorizationUrl({
    scopes: ["read:org", "repo", "user"],
    state: req.user._id,
  });
  return SuccessMessage(res, "Redirecting to GitHub", {
    redirectUrl: response.url,
  });
});

export const githubCallback = AsyncWrapper(async (req, res, next) => {
  const { code, state } = req.query;
  const { authentication } = await oauthApp.createToken({ code });
  const accessToken = authentication.token;
  const octokit = new Octokit({ auth: accessToken });
  const { data: user } = await octokit.rest.users.getAuthenticated();
  const { data: orgs = [] } =
    await octokit.rest.orgs.listForAuthenticatedUser();

  let insertedOrgs = [];
  if (orgs?.length > 0) {
    const orgsData = orgs.map((org) => {
      return {
        userId: state,
        rawData: org,
      };
    });
    insertedOrgs = await GithubOrganizations.insertMany(orgsData);
  }

  const integration = new GithubIntegration({
    userId: state,
    githubId: user.id,
    githubAccessToken: accessToken,
    githubUsername: user?.login,
    githubFullName: user?.name,
    public_repos: user?.public_repos,
    followers: user?.followers,
    following: user?.following,
    private_repos: user?.total_private_repos,
    orgs: insertedOrgs?.length ? insertedOrgs.map((org) => org._id) : [],
    connectedAt: new Date(),
  });

  const result = await integration.save();
  if (!result) {
    return next(new ErrorHandler("Failed to connect GitHub account", 500));
  }
  await UserModel.updateOne({ _id: state }, { github: result._id });

  if (insertedOrgs.length > 0) {
    await GithubIntegration.updateOne(
      { _id: result._id },
      { dataSync: "PENDING" }
    );
    setImmediate(() => {
      syncFullGithubData(octokit, insertedOrgs, state, result._id)
        .then(() => {
          console.log("GitHub data synced successfully for user:");
        })
        .catch((error) => {
          console.error("Error syncing GitHub data:", error);
        });
    });
  }

  const dbUser = await UserModel.findById(state).select().populate("github");
  const userData = userDto(dbUser);
  res.cookie("user", JSON.stringify(userData), {
    httpOnly: false,
    secure: false, // true in production (HTTPS)
    sameSite: "Lax",
    maxAge: 1 * 60 * 1000, // 1 minutes
  });

  return res.redirect(`${frontendUrl}/profile`);
});
