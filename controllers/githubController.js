import mongoose from "mongoose";
import AsyncWrapper from "../helpers/AsyncWrapper.js";
import ErrorHandler from "../helpers/ErrorHandler.js";
import SuccessMessage from "../helpers/SuccessMessage.js";
import GithubIntegration from "../models/GithubIntegrationModel.js";

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
  console.log("userId", userId);
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

  const flateStage1 = (data) => {
    return {
      _id: data._id,
      userId: data?.userId,
      ...(data?.repo && { repo: data?.repo }),
      ...data.rawData,
    };
  };

  const flateStage2 = (obj, prefix = "") => {
    return Object.keys(obj).reduce((acc, key) => {
      const value = obj[key];
      const prefixedKey = prefix ? `${prefix}_${key}` : key;

      if (value instanceof mongoose.Types.ObjectId) {
        acc[prefixedKey] = value.toString();
      } else if (Array.isArray(value)) {
        // Handle array of primitives or objects
        if (value.every((v) => typeof v !== "object" || v === null)) {
          acc[prefixedKey] = value.join(", ");
        } else {
          value.forEach((el, idx) => {
            const nested = flateStage2(el, `${prefixedKey}[${idx}]`);
            Object.assign(acc, nested);
          });
        }
      } else if (typeof value === "object" && value !== null) {
        Object.assign(acc, flateStage2(value, prefixedKey));
      } else {
        acc[prefixedKey] = value;
      }

      return acc;
    }, {});
  };

  data = data.map((item) => flateStage1(item));
  // data = data.map((item) => flateStage2(item));
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
