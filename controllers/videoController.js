import User from "../models/user.js";
import Video from "../models/video.js";
import { createError } from "../utils/error.js";
import { OK } from "../constants/httpStatus.js";

export const addVideo = async (req, res, next) => {
  const newVideo = new Video({ userId: req.user.id, ...req.body });
  try {
    const savedVideo = await newVideo.save();
    res.status(OK).send({
      status: "Success",
      message: "Video has been saved",
      data: savedVideo,
    });
    console.log(savedVideo);
  } catch (err) {
    next(err);
  }
};

export const updateVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return next(createError(404, "Video not found"));
    } else if (req.user.id === video.userId) {
      const updatedVideo = await Video.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        { new: true }
      );
      res.status(OK).send({
        status: "Success",
        message: "Video has been updated",
        data: updatedVideo,
      });
    } else {
      return next(createError(403, "You can update only your video!"));
    }
  } catch (err) {
    next(err);
  }
};

export const deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return next(createError(404, "Video not found"));
    } else if (req.user.id === video.userId) {
      await Video.findByIdAndDelete(req.params.id, { new: true });
      res.status(OK).send({
        status: "Success",
        message: "Video has been deleted",
      });
    } else {
      return next(createError(403, "You can delete only your video!"));
    }
  } catch (err) {
    next(err);
  }
};

export const getVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return next(createError(404, "Video not found"));
    }
    res.status(OK).send({
      status: "Success",
      message: "Video has been fetched",
      data: video,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllVideos = async (req, res, next) => {
  try {
    const videos = await Video.find();
    res.status(OK).send({
      status: "Success",
      message: "All videos has been fetched",
      data: videos,
    });
  } catch (err) {
    next(err);
  }
};

export const addView = async (req, res, next) => {
  try {
    await Video.findByIdAndUpdate(req.params.id, {
      $inc: { views: 1 },
    });
    res.status(OK).send({
      status: "Success",
      message: "View has been increased",
    });
  } catch (err) {
    next(err);
  }
};

export const randomVideos = async (req, res, next) => {
  try {
    const videos = await Video.aggregate([{ $sample: { size: 40 } }]);
    res.status(OK).send({
      status: "Success",
      message: "Random videos has been fetched",
      data: videos,
    });
  } catch (err) {
    next(err);
  }
};

export const trendVideos = async (req, res, next) => {
  try {
    const videos = await Video.find().sort({ views: -1 });
    res.status(OK).send({
      status: "Success",
      message: "Trend videos has been fetched",
      data: videos,
    });
  } catch (err) {
    next(err);
  }
};

export const subscribeVideos = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const subscribedChannels = user.subscribedUsers;
    // console.log(subscribedChannels);

    const list = await Promise.all(
      subscribedChannels.map(async (channelId) => {
        return await Video.find({ userId: channelId });
      })
    );
    res.status(OK).send({
      status: "Success",
      message: "Subscribed videos has been fetched",
      data: list.flat().sort((a, b) => b.createdAt - a.createdAt),
    });
  } catch (err) {
    next(err.message);
    console.log(err.message);
  }
};

export const getVideoByTag = async (req, res, next) => {
  const tags = req.query.tags.split(",");
  try {
    const videos = await Video.find({
      tags: { $in: tags },
    })
      .sort({ views: -1 })
      .limit(20);
    res.status(OK).send({
      status: "Success",
      message: "Tag videos has been fetched",
      data: videos,
    });
  } catch (err) {
    next(err);
  }
};

export const searchVideos = async (req, res, next) => {
  const query = req.query.q;
  // console.log(query, "===>>>177");
  try {
    const videos = await Video.find({
      title: { $regex: query, $options: "i" },
    }).limit(40);
    // console.log(videos, "===>>>182");
    res.status(OK).send({
      status: "Success",
      message: "Search videos has been fetched",
      data: videos,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};
