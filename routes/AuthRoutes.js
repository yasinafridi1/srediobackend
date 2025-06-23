import { Router } from "express";
import {
  autoLogin,
  deleteGithubData,
  githubCallback,
  githubLogin,
  login,
  logout,
  register,
} from "../controllers/authController.js";
import validateBody from "../middlewares/Validator.js";
import { loginSchema, registerSchema } from "../validations/index.js";
import auth from "../middlewares/Auth.js";
const router = Router();

router.post("/login", validateBody(loginSchema), login);
router.post("/register", validateBody(registerSchema), register);
router.post("/auto-login", autoLogin);
router.get("/logout", auth, logout);
router.get("/github/login", auth, githubLogin);
router.get("/github/callback", githubCallback);
router.delete("/github/remove-github-data", auth, deleteGithubData);
export default router;
