import { Router } from "express";
import auth from "../middlewares/Auth.js";
import {
  getCollectionDetail,
  getGithubCollections,
  getRepoCommits,
  getRepoDetails,
  getRepoIssues,
  getRepoPullRequests,
} from "../controllers/githubController.js";
const router = Router();

router.get("/collections", auth, getGithubCollections);
router.get("/collection/:collection", auth, getCollectionDetail);
router.get("/repo/detail/:repoId", auth, getRepoDetails);
router.get("/repo/pulls/:repoId", auth, getRepoPullRequests);
router.get("/repo/commits/:repoId", auth, getRepoCommits);
router.get("/repo/issues/:repoId", auth, getRepoIssues);

export default router;
