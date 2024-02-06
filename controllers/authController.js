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

const { verify, sign } = jwt;

// >------------------------
// >> User Registration logic
// >------------------------
export const registration = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(BADREQUEST).send({
        status: "failed",
        message: "Please fill all input fields",
      });
    } else if (password !== confirmPassword) {
      return res.status(BADREQUEST).send({
        status: "failed",
        message: "Passwords do not match",
      });
    } else if (password.length < 8) {
      return res.status(BADREQUEST).send({
        status: "failed",
        message: "Password must be at least 6 characters",
      });
    } else if (password.length > 20) {
      return res.status(BADREQUEST).send({
        status: "failed",
        message: "Password must be at most 20 characters",
      });
    } else if (password.search(/[0-9]/) < 0) {
      return res.status(BADREQUEST).send({
        status: "failed",
        message: "Password must contain at least one number",
      });
    } else if (password.search(/[a-z]/) < 0) {
      return res.status(BADREQUEST).send({
        status: "failed",
        message: "Password must contain at least one lowercase letter",
      });
    } else if (password.search(/[A-Z]/) < 0) {
      return res.status(BADREQUEST).send({
        status: "failed",
        message: "Password must contain at least one uppercase letter",
      });
    } else if (password.search(/[!@#$%^&*(),.?":{}|<>_]/) < 0) {
      return res.status(BADREQUEST).send({
        status: "failed",
        message: "Password must contain at least one special character",
      });
    } else if (password.search(/\s/) >= 0) {
      return res.status(BADREQUEST).send({
        status: "failed",
        message: "Password must not contain any spaces",
      });
    } else {
      const user = await User.findOne({ email });

      if (user) {
        return res.status(BADREQUEST).send({
          status: "failed",
          message: "Email already exists",
        });
      }
    }
    const emailConfig = {
      service: "gmail",
      auth: {
        user: process.env.FOUNDER_EMAIL,
        pass: process.env.FOUNDER_PASSWORD,
      },
    };

    // Function to send OTP via email
    async function sendEmailOTP(mail, otp) {
      const transporter = nodemailer.createTransport(emailConfig);

      const mailOptions = {
        from: process.env.FOUNDER_EMAIL,
        to: email,
        subject: "OTP Verification",
        text: `Your OTP is: ${otp}`,
      };

      try {
        await transporter.sendMail(mailOptions);
        return `OTP sent to ${mail} via email`;
      } catch (error) {
        throw `Error sending OTP to ${mail} via email: ${error}`;
      }
    }

    // Generate OTP Code
    const min = 100000;
    const max = 999999;
    const generateRandomCode =
      Math.floor(Math.random() * (max - min + 1)) + min;
    const generateRandomCodeString = generateRandomCode.toString();

    // Send OTP via email
    const emailResponse = await sendEmailOTP(email, generateRandomCodeString);
    console.log(emailResponse);

    // return res.status(200).send({
    //   status: "Success",
    //   message: `OTP has been sent to this ${email}`,
    //   otp: generateRandomCodeString,
    // });

    // generated hash user password ==>>
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // created new user ==>>
    const newUser = new User({
      ...req.body,
      verifyOTP: {
        OTP: generateRandomCodeString,
        verify: false,
        createdAt: new Date(),
      },
      password: hashedPassword,
    });

    // save user data and responsed==>
    const user = await newUser.save();
    console.log(user._doc.email);

    // Remove password field from user object
    delete user._doc.password;

    res.status(OK).send({
      status: "Success",
      message:
        "User created and OTP has been sent to this ${email} please verify",
      data: user._doc,
    });
  } catch (err) {
    next(err);
  }
};

// >------------------------
// >> Registration Email Verify OTP logic
// >------------------------
export const verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, Otp } = req.body;

    if (!email || !Otp) {
      return res.status(400).send({
        status: "Failed",
        message: "Email and OTP are required for verification.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(NOTFOUND).send({
        status: "failed",
        message: "User not found",
      });
    }

    if (user.verifyOTP.OTP !== Otp) {
      return res.status(BADREQUEST).send({
        status: "failed",
        message: "Invalid OTP",
      });
    }

    const currentTime = new Date().getMinutes();
    console.log(currentTime);
    const otpTime = new Date(user.verifyOTP.createdAt).getMinutes();
    console.log(otpTime);
    const timeDifference = currentTime - otpTime;
    console.log(timeDifference);

    if (timeDifference <= 5 && user.verifyOTP.OTP === Otp) {
      user.verifyOTP.isVerified = true;
      await user.save();

      res.status(OK).send({
        status: "Success",
        message: "OTP verified successfully",
      });
    } else {
      res.status(BADREQUEST).send({
        status: "failed",
        message: "OTP expired",
      });
    }
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

    if (!user.verifyOTP.isVerified) {
      return res.status(BADREQUEST).send({
        status: "failed",
        message: "Check your email and verify your OTP first",
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
    },
  };

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
      return { status: "Success", message: `OTP sent to ${mail} via email` };
    } catch (error) {
      throw `Error sending OTP to ${mail} via email: ${error}`;
    }
  }

  try {
    const { email } = req.body;
    // console.log(email);
    if (email) {
      // Generate OTP Code
      const min = 100000;
      const max = 999999;
      const generateRandomCode =
        Math.floor(Math.random() * (max - min + 1)) + min;

      const user = await User.findOneAndUpdate(
        { email },
        {
          $set: {
            emailOTP: {
              OTP: generateRandomCode,
              isUsed: false,
              createdAt: new Date(),
            },
          },
        },
        { new: true }
      );

      if (!user) {
        return res.status(BADREQUEST).send({
          status: "Failed",
          message: "User not found or OTP not added",
        });
      }

      // Send OTP via email
      try {
        await sendEmailOTP(email, generateRandomCode);

        res.status(OK).send({
          status: "Success",
          message: `OTP sent to ${email} via email`,
        });
      } catch (error) {
        console.log(error);
        res.status(INTERNALERROR).send({
          status: "Failed",
          message: "Error sending email with OTP",
        });
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
// >> Verify OTP logic
// >------------------------
export const verifyOTP = async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).send({
      status: "Failed",
      message: "Email and OTP are required for verification.",
    });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({
        status: "Failed",
        message: "User not found",
      });
    }

    const currentTime = new Date().getMinutes();
    console.log(currentTime);
    const otpTime = new Date(user.emailOTP.createdAt).getMinutes();
    console.log(otpTime);
    const timeDifference = currentTime - otpTime;
    console.log(timeDifference);

    if (timeDifference <= 5 && user.emailOTP.OTP === otp) {
      const token = GenerateToken({
        data: user._id,
        expireIn: process.env.JWT_EXPIRES_IN,
      });
      console.log(token);

      const realToken = token.replaceAll(".", "d");
      console.log(realToken);
      user.resetToken = realToken;
      await user.save();

      // OTP is valid, proceed to the password reset step
      res.status(OK).send({
        status: "Success",
        message: "OTP is valid",
        token: realToken,
        // Optionally, you can send a token to the user for the password reset step
      });
    } else {
      return res.status(BADREQUEST).send({
        status: "Failed",
        message: "OTP is invalid or expired",
      });
    }
  } catch (error) {
    next(error);
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
