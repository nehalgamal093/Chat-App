import express from "express";
import {
  login,
  logout,
  signup,
  updateUser,
  updateBio,
  uploadProfilePic
} from "../controllers/auth.controller.js";
import protectRoute from "../middleware/protectRoute.js";
import upload from "../utils/multer.js";
const router = express.Router();

router.post("/signup", signup);

router.post("/login", login);
router.put("/update/:id", updateUser);
router.put("/update-bio",protectRoute, updateBio);

router.post("/update-photo",protectRoute,upload.single("profilePicture"), uploadProfilePic);
router.post("/logout", logout);

export default router;
