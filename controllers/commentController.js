import Video from "../models/video.js";
import Comment from "../models/comment.js";
import { createError } from '../utils/error.js';

export const createComment = async (req, res, next) => {
  const newComment = new Comment({ userId: req.user.id, ...req.body });
  try {
    const savedComment = await newComment.save();
    res.status(200).send({
        status: "Success",
        message: "Comment has been Added",
        data: savedComment,
      });
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    const video = await Video.findById(req.params.id);
    if (req.user.id === comment.userId || req.user.id === video.userId) {
      await Comment.findByIdAndDelete(req.params.id);
      res.status(200).send({
        status: "Success",
        message: "Comment has been Deleted",
      });
    } else {
      return next(createError(403, "You can delete only your comment"));
    }
  } catch (err) {
    next(err);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ videoId: req.params.videoId });
    res.status(200).send({
        status: "Success",
        message: "Comments has been Fetched",
        data: comments,
    });
  } catch (err) {
    next(err);
  }
};
