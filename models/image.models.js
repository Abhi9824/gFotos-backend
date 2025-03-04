const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const imageSchema = new mongoose.Schema({
  imageId: { type: String, default: () => uuidv4(), unique: true },
  albumId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Album",
  },
  name: { type: String, required: true },
  tags: [{ type: String }],
  person: { type: String },
  isFavorite: { type: Boolean, default: false },
  comments: [{ type: String }],
  size: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now },
  imageUrl: { type: String, required: true },
  isShareable: { type: Boolean, default: false },
  publicId: { type: String, required: true },
});

const Image = mongoose.model("Image", imageSchema);
module.exports = { Image };
