import jwt from "jsonwebtoken";
import { envVariables } from "../config/constants.js";
import UserModel from "../models/UserModel.js";
const { accessTokenSecret, refreshTokenSecret, shortTokenSecret } =
  envVariables;

export const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, accessTokenSecret, {
    expiresIn: "24hr",
  });
  const refreshToken = jwt.sign(payload, refreshTokenSecret, {
    expiresIn: "3d",
  });

  return { accessToken, refreshToken };
};

export const storeTokens = async (accessToken, refreshToken, userId) => {
  return await UserModel.updateOne(
    { _id: userId },
    { accessToken: accessToken, refreshToken: refreshToken }
  );
};

export const verifyAccessToken = async (token) => {
  try {
    const decoded = jwt.verify(token, accessTokenSecret);
    if (decoded) {
      const dbUser = await UserModel.findOne({
        _id: decoded._id,
        accessToken: token,
      });
      if (!dbUser) throw new Error("User not found");
      return decoded;
    }
    throw error;
  } catch (error) {
    error.statusCode = 401; // Set custom status code for token verification errors
    error.message = "Token expired";
    throw error;
  }
};

export const verifyRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, refreshTokenSecret);
    if (decoded) {
      const dbUser = await UserModel.findOne({
        _id: decoded._id,
        refreshToken: token,
      });

      if (!dbUser) throw new Error("User not found");
      return dbUser;
    }
    throw error;
  } catch (error) {
    error.statusCode = 401; // Set custom status code for token verification errors
    error.message = "Token expired";
    throw error;
  }
};

export const generateShortToken = (payload, time) => {
  return jwt.sign(payload, shortTokenSecret, { expiresIn: time });
};

export const verifyShortToken = async (token) => {
  try {
    const userData = jwt.verify(token, shortTokenSecret);
    if (userData) {
      return userData;
    }
    throw new Error("Token verification failed");
  } catch (err) {
    err.statusCode = 422; // Set custom status code for token verification errors
    throw err;
  }
};
