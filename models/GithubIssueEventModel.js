import mongoose from "mongoose";

const GithubIssueEventSchema = new mongoose.Schema({
  issue: { type: mongoose.Schema.Types.ObjectId, ref: "GithubIssue" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rawData: { type: mongoose.Schema.Types.Mixed },
});

export default mongoose.model("GithubIssueEvent", GithubIssueEventSchema);
