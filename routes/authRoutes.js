const express = require("express");
const {
  googleLogin,
  googleCallback,
  logoutUser,
} = require("../controllers/authController");
const { verifyAccessToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/google", googleLogin);
router.get("/google/callback", googleCallback);
router.post("/logout", logoutUser);

// Protected user profile route
router.get("/user/profile/google", verifyAccessToken, async (req, res) => {
  console.log("Received Cookies:", req.cookies);
  if (!req.cookies.access_token) {
    return res.status(401).json({ message: "No access token found" });
  }
  res.json({ user: req.user });
});

module.exports = router;
