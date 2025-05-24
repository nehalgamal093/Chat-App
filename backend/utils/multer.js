// utils/multer.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "chat_app_media",
    allowed_formats: ["jpg", "png", "jpeg", "mp4", "mov"],
    resource_type: "auto",
  },
});

const upload = multer({ storage });

export default upload;
