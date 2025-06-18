import mongoose from "mongoose";

const githubIntegrationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  githubId: Number,
  githubUsername: String,
  githubFullName: String,
  githubAccessToken: String,
  public_repos: Number,
  followers: Number,
  following: Number,
  private_repos: Number,
  connectedAt: Date,
  orgs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GithubOrganizations",
    },
  ],
  dataSync: {
    type: String,
    enum: ["PENDING", "COMPLETED"],
    default: "COMPLETED",
  },
});

const GithubIntegration = mongoose.model(
  "GithubIntegration",
  githubIntegrationSchema
);

export default GithubIntegration;
