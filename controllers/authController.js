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
import SubscriptionModel from "../models/SubscriptionModel.js";

export const login = AsyncWrapper(async (req, res, next) => {
  const { email, password, subscription } = req.body;
  const user = await UserModel.findOne({ email }).populate("airTable");
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

  if (subscription) {
    await SubscriptionModel.updateOne(
      { userId: user._id },
      { $set: { subscription } },
      { upsert: true }
    );
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
  const dbUser = await UserModel.findById(user._id).populate("airTable");
  console.log("DB USER ==>", dbUser);
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
