import { createError } from "../utils/error.js";
import User from "../models/user.js";

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
    const { password, ...others} = user._doc

    res.status(200).send({
      status: "Success",
      message: "User has been Fetched",
      data: others,
    });
  } catch (err) {
    next(err);
  }
};

export const subscribeUserController = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            $push: { subscribedUsers: req.params.id }
        });
        await User.findByIdAndUpdate(req.params.id, {
            $inc: { subscribers: 1 }
        });
        res.status(200).send({
            status: "Success",
            message: "User has been Subscribed"
        });
    } catch (err) {
        next(err)
    }
};

export const unSubscribeUserController = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            $pull: { subscribedUsers: req.params.id }
        });
        await User.findByIdAndUpdate(req.params.id, {
            $inc: { subscribers: -1 }
        });
        res.status(200).send({
            status: "Success",
            message: "User has been unSubscribed"
        });
    } catch (err) {
        next(err)
    }
};

export const likeVideoController = async (req, res, next) => {
    try {
        
    } catch (err) {
        next(err)
    }
};

export const dislikeVideoController = async (req, res, next) => {};
