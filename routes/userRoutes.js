import express from "express";
import {
  updateUserController,
  deleteUserController,
  getUserController,
  subscribeUserController,
  unSubscribeUserController,
  likeVideoController,
  dislikeVideoController,
} from "../controllers/userController.js";
import { verifyToken } from "../helpers/verifyToken.js";

const userRoutes = express.Router();

// Update User
userRoutes.put("/:id", verifyToken, updateUserController);

// Delete User
userRoutes.delete("/:id", deleteUserController);

// Get User
userRoutes.get("/find/:id", getUserController);

// Get All Users
// userRoutes.get("/", getUsers);

// Subscribe User
userRoutes.put("/sub/:id", subscribeUserController)

// UnSubscribe User
userRoutes.put("/unsub/:id", unSubscribeUserController)

// Like Video
userRoutes.put("/like/:videoId", likeVideoController);

// Dislike Video
userRoutes.put("/dislike/:videoId", dislikeVideoController);

export default userRoutes;
