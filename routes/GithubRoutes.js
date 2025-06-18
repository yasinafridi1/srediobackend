import { Router } from "express";
import auth from "../middlewares/Auth.js";
import {
  getCollectionDetail,
  getGithubCollections,
} from "../controllers/githubController.js";
const router = Router();

router.get("/collections", auth, getGithubCollections);
router.get("/collection/:collection", auth, getCollectionDetail);

export default router;
