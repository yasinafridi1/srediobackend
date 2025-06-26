import dotenv from "dotenv";
dotenv.config();
export const envVariables = {
  appPort: process.env.PORT || 3000,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  shortTokenSecret: process.env.SHORT_TOKEN_SECRET,
  mongoDbURI: process.env.MONGODB_URI,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:4200",
  vapidPublickey: process.env.VAPID_PUBLIC_KEY,
  vapidPrivatekey: process.env.VAPID_PRIVATE_KEY,
};

export const ROLES = {
  USER: 2,
  ADMIN: 1,
};

export const notificationMessages = {
  syncDataSuccess: {
    notification: {
      title: "Data Sync",
      body: "Your data has been synced successfully",
    },
    data: {
      url: `${envVariables.frontendUrl}/repos`,
    },
  },
  syncDataFailure: {
    notification: {
      title: "Data Sync failure",
      body: "Something went wrong while syncing data.",
    },
    data: {
      url: `${envVariables.frontendUrl}/profile`,
    },
  },
};
