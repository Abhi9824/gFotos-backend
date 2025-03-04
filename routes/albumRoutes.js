const express = require("express");
const albumController = require("../controllers/albumController");
const { verifyAccessToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", verifyAccessToken, albumController.createAlbum);
router.put(
  "/:albumId",
  verifyAccessToken,
  albumController.updateAlbumDescription
);
router.post("/:albumId/share", verifyAccessToken, albumController.shareAlbum);
router.delete("/:albumId", verifyAccessToken, albumController.deleteAlbum);
router.get("/", verifyAccessToken, albumController.getAllAlbums);

module.exports = router;
