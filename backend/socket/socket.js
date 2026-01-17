import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:500","https://chat-app-nehal-gamal.onrender.com"],
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
  if (userId != "undefined") userSocketMap[userId] = socket.id;
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("user-online", async (userId) => {
    await User.findByIdAndUpdate(userId, { isOnline: true });
    console.log(userId, "is online");
    io.emit("update-user-status", { userId, isOnline: true });
  });
  socket.on("disconnect",async () => {
    console.log("user disconnected", socket.id);
  const userId = socket.userId;
    if (userId) {
      console.log("YEEEES");
      await User.findByIdAndUpdate(userId, { isOnline: false });
      io.emit("update-user-status", { userId, isOnline: false });
      console.log(userId, "went offline");
    }
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});
export { app, io, server };
