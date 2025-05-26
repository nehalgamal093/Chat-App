import User from "../models/user.model.js";

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
