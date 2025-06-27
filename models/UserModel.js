import mongoose from "mongoose";
import { ROLES } from "../config/constants.js";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      default: null,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    role: {
      type: Number,
      enum: Object.values(ROLES),
      default: ROLES.USER,
    },
    passwordTries: {
      type: Number,
      default: 0,
      required: false,
    },
    lockUntil: {
      type: Date,
      default: null, // Date after which the account unlocks
    },
    airTable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AirtableIntegration",
      default: null,
    },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
