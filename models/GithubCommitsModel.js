import mongoose from "mongoose";

const GithubCommitSchema = new mongoose.Schema(
  {
    repo: { type: mongoose.Schema.Types.ObjectId, ref: "GithubRepository" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rawData: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

const GithubCommit = mongoose.model("GithubCommit", GithubCommitSchema);
export default GithubCommit;
