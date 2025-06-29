import { Router } from "express";
import {
  airTableCallBack,
  connectAirtable,
  getAllCollections,
  getSingleCollectionData,
  removeAirTableData,
  loginAirTable,
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
router.post("/login", auth, validateBody(airtableLoginSchema), loginAirTable);
router.post("/mfa", auth, validateBody(airtableMFASchema), verifyMFA);
router.get("/collections", auth, getAllCollections);
router.get("/collection/:collectionName", auth, getSingleCollectionData);
router.delete("/", auth, removeAirTableData);

export default router;
