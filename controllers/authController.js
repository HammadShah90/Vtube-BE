import mongoose from "mongoose";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import randomatic from "randomatic";
import {
  BADREQUEST,
  INTERNALERROR,
  NOTFOUND,
  OK,
} from "../constants/httpStatus.js";
import { responseMessages } from "../constants/responseMessages.js";
import { createError } from "../utils/error.js";
import { GenerateToken } from "../helpers/verifyToken.js";


const { verify, sign } = jwt;


// >------------------------
// >> User Registration logic
// >------------------------
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


// >------------------------
// >> User Login logic
// >------------------------
export const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      res.status(NOTFOUND).send({
        status: "failed",
        message: "Email not found",
      });
      return;
    }

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!validPassword) {
      return res.status(BADREQUEST).send({
        status: "failed",
        message: "Password not valid",
      });
    }

    const token = GenerateToken({
      data: user._id,
      expireIn: process.env.JWT_EXPIRES_LOGIN,
    });

    // const realToken = token.replaceAll(".", "dot");
    // console.log(realToken);
    // console.log(token);
    // console.log(typeof process.env.JWT_EXPIRES_LOGIN);

    const { password, ...others } = user._doc;

    res
      .cookie("access_token", token, {
        // Expires after 12 hours
        expires: new Date(Date.now() + 12 * 60 * 60 * 1000),
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
    console.log(err);
  }
};


// >------------------------
// >> Google Authentication logic
// >------------------------
export const googleAuth = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    // console.log(user);
    if (user) {
      const token = GenerateToken({
        data: user._id,
        expireIn: process.env.JWT_EXPIRES_LOGIN,
      });
      // const realToken = token.replaceAll(".", "dot")
      // console.log(realToken);
      // console.log(token);
      res
        .cookie("access_token", token, {
          // Expires after 12 hours
          expires: new Date(Date.now() + 12 * 60 * 60 * 1000),
          httpOnly: true,
        })
        .status(OK)
        .send({
          status: "Success",
          message: "User has been Signed In",
          token,
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
        expireIn: process.env.JWT_EXPIRES_LOGIN,
      });
      res
        .cookie("access_token", token, {
          expires: new Date(Date.now() + 5 * 60 * 1000),
          httpOnly: true,
        })
        .status(OK)
        .send({
          status: "Success",
          message: "User has been Signed In",
          token,
          data: savedUser._doc,
        });
    }
  } catch (err) {
    next(err);
  }
};


// >------------------------
// >> Forgot Password logic
// >------------------------
export const forgotPassword = async (req, res, next) => {
  const emailConfig = {
    service: "gmail",
    auth: {
      user: process.env.FOUNDER_EMAIL,
      pass: process.env.FOUNDER_PASSWORD,
    }
  }

  // Function to send OTP via email
  async function sendEmailOTP(mail, otp) {
    const transporter = nodemailer.createTransport(emailConfig);

    const mailOptions = {
      from: process.env.FOUNDER_EMAIL,
      to: mail,
      subject: "PASSWORD RECOVERY",
      text: `Thank you for using Vtube. Use the following OTP to complete your Password Recovery Procedure. OTP is valid for 5 minutes only. your OTP is: ${otp}`,
    };

    try {
      await transporter.sendMail(mailOptions);
      return {status: 'Success', message: `OTP sent to ${mail} via email`};
    } catch (error) {
      throw `Error sending OTP to ${mail} via email: ${error}`;
    }
  }

  try {
    const { email } = req.body;
    // console.log(email);
    if (email) {
      const user = await User.findOne({ email });
      if (user) {
        // console.log(user);
        const otp = randomatic("0", 6);
        const otpNumber = parseInt(otp, 10);

        const otpAddToDb = await User.updateOne(
          { _id: user._id },
          {
            $set: {
              emailOTP: otpNumber,
            },
          }
        );

        if (!otpAddToDb) {
          return res.status(400).send({
            status: "Failed",
            message: "User not found or OTP not added",
          });
        }

        try {
          await user.save();

          // Send OTP via email
          const emailResponse = await sendEmailOTP(email, otp);
          console.log(emailResponse);

        } catch (error) {
          console.log(error);
        }

        res.status(200).send({
          status: "Success",
          message: `OTP sent to ${email} via email`,
          data: user,
        });
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


// >------------------------
// >> Reset Password logic
// >------------------------
export const resetPassword = async (req, res, next) => {
  // console.log("reset password email cotroller");
  try {
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
        return res.status(OK).send({
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
    console.log(err);
    return res
      .status(INTERNALERROR)
      .send(createError(INTERNALERROR, err.message));
  }
};
