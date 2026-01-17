import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/user.model.js";
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:500", "https://chat-app-nehal-gamal.onrender.com"],
    method: ["GET", "POST"],
  },
});

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};
const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
  const userId = socket.handshake.query.userId;
  if (userId && userId != "undefined") {
    socket.userId = userId;
    userSocketMap[userId] = socket.id
    User.findByIdAndUpdate(userId, { isOnline: true }).then(() => {
      console.log(userId, "is online");
    });
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  };


  socket.on("user-online", async (id) => {
    await User.findByIdAndUpdate(id, { isOnline: true });
    io.emit("update-user-status", { userId: id, isOnline: true });
  });
  socket.on("user-online-chat", async (id) => {
    console.log("🟢 User entered chat");
    await User.findByIdAndUpdate(id, { activeChatUserId: true });
    io.emit("update-chat-status", { userId: id, activeChatUserId: true });
  });
  socket.on("chat-disconnected", async (id) => {
    console.log("🔴 User disconnected chat");
    await User.findByIdAndUpdate(id, { activeChatUserId: false });
    io.emit("update-chat-status", { userId: id, activeChatUserId: false });
  });
  socket.on("disconnect", async () => {
    console.log("User disconnected", socket.id);

    if (socket.userId) {
      const id = socket.userId;
      console.log("🔴 User disconnected chat from disconnect");
      await User.findByIdAndUpdate(id, { isOnline: false });
      io.emit("update-user-status", { userId: id, isOnline: false });
      io.emit("update-chat-status", { userId: id, activeChatUserId: false });
      delete userSocketMap[id];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));

      console.log(id, "went offline");
    }
  });
});
export { app, io, server };
