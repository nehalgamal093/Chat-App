import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { getMessaging } from "firebase-admin/messaging";

// export const sendMessage = async (req, res) => {
//   try {
//     const { message } = req.body;
//     const { id: receiverId } = req.params;
//     const senderId = req.user._id;
//     let conversation = await Conversation.findOne({
//       participants: { $all: [senderId, receiverId] },
//     });
//     if (!conversation) {
//       conversation = await Conversation.create({
//         participants: [senderId, receiverId],
//       });
//     }

//     const newMessage = new Message({
//       senderId,
//       receiverId,
//       message,
//     });
//     if (newMessage) {
//       conversation.messages.push(newMessage._id);
//     }
//     let user = await User.findOne({ _id: senderId });
//     console.log("User is", `${user.fullName}`);
//     const notificationMsg = {
//       notification: {
//         // title: user.fullName,
//         // body: newMessage.message,
//       },
//       android: {
//         priority: "high",
//       },
//       data: {
//         senderId: JSON.stringify(newMessage.senderId),
//         senderImage: JSON.stringify(user.profilePic),
//         title: JSON.stringify(user.fullName),
//         body: JSON.stringify(newMessage.message),
//       },
//       token: req.user.fcmToken,
//     };
//     getMessaging()
//       .send(notificationMsg)
//       .then((response) => {
//         res.status(200).json({
//           message: "Successfully sent Message",
//           newMessage,

//           // token: receivedToken,
//         });

//         console.log("Successfully sent message");
//       })
//       .catch((error) => {
//         res.status(400);
//         res.send(error);
//         console.log("Error sending message", error);
//       });
//     await Promise.all([conversation.save(), newMessage.save()]);
//     const receiverSocketId = getReceiverSocketId(receiverId);
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("newMessage", newMessage);
//     }
//     // res.status(201).json(newMessage);
//   } catch (error) {
//     console.log("Error in sendMessage controller:", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
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
      mediaUrl = req.file.path; // Cloudinary file URL
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

    return res.status(201).json({ message: "Message sent", newMessage });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] },
    }).populate("messages");
    if (!conversation) return res.status(200).json([]);
    const messages = conversation.messages;
    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
