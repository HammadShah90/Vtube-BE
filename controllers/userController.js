import { createError } from "../utils/error.js";
import User from "../models/user.js";
import Video from "../models/video.js";

export const updateUserController = async (req, res, next) => {
  if (req.params.id === req.user.id) {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        { new: true }
      );
      res.status(200).send({
        status: "Success",
        message: "User has been Updated",
        data: updatedUser,
      });
    } catch (err) {
      next(err);
    }
  } else {
    return next(createError(403, "You can update only your account!"));
  }
};

export const deleteUserController = async (req, res, next) => {
  if (req.params.id === req.user.id) {
    try {
      await User.findByIdAndDelete(req.params.id, { new: true });
      res.status(200).send({
        status: "Success",
        message: "User has been Deleted",
      });
    } catch (err) {
      next(err);
    }
  } else {
    return next(createError(403, "You can delete only your account!"));
  }
};

export const getUserController = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    const { password, ...others } = user._doc;

    res.status(200).send({
      status: "Success",
      message: "User has been Fetched",
      data: others,
    });
  } catch (err) {
    next(err.message);
  }
};

export const getUsersController = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).send({
      status: "Success",
      message: "Users has been Fetched",
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

export const subscribeUserController = async (req, res, next) => {
  try {
    const subscribedId = req.user.id;
    const targetUserId = req.params.id;

    const subscriberUpdate = await User.findByIdAndUpdate(
      subscribedId,
      {
        $push: { subscribedUsers: targetUserId },
      },
      { new: true }
    );

    if (!subscriberUpdate) {
      return next(createError(404, "Subscriber not found"));
    }

    const targetUserUpdate = await User.findByIdAndUpdate(
      targetUserId,
      {
        $inc: { subscribers: 1 },
      },
      { new: true }
    );

    if (!targetUserUpdate) {
      return next(createError(404, "Target user not found"));
    }

    res.status(200).send({
      status: "Success",
      message: "User has been Subscribed",
    });
  } catch (err) {
    next(err);
  }
};

export const unSubscribeUserController = async (req, res, next) => {
  try {
    const subscribedId = req.user.id;
    const targetUserId = req.params.id;

    const subscriberUpdate = await User.findByIdAndUpdate(
      subscribedId,
      {
        $pull: { subscribedUsers: targetUserId },
      },
      { new: true }
    );

    if (!subscriberUpdate) {
      return next(createError(404, "Subscriber not found"));
    }

    const targetUserUpdate = await User.findByIdAndUpdate(
      targetUserId,
      {
        $inc: { subscribers: -1 },
      },
      { new: true }
    );

    if (!targetUserUpdate) {
      return next(createError(404, "Target user not found"));
    }

    res.status(200).send({
      status: "Success",
      message: "User has been Unsubscribed",
    });
  } catch (err) {
    next(err);
  }
};

export const likeVideoController = async (req, res, next) => {
  const id = req.user.id;
  const videoId = req.params.videoId;
  try {
    await Video.findByIdAndUpdate(videoId, {
      $addToSet: { likes: id },
      $pull: { dislikes: id },
    });
    res.status(200).send({
      status: "Success",
      message: "Video has been Liked",
    });
  } catch (err) {
    next(err);
  }
};

export const dislikeVideoController = async (req, res, next) => {
  const id = req.user.id;
  const videoId = req.params.videoId;
  try {
    await Video.findByIdAndUpdate(videoId, {
      $addToSet: { dislikes: id },
      $pull: { likes: id },
    });
    res.status(200).send({
      status: "Success",
      message: "Video has been Disliked",
    });
  } catch (err) {
    next(err);
  }
};
