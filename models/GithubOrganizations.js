import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
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
