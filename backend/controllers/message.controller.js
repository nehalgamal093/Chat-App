import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { getMessaging } from "firebase-admin/messaging";

export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    let mediaUrl = null;
    let mediaType = "none";

    if (req.file) {
      mediaUrl = req.file.path; 
      mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
    }
     
    const newMessage = new Message({
      senderId,
      receiverId,
      message,
      mediaUrl,
      mediaType,
    });

    conversation.messages.push(newMessage._id);

    await Promise.all([conversation.save(), newMessage.save()]);

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
await getMessaging().send({
  token: receiver.fcmToken,
  notification: {
    title: "New message",
    body: newMessage.mediaType? " Media": newMessage.message
  },
  data: {
    senderId: senderId.toString(),
  },
});
    return res.status(201).json({ message: "Message sent", newMessage });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId, page } = req.params;
    const senderId = req.user._id;

    const pageNumber = parseInt(page) || 1;
    const limit = 15;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] },
    });

    if (!conversation) {
      return res.status(200).json({ messages: [], totalPages: 0 });
    }

    const totalMessages = await Message.countDocuments({
      _id: { $in: conversation.messages },
    });

    const totalPages = Math.ceil(totalMessages / limit);

    const skip = (pageNumber - 1) * limit;

    const messages = await Message.find({
      _id: { $in: conversation.messages },
    })
      .sort({ createdAt: -1 }) // Newest to oldest
      .skip(skip)
      .limit(limit);

    // Reverse so messages appear oldest → newest

    return res.status(200).json({
      messages: messages,
      currentPage: pageNumber,
      totalPages,
    });
  } catch (error) {
    console.error("Error in getMessages controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
