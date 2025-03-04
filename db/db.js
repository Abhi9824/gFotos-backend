const mongoose = require("mongoose");
require("dotenv").config();
const mongoURI = process.env.MONGODB;

const initializeDatabase = async () => {
  try {
    const connection = await mongoose.connect(mongoURI);
    if (connection) {
      console.log("Database Connection Successfully");
    } else {
      console.error("Database Connection Error");
    }
  } catch (error) {
    console.log("Connection Failed");
  }
};

module.exports = { initializeDatabase };
