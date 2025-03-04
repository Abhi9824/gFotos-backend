// const multer = require("multer");

// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const cloudinary = require("../cloudinary/cloudinary.config");

// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "gFotos",
//     resource_type: "auto",
//     allowed_formats: ["jpg", "jpeg", "png", "gif"],
//   },
// });

// const upload = multer({ storage });

// module.exports = { upload };

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinary/cloudinary.config");

// Cloudinary Storage Setup
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "gFotos",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
  },
});

// File filter to check size before upload
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, and GIF files are allowed."), false);
  }
  cb(null, true);
};

// Multer Middleware (Max Size: 5MB)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = { upload };
