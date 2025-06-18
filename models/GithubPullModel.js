import mongoose from "mongoose";

const GithubPullSchema = new mongoose.Schema({
  repo: { type: mongoose.Schema.Types.ObjectId, ref: "GithubRepository" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  id: Number,
  url: String,
  state: String,
  title: String,
  body: String,
  locked: Boolean,
  user: {
    login: String,
    id: Number,
    site_admin: Boolean,
  },
  created_at: Date,
  updated_at: Date,
  closed_at: Date,
  merged_at: Date,
  assignees: [
    {
      login: String,
      id: Number,
      site_admin: Boolean,
    },
  ],
  requested_reviewers: [
    {
      login: String,
      id: Number,
      site_admin: Boolean,
    },
  ],
  commits_url: String,
});

export default mongoose.model("GithubPull", GithubPullSchema);
