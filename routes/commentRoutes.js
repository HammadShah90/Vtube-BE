import express from "express";
import {
  createComment,
  deleteComment,
  getComments,
} from "../controllers/commentController.js";
import { verifyToken } from "../helpers/verifyToken.js";

const commentRoutes = express.Router();

commentRoutes.post("/", verifyToken, createComment);
commentRoutes.delete("/:id",verifyToken, deleteComment);
commentRoutes.get("/:videoId", getComments);

export default commentRoutes;
