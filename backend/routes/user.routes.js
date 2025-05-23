import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import {
  getUsersForSidebar,
  addFriend,
  getFriends,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", protectRoute, getUsersForSidebar);
router.post("/add-friend/:friendId", protectRoute, addFriend);
router.get("/friends", protectRoute, getFriends);

export default router;
