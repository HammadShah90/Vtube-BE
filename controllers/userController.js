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

export const deleteUserController = (req, res, next) => {};

export const getUserController = (req, res, next) => {};

export const subscribeUserController = (req, res, next) => {};

export const unSubscribeUserController = (req, res, next) => {};

export const likeVideoController = (req, res, next) => {};

export const dislikeVideoController = (req, res, next) => {};
