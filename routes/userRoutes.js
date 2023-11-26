import express from "express";
import {
  updateUserController,
  deleteUserController,
  getUserController,
  subscribeUserController,
  unSubscribeUserController,
  likeVideoController,
  dislikeVideoController,
  getUsersController,
} from "../controllers/userController.js";
import { verifyToken } from "../helpers/verifyToken.js";

const userRoutes = express.Router();

// Update User
userRoutes.put("/:id", verifyToken, updateUserController);

// Delete User
userRoutes.delete("/:id", verifyToken, deleteUserController);

// Get User
userRoutes.get("/find/:id", getUserController);

// Get All Users
userRoutes.get("/find", getUsersController);

// Subscribe User
userRoutes.put("/sub/:id", verifyToken, subscribeUserController)

// UnSubscribe User
userRoutes.put("/unsub/:id", verifyToken, unSubscribeUserController)

// Like Video
userRoutes.put("/like/:videoId", verifyToken, likeVideoController);

// Dislike Video
userRoutes.put("/dislike/:videoId", verifyToken, dislikeVideoController);

export default userRoutes;
