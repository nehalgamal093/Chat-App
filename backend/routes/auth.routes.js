import express from "express";
import {
  login,
  logout,
  signup,
  updateUser,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);

router.post("/login", login);
router.put("/update/:id", updateUser);
router.post("/logout", logout);

export default router;
