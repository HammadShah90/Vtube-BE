import express from "express";
import {
  addVideo,
  addView,
  deleteVideo,
  getAllVideos,
  getVideo,
  getVideoByTag,
  randomVideos,
  searchVideos,
  subcribeVideos,
  trendVideos,
  updateVideo,
} from "../controllers/videoController.js";
import { verifyToken } from "../helpers/verifyToken.js";

const videoRoutes = express.Router();

// Create a video
videoRoutes.post("/", verifyToken, addVideo);

// Update a video
videoRoutes.put("/:id", verifyToken, updateVideo);

// Delete a video
videoRoutes.delete("/:id", verifyToken, deleteVideo);

// Get a video
videoRoutes.get("/find/:id", getVideo);

// Get all videos
videoRoutes.get("/find", verifyToken, getAllVideos);

// Get all videos
videoRoutes.get("/view/:id", addView);

// Get all videos
videoRoutes.get("/random", randomVideos);

// Get all videos
videoRoutes.get("/trend", trendVideos);

// Get all videos
videoRoutes.get("/sub", verifyToken, subcribeVideos);

// Get all videos
videoRoutes.get("/tags", getVideoByTag);

// Get all videos
videoRoutes.get("/search", searchVideos);

export default videoRoutes;
