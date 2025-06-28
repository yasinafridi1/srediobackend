import { Router } from "express";
import {
  airTableCallBack,
  connectAirtable,
  startScrapping,
  verifyMFA,
} from "../controllers/airtableController.js";
import auth from "../middlewares/Auth.js";
import validateBody from "../middlewares/Validator.js";
import {
  airtableLoginSchema,
  airtableMFASchema,
} from "../validations/index.js";

const router = Router();

router.post("/", auth, connectAirtable);
router.get("/callback", airTableCallBack);
router.post("/login", auth, validateBody(airtableLoginSchema), startScrapping);
router.post("/mfa", auth, validateBody(airtableMFASchema), verifyMFA);

export default router;
