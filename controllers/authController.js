import mongoose from "mongoose";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import {
  BADREQUEST,
  INTERNALERROR,
  NOTFOUND,
  OK,
} from "../constants/httpStatus.js";
import { responseMessages } from "../constants/responseMessages.js";
import { createError } from "../utils/error.js";
import { GenerateToken } from "../helpers/verifyToken.js";

// import mongoose from 'mongoose';

const { verify, sign } = jwt;

// User Registration
export const registration = async (req, res, next) => {
  try {
    // generated hash user password ==>>
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // created new user ==>>
    const newUser = new User({
      ...req.body,
      password: hashedPassword,
    });

    // save user data and responsed==>
    const user = await newUser.save();

    const { password, ...others } = user._doc;
    res.status(OK).send({
      status: "Success",
      message: "User has been created",
      data: others,
    });
  } catch (err) {
    next(err);
  }
};

// User Login
export const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) return next(createError(404, "Email not found"));

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!validPassword) return next(createError(400, "Wrong password"));

    // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY);

    const token = GenerateToken({
      data: user._id,
      expireIn: process.env.JWT_EXPIRES_LOGIN,
    });

    const { password, ...others } = user._doc;

    res
      .cookie("access_token", token, {
        httpOnly: true,
      })
      .status(OK)
      .send({
        status: "Success",
        message: "User has been Signed In",
        token,
        data: others,
      });
  } catch (err) {
    next(err);
  }
};

// Google Authentication

export const googleAuth = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    // console.log(user);
    if (user) {
      console.log(user);
      const token = GenerateToken({
        data: user._id,
        expireIn: expireIn,
      });
      res
        .cookie("access_token", token, {
          httpOnly: true,
        })
        .status(OK)
        .send({
          status: "Success",
          message: "User has been Signed In",
          data: user._doc,
        });
    } else {
      const newUser = new User({
        ...req.body,
        fromGoogle: true,
      });
      const savedUser = await newUser.save();
      console.log(savedUser);
      const token = GenerateToken({
        data: savedUser._id,
        expireIn: expireIn,
      });
      res
        .cookie("access_token", token, {
          httpOnly: true,
        })
        .status(OK)
        .send({
          status: "Success",
          message: "User has been Signed In",
          data: savedUser._doc,
        });
    }
  } catch (err) {
    next(err);
  }
};

// Forgot Password

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    // console.log(email);
    if (email) {
      const user = await User.findOne({ email });
      if (user) {
        // console.log(user);
        const secret = process.env.JWT_SECRET_KEY + user._id;
        // console.log(secret);

        const token = GenerateToken({
          data: secret,
          expireIn: process.env.JWT_EXPIRES_IN,
        });
        // console.log(token);

        const setUserToken = await User.findByIdAndUpdate(
          { _id: user._id },
          { verifytoken: token },
          { new: true }
        );
        // console.log(setUserToken);

        if (setUserToken) {
          const link = `${process.env.WEB_LINK}/resetpassword/${user._id}/${setUserToken.verifytoken}`;

          // return res.status(OK).send({
          //   status: "Success",
          //   data: link,
          // });

          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.FOUNDER_EMAIL,
              pass: process.env.FOUNDER_PASSWORD,
            },
          });

          // const transporter = nodemailer.createTransport({
          //   host: process.env.SMTP_HOST,
          //   port: process.env.SMTP_PORT,
          //   auth: {
          //     user: process.env.SMTP_EMAIL,
          //     pass: process.env.SMTP_PASSWORD,
          //   },
          // });

          // console.log(transporter);
          const mailOptions = {
            from: process.env.FOUNDER_EMAIL,
            to: email,
            subject: "PASSWORD RECOVERY",
            text: `Thank you for using Vtube. Use the following Link to complete your Password Recovery Procedure. Link is valid for 5 minutes only. Please click on the link to reset your password ${link}`,
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log(error);
              return res
                .status(INTERNALERROR)
                .send(createError(INTERNALERROR, error.message));
            } else {
              console.log("Email sent: " + info.response);
              return res.status(OK).send({
                status: "Success",
                message: "Email has been sent Successfully",
              });
            }
          });
        }
      } else {
        res
          .status(NOTFOUND)
          .send(createError(NOTFOUND, responseMessages.NO_USER_FOUND));
      }
    } else {
      return res
        .status(BADREQUEST)
        .send(createError(BADREQUEST, responseMessages.MISSING_FIELD_EMAIL));
    }
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  const { id, token } = req.params;
  console.log(id);
  console.log(token);
  try {
    const validUser = await User.findOne({ _id: id, varifytoken: token });
    const verifyToken = verify(token, process.env.JWT_SECRET_KEY);
    console.log(verifyToken);
    const { newPassword, confirmNewPassword, token } = req.body;
    if (newPassword && confirmNewPassword && token) {
      const { id } = verify(token, process.env.JWT_SECRET_KEY);
      // console.log(id);
      const userId = id.slice(process.env.JWT_SECRET_KEY.length - id.length);
      // console.log(userId);
      const user = await User.findById(userId);
      if (user) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await User.findByIdAndUpdate(userId, {
          $set: { password: hashedPassword },
        });
        await user.save();
        res.status(OK).send({
          status: "Success",
          message: "Password has been Changed kindly login",
        });
      } else {
        res
          .status(NOTFOUND)
          .send(createError(NOTFOUND, responseMessages.NO_USER));
      }
    } else {
      res
        .status(BADREQUEST)
        .send(createError(BADREQUEST, responseMessages.MISSING_FIELDS));
    }
  } catch (err) {
    return res
      .status(INTERNALERROR)
      .send(createError(INTERNALERROR, err.message));
  }
};
