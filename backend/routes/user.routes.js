import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import {
  getUsersForSidebar,
  addFriend,
  getFriends,
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getFriendRequests,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", protectRoute, getUsersForSidebar);
router.post("/add-friend/:friendId", protectRoute, addFriend);
router.get("/friends", protectRoute, getFriends);
router.post("/send-request/:receiverId", protectRoute, sendFriendRequest);
router.post("/cancel-request/:receiverId", protectRoute, cancelFriendRequest);
router.post("/accept-request/:senderId", protectRoute, acceptFriendRequest);
router.post("/decline-request/:senderId", protectRoute, declineFriendRequest);
router.get("/requests", protectRoute, getFriendRequests);
export default router;
