// //perfectly woking
const jwt = require("jsonwebtoken");
const { User } = require("../models/user.models");
require("dotenv").config();

const verifyAccessToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized, token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorised, invalid token" });
  }
};

module.exports = { verifyAccessToken };
