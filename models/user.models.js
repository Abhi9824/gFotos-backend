const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, unique: true, required: true },
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String },
  },

  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = { User };
