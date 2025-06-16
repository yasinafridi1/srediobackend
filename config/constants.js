import dotenv from "dotenv";
dotenv.config();
export const envVariables = {
  appPort: process.env.PORT || 3000,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  shortTokenSecret: process.env.SHORT_TOKEN_SECRET,
  mongoDbURI: process.env.MONGODB_URI,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:4200",
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  githubCallbackUrl: process.env.GITHUB_CALLBACK_URL,
};

export const ROLES = {
  USER: 2,
  ADMIN: 1,
};
