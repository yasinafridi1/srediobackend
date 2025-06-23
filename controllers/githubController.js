import mongoose from "mongoose";
import AsyncWrapper from "../helpers/AsyncWrapper.js";
import ErrorHandler from "../helpers/ErrorHandler.js";
import SuccessMessage from "../helpers/SuccessMessage.js";
import GithubIntegration from "../models/GithubIntegrationModel.js";
import UserModel from "../models/UserModel.js";
import repoDetail from "../helpers/RepoDetail.js";
import { flattenData } from "../helpers/StructureGithubData.js";
import GithubPullModel from "../models/GithubPullModel.js";
import GithubCommit from "../models/GithubCommitsModel.js";
import GithubIssuesModel from "../models/GithubIssuesModel.js";

export const getGithubCollections = AsyncWrapper(async (req, res, next) => {
  const githubData = await GithubIntegration.findOne({ userId: req.user._id });
  if (!githubData) {
    return next(new ErrorHandler("You have not connected github yet", 400));
  }

  if (githubData.dataSync === "PENDING") {
    return SuccessMessage(res, "Server is syncing github data", {
      isSyncing: true,
    });
  }

  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections
    .filter(
      (col) =>
        col.name.toLowerCase().includes("github") &&
        col.name.toLowerCase() !== "githubintegrations"
    )
    .map((col) => col.name);

  return SuccessMessage(res, "Collection fetched successfully", {
    collectionNames,
    githubData,
  });
});

export const getCollectionDetail = AsyncWrapper(async (req, res, next) => {
  const { collection } = req.params;
  const userId = req.user._id;
  const { page = 1, limit = 20 } = req.query;

  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections
    .filter(
      (col) =>
        col.name.toLowerCase().includes("github") &&
        col.name.toLowerCase() !== "githubintegrations"
    )
    .map((col) => col.name);

  const matchedCollection = collectionNames.find(
    (colName) => colName.toLowerCase() === collection.toLowerCase()
  );

  if (!matchedCollection) {
    return next(new ErrorHandler("Collection not found", 404));
  }

  const skip = (page - 1) * limit;

  const CollectionModel = mongoose.connection.db.collection(matchedCollection);
  let data = await CollectionModel.find({
    userId: new mongoose.Types.ObjectId(userId),
  })
    .skip(skip)
    .limit(parseInt(limit))
    .toArray();

  // console.log("Data ==>", data);

  const flateStage1 = (data) => {
    return {
      _id: data._id,
      userId: data?.userId,
      ...(data?.repo && { repo: data?.repo }),
      ...(data?.issue && { issue_id: data?.issue }),
      ...data.rawData,
    };
  };

  data = data.map((item) => flateStage1(item));
  const total = await CollectionModel.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
  });
  return SuccessMessage(res, "Collection data fetched successfully", {
    data,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
    totalItems: total,
    itemsPerPage: parseInt(limit),
  });
});

export const getRepoDetails = AsyncWrapper(async (req, res, next) => {
  const userId = req.user._id;
  const userData = await UserModel.findById(userId);

  if (!userData) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (!userData.github) {
    return next(new ErrorHandler("User has not connected github yet", 400));
  }

  const result = await repoDetail(userId, req.params.repoId);

  const { rawData, pull, commits, issues } = result;
  const flattenRepo = flattenData(rawData);
  const flattenPulls = pull.data.map((item) => flattenData(item));
  const flattenCommits = commits.data.map((item) => flattenData(item));
  const flattenIssues = issues.data.map((item) => flattenData(item));

  return SuccessMessage(res, "Repo detail fetched successfully", {
    repoData: flattenRepo,
    pullRequests: {
      data: flattenPulls,
      totalRecords: pull.totalRecords,
      totalPages: Math.ceil(pull.totalRecords / 10),
      currentPage: 1,
    },
    commits: {
      data: flattenCommits,
      totalRecords: commits.totalRecords,
      totalPages: Math.ceil(commits.totalRecords / 10),
      currentPage: 1,
    },
    issues: {
      data: flattenIssues,
      totalRecords: issues.totalRecords,
      totalPages: Math.ceil(issues.totalRecords / 10),
      currentPage: 1,
    },
  });
});

export const getRepoPullRequests = AsyncWrapper(async (req, res, next) => {
  const userId = req.user._id;
  const { page = 1, limit = 20 } = req.query;
  const userData = await UserModel.findById(userId);
  if (!userData) {
    return next(new ErrorHandler("User not found", 404));
  }
  if (!userData.github) {
    return next(new ErrorHandler("User has not connected github yet", 400));
  }
  const skip = (page - 1) * limit;
  const result = await GithubPullModel.find({
    repo: new mongoose.Types.ObjectId(req.params.repoId),
  })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const totalRecords = await GithubPullModel.countDocuments({
    repo: req.params.repoId,
  });

  const flateData = result.map((item) => flattenData(item));
  return SuccessMessage(res, "Pull fetched successfully", {
    flateData,
    totalPages: Math.ceil(totalRecords / limit),
    currentPage: Number(page),
  });
});

export const getRepoCommits = AsyncWrapper(async (req, res, next) => {
  const userId = req.user._id;
  const { page = 1, limit = 20 } = req.query;
  const userData = await UserModel.findById(userId);
  if (!userData) {
    return next(new ErrorHandler("User not found", 404));
  }
  if (!userData.github) {
    return next(new ErrorHandler("User has not connected github yet", 400));
  }
  const skip = (page - 1) * limit;
  const result = await GithubCommit.find({
    repo: new mongoose.Types.ObjectId(req.params.repoId),
  })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const totalRecords = await GithubCommit.countDocuments({
    repo: req.params.repoId,
  });

  const flateData = result.map((item) => flattenData(item));
  return SuccessMessage(res, "Commits fetched successfully", {
    flateData,
    totalPages: Math.ceil(totalRecords / limit),
    currentPage: Number(page),
  });
});

export const getRepoIssues = AsyncWrapper(async (req, res, next) => {
  const userId = req.user._id;
  const { page = 1, limit = 20 } = req.query;
  const userData = await UserModel.findById(userId);
  if (!userData) {
    return next(new ErrorHandler("User not found", 404));
  }
  if (!userData.github) {
    return next(new ErrorHandler("User has not connected github yet", 400));
  }
  const skip = (page - 1) * limit;
  const result = await GithubIssuesModel.find({
    repo: new mongoose.Types.ObjectId(req.params.repoId),
  })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const totalRecords = await GithubIssuesModel.countDocuments({
    repo: req.params.repoId,
  });

  const flateData = result.map((item) => flattenData(item));
  return SuccessMessage(res, "Issues fetched successfully", {
    flateData,
    totalPages: Math.ceil(totalRecords / limit),
    currentPage: Number(page),
  });
});
