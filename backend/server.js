import express, { json } from "express";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";
import connectToMongoDB from "./db/connectToMongoDB.js";
// import cookieParser from "cookie-parser";
import { app, server } from "./socket/socket.js";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

dotenv.config();
app.use(express.json());
// app.use(cookieParser());
process.env.GOOGLE_APPLICATION_CREDENTIALS;
initializeApp({
  credential: applicationDefault(),
  projectId: process.env.PROJECT_ID,
});
app.post("/notification", function (req, res) {
  const receivedToken = req.body.fcmToken;
  const message = {
    notification: {
      title: "Notification",
      body: "This is a test notification",
    },
    token: "dG_M1R7dSEu8yZOMzNbCAA:APA91bFc5Br41GLuWNBpml9hY6icNqeDwUZ5CiePrDsdhguf_7IZgmTR2kQQR-2dvM_pY-kioXNkZXlV2-cEhD4NAaRWI58WHKtqQzKEaVpc6Rsg-fm4ri0",
  };
  getMessaging()
    .send(message)
    .then((response) => {
      res.status(200).json({
        message: "Successfully sent Message",
        token: receivedToken,
      });
      console.log("Successfully sent message");
    })
    .catch((error) => {
      res.status(400);
      res.send(error);
      console.log("Error sending message", error);
    });
});
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use(express.static(path.join(__dirname, "/frontend/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

server.listen(PORT, () => {
  connectToMongoDB();
  console.log(`Server running on port ${PORT}!!`);
});
