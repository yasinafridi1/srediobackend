import mongoose from "mongoose";

const GithubIssueEventSchema = new mongoose.Schema({
  issue: { type: mongoose.Schema.Types.ObjectId, ref: "GithubIssue" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  node_id: String,
  url: String,
  author: {
    name: String,
    email: String,
    date: Date,
  },
  committer: {
    name: String,
    email: String,
    date: Date,
  },
  message: String,
  event: String,
});

export default mongoose.model("GithubIssueEvent", GithubIssueEventSchema);
