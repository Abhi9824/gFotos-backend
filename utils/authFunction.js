const axios = require("axios");
const { User } = require("../models/user.models");
const { generateToken } = require("./generateToken");
require("dotenv").config();

const googleLogin = (req, res) => {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=profile email`;
  res.redirect(googleAuthUrl);
};

const googleCallback = async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: "Authorization code not provided" });
  }
  try {
    // Exchange authorization code for an access token
    const { data } = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      })
    );

    const accessToken = data.access_token;

    // Fetch user info from Google
    const { data: userInfo } = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const { id: googleId, email, name } = userInfo;

    // Check if the user already exists in DB
    let user = await User.findOne({ googleId });
    if (!user) {
      user = new User({ googleId, email, name, userId: googleId });
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user);

    return res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
  } catch (error) {
    console.error("Google authentication failed:", error);
    res.status(500).json({ error: "Google authentication failed" });
  }
};

const logoutUser = (req, res) => {
  res.json({ message: "Logged out successfully" });
};

const getUserProfile = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json({ user: req.user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllUsers = async (req, res) => {
  const users = await User.find();
  return users;
};

module.exports = {
  googleLogin,
  googleCallback,
  logoutUser,
  getUserProfile,
  getAllUsers,
};
