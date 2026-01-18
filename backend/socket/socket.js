import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/user.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:500",
      "https://chat-app-nehal-gamal.onrender.com",
    ],
    methods: ["GET", "POST"],
  },
});

const userSocketMap = new Map();

export const getReceiverSocketId = (userId) => {
  const sockets = userSocketMap.get(userId);
  return sockets ? [...sockets][0] : null;
};

const emitUserStatus = (userId, isOnline) => {
  io.emit("user-status-changed", {
    userId,
    isOnline,
  });
};

io.on("connection", async (socket) => {
  console.log("🔌 Connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (!userId) return;

  socket.userId = userId;
  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, new Set());

    await User.findByIdAndUpdate(userId, { isOnline: true });

    emitUserStatus(userId, true);
  }

  userSocketMap.get(userId).add(socket.id);

  io.emit("getOnlineUsers", [...userSocketMap.keys()]);

  socket.on("user-online-chat", async () => {
    await User.findByIdAndUpdate(userId, { activeChatUserId: true });

    io.emit("update-chat-status", {
      userId,
      activeChatUserId: true,
    });
  });

  socket.on("chat-disconnected", async () => {
    await User.findByIdAndUpdate(userId, { activeChatUserId: false });

    io.emit("update-chat-status", {
      userId,
      activeChatUserId: false,
    });
  });

  socket.on("disconnect", async () => {
    console.log("❌ Disconnected:", socket.id);

    const sockets = userSocketMap.get(userId);
    if (!sockets) return;

    sockets.delete(socket.id);

    if (sockets.size === 0) {
      userSocketMap.delete(userId);

      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        activeChatUserId: false,
      });

    
      emitUserStatus(userId, false);

      io.emit("update-chat-status", {
        userId,
        activeChatUserId: false,
      });
    }

    io.emit("getOnlineUsers", [...userSocketMap.keys()]);
  });
});

export { app, io, server };
