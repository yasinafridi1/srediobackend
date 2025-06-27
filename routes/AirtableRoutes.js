import { Router } from "express";
import {
  airTableCallBack,
  connectAirtable,
} from "../controllers/airtableController.js";
import auth from "../middlewares/Auth.js";

const router = Router();

router.post("/", auth, connectAirtable);
router.get("/callback", airTableCallBack);

export default router;
