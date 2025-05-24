import express from "express";
import { getMessages, sendMessage } from "../controllers/message.controller.js";
import protectRoute from "../middleware/protectRoute.js";
import upload from "../utils/multer.js";
const router = express.Router();
router.get("/:id", protectRoute, getMessages);
// router.post("/send/:id", protectRoute, sendMessage);
router.post("/send/:id", protectRoute, upload.single("file"), sendMessage);
export default router;
