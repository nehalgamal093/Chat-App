import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
// import generateTokenAndSetCookie from "../utils/generateToken.js";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  try {
    const {
      fullName,
      username,
      email,
      password,
      confirmPassword,
      gender,
      fcmToken,
    } = req.body;
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Password don't match" });
    }
    const user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ error: "Username already exists" });
    }
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already in use" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
      gender,
      profilePicture,
      fcmToken,
    });
    if (newUser) {
      await newUser.save();
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        profilePicture: profilePicture,
        fcmToken: newUser.fcmToken,
      });
    } else {
      res.status(400).json({ error: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user?.password || ""
    );
    if (!user || !isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    // generateTokenAndSetCookie(user._id, res);
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "300d",
    });
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePicture: user.profilePicture,
      token: token,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res, next) => {
  const { id } = req.params;

  let result = await User.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  !result && next(`User not found ${req.originalUrl}`, 404);

  result && res.json({ message: "success", result });
};
export const updateBio = async (req, res, next) => {
  const { bio } = req.body;
  let result = await User.findByIdAndUpdate(req.user.id, { bio }, { new: true });
  console.log('Result ⭕', result);
  !result && next(`User not found ${req.originalUrl}`, 404);

  result && res.json({ message: "Bio updated" });
};
export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out Successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const uploadProfilePic = async (req, res) => {
  try {

    const { profilePicture } = req.body;
    let mediaUrl = null;
    let mediaType = "none";

    if (req.file) {
      mediaUrl = req.file.path; // Cloudinary file URL
      mediaType = req.file.mimetype.startsWith("image");
    }

    let result = await User.findByIdAndUpdate(req.user.id, { profilePicture: mediaUrl }, { new: true });
    console.log("Result is 🛑", profilePicture, mediaType);
    !result && next(`User not found ${req.originalUrl}`, 404);

    result && res.json({ message: "Photo uploaded", profilePicture: mediaUrl });
  } catch (error) {
    console.error("Error uploading:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};