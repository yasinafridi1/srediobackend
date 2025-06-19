import mongoose from "mongoose";

const GithubPullSchema = new mongoose.Schema({
  repo: { type: mongoose.Schema.Types.ObjectId, ref: "GithubRepository" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rawData: { type: mongoose.Schema.Types.Mixed },
});

export default mongoose.model("GithubPull", GithubPullSchema);
