import mongoose from "mongoose";

const GithubCommitSchema = new mongoose.Schema(
  {
    repo: { type: mongoose.Schema.Types.ObjectId, ref: "GithubRepository" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    node_id: String,
    commit: {
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
      tree: {
        sha: String,
        url: String,
      },
      comment_count: Number,
    },
    url: String,
    html_url: String,
    comments_url: String,
    author: {
      login: String,
      id: Number,
      url: String,
      site_admin: Boolean,
    },
    committer: {
      login: String,
      id: Number,
      url: String,
      site_admin: Boolean,
    },
  },
  { timestamps: true }
);

const GithubCommit = mongoose.model("GithubCommit", GithubCommitSchema);
export default GithubCommit;
