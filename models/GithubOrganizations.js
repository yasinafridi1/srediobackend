import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    login: String,
    orgId: Number,
    repos_url: String,
  },
  { timestamps: true }
);

const GithubOrganizations = mongoose.model(
  "GithubOrganizations",
  organizationSchema
);
export default GithubOrganizations;
