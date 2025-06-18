import mongoose from "mongoose";

const GithubIssueSchema = new mongoose.Schema({
  repo: { type: mongoose.Schema.Types.ObjectId, ref: "GithubRepository" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  url: String,
  repository_url: String,
  labels_url: String,
  comments_url: String,
  events_url: String,
  html_url: String,
  id: Number,
  node_id: String,
  number: Number,
  title: String,
  user: {
    login: String,
    id: Number,
    site_admin: Boolean,
  },
  state: String,
  locked: Boolean,
  assignees: [
    {
      login: String,
      id: Number,
      site_admin: Boolean,
    },
  ],
  labels: [],
  created_at: Date,
  updated_at: Date,
  closed_at: Date,
  closed_by: {
    login: String,
    id: Number,
    site_admin: Boolean,
  },
});

export default mongoose.model("GithubIssue", GithubIssueSchema);
