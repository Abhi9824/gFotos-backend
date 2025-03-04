const express = require("express");
const imageController = require("../controllers/imageController");
const { verifyAccessToken } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/multer.middleware");

const router = express.Router();

router.post(
  "/:albumId/images",
  verifyAccessToken,
  upload.single("file"),
  imageController.uploadImage
);
router.put(
  "/:albumId/images/:imageId/favorite",
  verifyAccessToken,
  imageController.favoriteImage
);
router.post(
  "/:albumId/images/:imageId/comments",
  verifyAccessToken,
  imageController.addCommentToImage
);
router.delete(
  "/:albumId/images/:imageId",
  verifyAccessToken,
  imageController.deleteImage
);

module.exports = router;
