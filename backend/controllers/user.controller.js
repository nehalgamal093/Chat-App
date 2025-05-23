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
