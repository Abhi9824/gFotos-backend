const { Album } = require("../models/album.models");
const { User } = require("../models/user.models");
const mongoose = require("mongoose");

const createAlbum = async (req) => {
  const { name, description } = req.body;
  if (!name) throw new Error("Name is required");

  if (!req.user || !req.user.userId) {
    throw new Error("User authentication failed, ownerId missing");
  }

  const album = new Album({
    name,
    description,
    ownerId: req.user.userId,
  });

  await album.save();
  return album;
};

// Update Album Description
const updateAlbumDescription = async (req) => {
  const { albumId } = req.params;
  const { description } = req.body;

  const album = await Album.findById(albumId);
  if (!album) throw new Error("Album not found");

  if (album.ownerId.toString() !== req.user.userId) {
    throw new Error("You are not the owner of this album");
  }

  album.description = description || album.description;
  await album.save();
  return album;
};
const shareAlbum = async (req) => {
  const { albumId } = req.params;
  let { emails } = req.body;

  const album = await Album.findById(albumId);
  if (!album) throw new Error("Album not found");

  if (album.ownerId.toString() !== req.user.userId) {
    throw new Error("You are not the owner of this album");
  }

  // Convert single email to an array if needed
  if (!Array.isArray(emails)) {
    emails = [emails];
  }

  // Find users by email and get their ObjectId
  const users = await User.find({ email: { $in: emails } }, "_id email");
  const userIds = users.map((user) => user._id); // Extract ObjectId values

  // Merge with existing sharedUsers and remove duplicates
  album.sharedUsers = [...new Set([...album.sharedUsers, ...userIds])];

  await album.save();

  // Populate sharedUsers with email info before returning
  const populatedAlbum = await Album.findById(albumId).populate(
    "sharedUsers",
    "email"
  );

  return populatedAlbum;
};

// Delete Album
const deleteAlbum = async (req) => {
  const { albumId } = req.params;

  const album = await Album.findById(albumId);
  if (!album) throw new Error("Album not found");

  if (album.ownerId.toString() !== req.user.userId) {
    throw new Error("You are not the owner of this album");
  }

  await Album.deleteOne({ _id: albumId });

  return album;
};

const getAllAlbums = async (req) => {
  const userId = new mongoose.Types.ObjectId(req.user.userId);
  const albums = await Album.find({
    $or: [{ ownerId: userId }, { sharedUsers: userId }],
  })
    .populate("images")
    .populate("ownerId", "email name")
    .populate("sharedUsers", "email name");

  return albums;
};

module.exports = {
  createAlbum,
  updateAlbumDescription,
  shareAlbum,
  deleteAlbum,
  getAllAlbums,
};
