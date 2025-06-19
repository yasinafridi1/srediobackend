import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rawData: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

const GithubOrganizations = mongoose.model(
  "GithubOrganizations",
  organizationSchema
);
export default GithubOrganizations;
