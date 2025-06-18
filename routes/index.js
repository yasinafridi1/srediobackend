import { Router } from "express";
import AuthRoutes from "./AuthRoutes.js";
import GithubRoutes from "./GithubRoutes.js";
const router = Router();

router.get("/health", (req, res) => {
  return res.status(200).json({ message: "Server is up and running" });
});

router.use("/auth", AuthRoutes);
router.use("/github", GithubRoutes);

export default router;
