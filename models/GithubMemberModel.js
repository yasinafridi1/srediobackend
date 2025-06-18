import mongoose from "mongoose";

const GithubMemberSchema = new mongoose.Schema(
  {
    org: { type: mongoose.Schema.Types.ObjectId, ref: "GithubOrganizations" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    raw: mongoose.Schema.Types.Mixed, // Full member object
  },
  { timestamps: true }
);

export default mongoose.model("GithubMember", GithubMemberSchema);
