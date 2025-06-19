import mongoose from "mongoose";

const GithubRepositorySchema = new mongoose.Schema({
  org: { type: mongoose.Schema.Types.ObjectId, ref: "GithubOrganizations" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rawData: { type: mongoose.Schema.Types.Mixed },
});

export default mongoose.model("GithubRepository", GithubRepositorySchema);
