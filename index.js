const mongoose = require("mongoose");
const { initializeDatabase } = require("./db/db");
require("dotenv").config();
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
app.use(express.json());
app.use(cookieParser());
const path = require("path");
const cors = require("cors");
app.use(express.urlencoded({ extended: true }));

// Import routes
const {
  googleLogin,
  googleCallback,
  logoutUser,
  getUserProfile,
  getAllUsers,
} = require("./utils/authFunction");

const {
  createAlbum,
  updateAlbumDescription,
  shareAlbum,
  deleteAlbum,
  getAllAlbums,
} = require("./utils/albumFunction");
const {
  uploadImage,
  favoriteImage,
  addCommentToImage,
  deleteImage,
  getAllImagesInAlbum,
  getImagesByTags,
  getImageDetails,
  updateImage,
} = require("./utils/imageFunction");

const { verifyAccessToken } = require("./middleware/authMiddleware");
const { image } = require("./cloudinary/cloudinary.config");
const { upload } = require("./middleware/multer.middleware");

const corsOption = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};

app.use(cors(corsOption));
initializeDatabase();

// Static file handling (for image uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Authentication Routes
app.get("/auth/google", googleLogin);
app.get("/auth/google/callback", googleCallback);
app.post("/auth/logout", logoutUser);

// User Profile Route (Protected)
app.get("/auth/user/profile/google", verifyAccessToken, getUserProfile);

//get all users
app.get("/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    if (users) {
      res.status(200).json({ message: "Fetched all users", users });
    } else {
      res.status(404).json({ error: "Failed to fetch users" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
// Image Upload Route
app.post(
  "/images/:albumId/upload",
  verifyAccessToken,
  upload.single("file"),
  async (req, res) => {
    try {
      const albumWithImages = await uploadImage(req);
      if (albumWithImages) {
        res.status(201).json({
          message: "Image added successfully",
          image: albumWithImages,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);
app.put("/images/:imageId/update", verifyAccessToken, async (req, res) => {
  const { imageId } = req.params;

  // Validate image ID
  if (!mongoose.Types.ObjectId.isValid(imageId)) {
    return res.status(400).json({ message: "Invalid image ID" });
  }

  try {
    // Call the updateImage function
    const updatedImage = await updateImage(req);
    res.json({ image: updatedImage });
  } catch (error) {
    // Handle specific errors
    if (error.message === "Image not found") {
      return res.status(404).json({ message: "Image not found" });
    }
    if (error.message === "You are not the owner of this album") {
      return res
        .status(403)
        .json({ message: "You are not the owner of this album" });
    }

    res.status(500).json({ message: error.message });
  }
});
// Favorite Image Route
app.put(
  "/images/:albumId/:imageId/favorite",
  verifyAccessToken,
  async (req, res) => {
    try {
      const images = await favoriteImage(req);
      res.status(200).json({ image: images });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Add Comment to Image Route
app.post(
  "/images/:albumId/:imageId/comment",
  verifyAccessToken,
  async (req, res) => {
    try {
      const images = await addCommentToImage(req);
      res
        .status(200)
        .json({ message: "Added comment successfully", image: images });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Delete Image Route
app.delete("/images/:albumId/:imageId", verifyAccessToken, async (req, res) => {
  try {
    const message = await deleteImage(req);
    res.status(200).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get All Images in an Album
app.get(
  "/images/albums/:albumId/images",
  verifyAccessToken,
  async (req, res) => {
    try {
      const images = await getAllImagesInAlbum(req);
      if (!images || images.length === 0) {
        return res.status(404).json({ error: "No images found in this album" });
      }
      res
        .status(200)
        .json({ message: "Fetched images successfully", images: images });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//get Images by Tag
app.get(
  "/images/:albumId/images/by-tags",
  verifyAccessToken,
  async (req, res) => {
    try {
      const images = await getImagesByTags(req);
      if (images) {
        res.status(200).json({ message: "Fetched all images", image: images });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error", error });
    }
  }
);

//get image details
app.get(
  "/albums/:albumId/images/:imageId",
  verifyAccessToken,
  async (req, res) => {
    try {
      const image = await getImageDetails(req);
      if (image) {
        res
          .status(200)
          .json({ message: "Image details fetched successfully", image });
      } else {
        res.json({ message: "No image details found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Create Album Route
app.post("/albums", verifyAccessToken, async (req, res) => {
  try {
    const albums = await (
      await (await createAlbum(req)).populate("ownerId", "email")
    ).populate("sharedUsers", "email");
    res
      .status(201)
      .json({ message: "Album created successfully", album: albums });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update Album Description Route
app.put("/albums/:albumId", verifyAccessToken, async (req, res) => {
  try {
    const albums = await updateAlbumDescription(req);
    if (!albums) {
      return res.status(404).json({ error: "Album not found" });
    }
    res
      .status(200)
      .json({ message: "Album updated successfully", album: albums });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Share Album Route
app.post("/albums/:albumId/share", verifyAccessToken, async (req, res) => {
  try {
    const album = await shareAlbum(req);
    res.status(200).json(album);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//deleting the album
app.delete("/albums/:albumId", verifyAccessToken, async (req, res) => {
  try {
    const deletedAlbum = await deleteAlbum(req);
    res
      .status(200)
      .json({ message: "Album deleted successfully", album: deletedAlbum });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get All Albums Route
app.get("/albums", verifyAccessToken, async (req, res) => {
  try {
    const albums = await getAllAlbums(req);
    res
      .status(200)
      .json({ message: "Fetched all albums successfully", album: albums });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.use("/", (req, res) => {
  res.send("Hello guys");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT} port`);
});
