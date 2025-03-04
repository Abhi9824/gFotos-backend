const { Image } = require("../models/image.models");
const { Album } = require("../models/album.models");
const cloudinary = require("../cloudinary/cloudinary.config");
const mongoose = require("mongoose");

const uploadImage = async (req) => {
  const { albumId } = req.params;
  const { tags, person, isFavorite } = req.body;

  if (!req.file) {
    throw new Error("No file uploaded");
  }

  // Check if album exists
  const album = await Album.findById(albumId).populate("images");
  if (!album) {
    throw new Error("Album not found");
  }

  // Check if user owns the album
  if (album.ownerId.toString() !== String(req.user.userId)) {
    throw new Error("You are not the owner of this album");
  }

  // Upload file to Cloudinary
  const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
    folder: "gFotos",
    resource_type: "image",
  });

  // Save image details in MongoDB
  const newImage = new Image({
    albumId,
    name: req.file.originalname,
    tags: Array.isArray(tags) ? tags : tags ? tags.split(",") : [],
    person: person || null,
    isFavorite: isFavorite === "true",
    size: req.file.size,
    uploadedAt: new Date(),
    imageUrl: uploadedImage.secure_url,
    isShareable: false,
    publicId: uploadedImage.public_id,
  });

  const savedImage = await newImage.save();
  album.images.push(savedImage._id);
  await album.save();

  return await Album.findById(albumId).populate("images");
};

//updated IMage
const updateImage = async (req) => {
  const { imageId } = req.params;
  const { tags, person, isFavorite } = req.body;

  // Find existing image
  const existingImage = await Image.findById(imageId);
  if (!existingImage) {
    throw new Error("Image not found");
  }

  // Check if user owns the album
  const album = await Album.findById(existingImage.albumId);
  if (!album || album.ownerId.toString() !== String(req.user.userId)) {
    throw new Error("You are not the owner of this album");
  }
  if (tags !== undefined) {
    if (Array.isArray(tags)) {
      existingImage.tags = tags; 
    } else if (typeof tags === "string") {
      existingImage.tags = tags.split(",").map((tag) => tag.trim()); 
    }
  }

  if (person !== undefined) existingImage.person = person;
  if (isFavorite !== undefined) {
    existingImage.isFavorite = isFavorite === "true";
  }

  await existingImage.save();
  return existingImage;
};

// 5.2 Toggle Favorite Status
const favoriteImage = async (req) => {
  const { albumId, imageId } = req.params;

  const image = await Image.findOne({ albumId, _id: imageId });
  if (!image) {
    throw new Error("Image not found");
  }

  image.isFavorite = !image.isFavorite;
  await image.save();

  return image;
};

const addCommentToImage = async (req) => {
  const { albumId, imageId } = req.params;
  const { comments } = req.body;
  const userId = req.user.userId; 


  // Check if the album exists and fetch its owner and sharedUsers
  const album = await Album.findById(albumId);
  if (!album) {
    throw new Error("Album not found");
  }

  // Check if the user is either the owner or in sharedUsers
  const isOwner = album.ownerId.toString() === userId;
  const isSharedUser = album.sharedUsers.some(
    (sharedUser) => sharedUser.toString() === userId
  );

  if (!isOwner && !isSharedUser) {
    throw new Error("You do not have permission to comment on this image");
  }

  // Find the image within the album
  const image = await Image.findOne({
    albumId: new mongoose.Types.ObjectId(albumId),
    _id: imageId,
  });

  if (!image) {
    throw new Error("Image not found");
  }

  // Add comment and save
  image.comments.push(comments);
  await image.save();

  return image;
};

// 5.4 Delete Image
const deleteImage = async (req) => {
  const { albumId, imageId } = req.params;

  const image = await Image.findOne({ albumId, _id: imageId });
  if (!image) {
    throw new Error("Image not found");
  }

  // Delete from Cloudinary using publicId
  await cloudinary.uploader.destroy(image.publicId);

  await image.deleteOne();
  return { message: "Image deleted successfully" };
};

const getAllImagesInAlbum = async (req) => {
  const { albumId } = req.params;

  const images = await Image.find({ albumId });
  return images;
};

const getImagesByTags = async (req) => {
  const { albumId } = req.params;
  const tags = req.query.tags ? req.query.tags.split(",") : null;

  let filter = { albumId };
  if (tags) {
    filter.tags = { $in: tags };
  }

  return await Image.find(filter);
};

const getImageDetails = async (req) => {
  const { albumId, imageId } = req.params;

  try {
    const album = await Album.findOne({ _id: albumId });
    if (album) {
      const image = await Image.findOne({
        _id: imageId,
      }).populate("albumId");

      return image;
    }
  } catch (error) {
    console.error("Error fetching image details:", error);
    return null;
  }
};

module.exports = {
  uploadImage,
  favoriteImage,
  addCommentToImage,
  deleteImage,
  getAllImagesInAlbum,
  getImageDetails,
  getImagesByTags,
  updateImage,
};
