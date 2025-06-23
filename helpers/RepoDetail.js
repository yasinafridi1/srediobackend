import GithubRepositoryModel from "../models/GithubRepositoryModel.js";
import { Types } from "mongoose";

async function repoDetail(userId, repoId) {
  const result = await GithubRepositoryModel.aggregate([
    {
      $match: {
        _id: new Types.ObjectId(repoId),
        userId: new Types.ObjectId(userId),
      },
    },
    {
      $addFields: {
        id: "$_id",
      },
    },
    // PULLS
    {
      $lookup: {
        from: "githubpulls",
        let: { repoId: "$_id", userId: userId },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$repo", "$$repoId"] },
                  { $eq: ["$userId", new Types.ObjectId(userId)] },
                ],
              },
            },
          },
          { $sort: { createdAt: -1 } },
          {
            $facet: {
              data: [{ $limit: 10 }],
              totalRecords: [{ $count: "count" }],
            },
          },
          {
            $project: {
              data: 1,
              totalRecords: {
                $ifNull: [{ $arrayElemAt: ["$totalRecords.count", 0] }, 0],
              },
            },
          },
        ],
        as: "pull",
      },
    },
    // COMMITS
    {
      $lookup: {
        from: "githubcommits",
        let: { repoId: "$_id", userId: userId },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$repo", "$$repoId"] },
                  { $eq: ["$userId", new Types.ObjectId(userId)] },
                ],
              },
            },
          },
          { $sort: { createdAt: -1 } },
          {
            $facet: {
              data: [{ $limit: 10 }],
              totalRecords: [{ $count: "count" }],
            },
          },
          {
            $project: {
              data: 1,
              totalRecords: {
                $ifNull: [{ $arrayElemAt: ["$totalRecords.count", 0] }, 0],
              },
            },
          },
        ],
        as: "commits",
      },
    },
    // ISSUES
    {
      $lookup: {
        from: "githubissues",
        let: { repoId: "$_id", userId: userId },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$repo", "$$repoId"] },
                  { $eq: ["$userId", new Types.ObjectId(userId)] },
                ],
              },
            },
          },
          { $sort: { createdAt: -1 } },
          {
            $facet: {
              data: [{ $limit: 10 }],
              totalRecords: [{ $count: "count" }],
            },
          },
          {
            $project: {
              data: 1,
              totalRecords: {
                $ifNull: [{ $arrayElemAt: ["$totalRecords.count", 0] }, 0],
              },
            },
          },
        ],
        as: "issues",
      },
    },
    // Final formatting
    {
      $project: {
        rawData: 1,
        pull: { $arrayElemAt: ["$pull", 0] },
        commits: { $arrayElemAt: ["$commits", 0] },
        issues: { $arrayElemAt: ["$issues", 0] },
      },
    },
  ]);

  return result?.[0];
}

export default repoDetail;
