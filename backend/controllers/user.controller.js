import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getUsersForSidebar", error.message);
    res.status(500).json({ error: "Internal Server error" });
  }
};
export const addFriend = async (req, res) => {
  const userId = req.user._id;
  const friendId = req.params.friendId;

  if (userId.toString() === friendId) {
    return res
      .status(400)
      .json({ error: "You cannot add yourself as a friend" });
  }

  try {
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!friend) {
      return res.status(404).json({ error: "User to add not found" });
    }

    if (user.friends.includes(friendId)) {
      return res.status(400).json({ error: "Already friends" });
    }

    user.friends.push(friendId);
    await user.save();

    res.status(200).json({ message: "Friend added successfully" });
  } catch (error) {
    console.error("Error in addFriend:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate(
      "friends",
      "-password -email -fcmToken"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error in getFriends:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const sendFriendRequest = async (req, res) => {
  const senderId = req.user._id;
  const receiverId = req.params.receiverId;

  if (senderId.toString() === receiverId) {
    return res
      .status(400)
      .json({ error: "You can't send a request to yourself" });
  }

  try {
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!receiver) return res.status(404).json({ error: "User not found" });
    if (sender.friends.includes(receiverId))
      return res.status(400).json({ error: "Already friends" });
    if (receiver.friendRequests.includes(senderId))
      return res.status(400).json({ error: "Request already sent" });

    receiver.friendRequests.push(senderId);
    sender.sentRequests.push(receiverId);

    await receiver.save();
    await sender.save();

    res.status(200).json({ message: "Friend request sent" });
  } catch (err) {
    console.error("Error in sendFriendRequest:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const cancelFriendRequest = async (req, res) => {
  const senderId = req.user._id;
  const receiverId = req.params.receiverId;

  try {
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    sender.sentRequests = sender.sentRequests.filter(
      (id) => id.toString() !== receiverId
    );
    receiver.friendRequests = receiver.friendRequests.filter(
      (id) => id.toString() !== senderId
    );

    await sender.save();
    await receiver.save();

    res.status(200).json({ message: "Friend request canceled" });
  } catch (err) {
    console.error("Error in cancelFriendRequest:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const acceptFriendRequest = async (req, res) => {
  const receiverId = req.user._id;
  const senderId = req.params.senderId;

  try {
    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    if (!receiver.friendRequests.includes(senderId)) {
      return res.status(400).json({ error: "No request from this user" });
    }

    receiver.friendRequests = receiver.friendRequests.filter(
      (id) => id.toString() !== senderId
    );
    sender.sentRequests = sender.sentRequests.filter(
      (id) => id.toString() !== receiverId
    );

    receiver.friends.push(senderId);
    sender.friends.push(receiverId);

    await receiver.save();
    await sender.save();

    res.status(200).json({ message: "Friend request accepted" });
  } catch (err) {
    console.error("Error in acceptFriendRequest:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const declineFriendRequest = async (req, res) => {
  const receiverId = req.user._id;
  const senderId = req.params.senderId;

  try {
    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    receiver.friendRequests = receiver.friendRequests.filter(
      (id) => id.toString() !== senderId
    );
    sender.sentRequests = sender.sentRequests.filter(
      (id) => id.toString() !== receiverId
    );

    await receiver.save();
    await sender.save();

    res.status(200).json({ message: "Friend request declined" });
  } catch (err) {
    console.error("Error in declineFriendRequest:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "friendRequests",
      "fullName username profilePic"
    );

    res.status(200).json(user.friendRequests);
  } catch (err) {
    console.error("Error in getFriendRequests:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const getChattedUsers = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all conversations where the user is a participant
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate({
        path: "participants",
        select:
          "-password -email -fcmToken -friends -friendRequests -sentRequests",
      })
      .populate({
        path: "messages",
        options: { sort: { createdAt: -1 }, limit: 1 }, // Get only the last message
      });

    // Process the conversations to get user details and last message
    const chattedUsers = conversations.map((conversation) => {
      // Find the other participant (not the current user)
      const otherParticipant = conversation.participants.find(
        (participant) => participant._id.toString() !== userId.toString()
      );

      return {
        user: otherParticipant,
        lastMessage: conversation.messages[0] || null,
        conversationId: conversation._id,
      };
    });

    // Sort by most recent message
    chattedUsers.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return (
        new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
      );
    });

    res.status(200).json(chattedUsers);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const userId = req.params.userId;

    // Find the user and populate their friends (without sensitive info)
    const user = await User.findById(userId)
      .select("-password -email -fcmToken -friendRequests -sentRequests")
      .populate("friends", "fullName username profilePic");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the logged-in user is friends with this user
    const isFriend = user.friends.some(
      (friend) => friend._id.toString() === loggedInUserId.toString()
    );

    // Check if there's a pending friend request
    const loggedInUser = await User.findById(loggedInUserId);
    const hasPendingRequest = loggedInUser.sentRequests.includes(user._id);
    const hasReceivedRequest = loggedInUser.friendRequests.includes(user._id);

    const friendStatus = isFriend
      ? "friends"
      : hasPendingRequest
      ? "request_sent"
      : hasReceivedRequest
      ? "request_received"
      : "not_friends";

    res.status(200).json({
      ...user.toObject(),
      friendStatus,
    });
  } catch (error) {
    console.error("Error in getUserProfile:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const searchUsers = async (req, res) => {
  try {
    const searchTerm = req.query.term;

    if (!searchTerm || searchTerm.trim() === "") {
      return res.status(400).json({ error: "Search term is required" });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: searchTerm, $options: "i" } },
        { fullName: { $regex: searchTerm, $options: "i" } },
      ],
    }).select("-password -email -fcmToken");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsers:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const getUserFromQR = async (req, res) => {
  const { identifier } = req.params;

  try {
    const user = await User.findOne({
      $or: [{ _id: identifier }, { username: identifier }],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "success" });
  } catch (error) {
    console.error("Error in getUserFromQR:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


