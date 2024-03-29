import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import validator from 'validator';
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
        status: false,
        message: "Please fill all input fields",
      });
    } else if (password !== confirmPassword) {
      return res.status(BADREQUEST).send({
        status: false,
        message: "Both Passwords do not match",
      });
    } else if (password.length < 8) {
      return res.status(BADREQUEST).send({
        status: false,
        message: "Password must be at least 8 characters",
      });
    } else if (password.length > 20) {
      return res.status(BADREQUEST).send({
        status: false,
        message: "Password must be at most 20 characters",
      });
    } else if (password.search(/[0-9]/) < 0) {
      return res.status(BADREQUEST).send({
        status: false,
        message: "Password must contain at least one number",
      });
    } else if (password.search(/[a-z]/) < 0) {
      return res.status(BADREQUEST).send({
        status: false,
        message: "Password must contain at least one lowercase letter",
      });
    } else if (password.search(/[A-Z]/) < 0) {
      return res.status(BADREQUEST).send({
        status: false,
        message: "Password must contain at least one uppercase letter",
      });
    } else if (password.search(/[!@#$%^&*(),.?":{}|<>_-]/) < 0) {
      return res.status(BADREQUEST).send({
        status: false,
        message: "Password must contain at least one special character",
      });
    } else if (password.search(/\s/) >= 0) {
      return res.status(BADREQUEST).send({
        status: false,
        message: "Password must not contain any spaces",
      });
    } else {
      const validateEmail = validator.isEmail(email)
      console.log(validateEmail);
      if (!validateEmail) {
        return res.status(BADREQUEST).send({
          status: false,
          message: "Please provide correct Email for verification.",
        });
      } else {

        const user = await User.findOne({ email });
  
        if (user) {
          return res.status(BADREQUEST).send({
            status: false,
            message: "Email already exists",
          });
        } else {
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
          const emailResponse = await sendEmailOTP(
            email,
            generateRandomCodeString
          );
          console.log(emailResponse);
  
          // return res.status(200).send({
          //   status: true,
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
              isVerified: false,
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
            status: true,
            message:
              `User created and OTP has been sent to this ${email} please verify`,
            data: user._doc,
          });
        }
      }

    }
  } catch (err) {
    next(err);
  }
};


// >------------------------
// >> Email Verify OTP logic
// >------------------------

export const verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!email || !otp) {
      return res.status(400).send({
        status: false,
        message: "Email and OTP are required for verification.",
      });
    } else if (!user) {
      return res.status(NOTFOUND).send({
        status: false,
        message: "User not found",
      });
    } else {
      if (!user.verifyOTP?.isVerified) {
        user.verifyOTP.isVerified = true;
        await user.save();
        return res.status(OK).send({
          status: true,
          message: "Email verified successfully",
        });
      } else {
        const currentTime = new Date().getMinutes();
        console.log(currentTime);
        const otpTime = new Date(user.verifyOTP.createdAt).getMinutes();
        console.log(otpTime);
        const timeDifference = currentTime - otpTime;
        console.log(timeDifference);

        if (timeDifference <= 5 && user.verifyOTP.OTP === otp) {
          const token = GenerateToken({
            data: user._id,
            expireIn: process.env.JWT_EXPIRES_IN,
          });
          console.log(token);

          // const realToken = token.replaceAll(".", "d");
          // console.log(realToken);
          user.resetToken = token;
          await user.save();
          res.status(OK).send({
            status: true,
            message: "Email verified successfully",
            token: token,
          });
        } else {
          res.status(BADREQUEST).send({
            status: false,
            message: "OTP is invalid or expired",
          });
        }
      }
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
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(BADREQUEST).send({
        status: false,
        message: "Please fill all input fields",
      });
    } else if (password !== confirmPassword) {
      return res.status(BADREQUEST).send({
        status: false,
        message: "Both Passwords do not match",
      });
    } else {
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(NOTFOUND).send({
          status: false,
          message: "User not found",
        });
      } else if (!user.verifyOTP.isVerified) {
        return res.status(BADREQUEST).send({
          status: false,
          message: "Check your email and verify your OTP first",
        });
      } else {
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return res.status(BADREQUEST).send({
            status: false,
            message: "Password not valid",
          });
        } else {
          const token = GenerateToken({
            data: user._id,
            expireIn: process.env.JWT_EXPIRES_LOGIN,
          });

          // const realToken = token.replaceAll(".", "dot");
          // console.log(realToken);
          // console.log(token);
          // console.log(typeof process.env.JWT_EXPIRES_LOGIN);

          // Remove password field from user object
          delete user._doc.password;

          res
            .cookie("access_token", token, {
              // Expires after 12 hours
              expires: new Date(Date.now() + 12 * 60 * 60 * 1000),
              httpOnly: true,
            })
            .status(OK)
            .send({
              status: true,
              message: "User has been Signed In",
              token,
              data: user._doc,
            });
        }
      }
    }
  } catch (err) {
    next(err);
    // console.log(err);
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
          status: true,
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
          status: true,
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
      return { status: true, message: `OTP sent to ${mail} via email` };
    } catch (error) {
      throw `Error sending OTP to ${mail} via email: ${error}`;
    }
  }

  try {
    const { email } = req.body;
    const validateEmail = validator.isEmail(email)
    console.log(validateEmail);
    if (!validateEmail) {
      return res.status(BADREQUEST).send({
        status: false,
        message: "Please provide correct Email for verification.",
      });
    } else {
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(NOTFOUND).send({
          status: false,
          message: "User not found",
        });
      } else if (!user.verifyOTP.isVerified) {
        return res.status(BADREQUEST).send({
          status: false,
          message:
            "Please verify that otp which is sent to your provided email address when you were signing up.",
        });
      } else {
        // Generate OTP Code
        const min = 100000;
        const max = 999999;
        const generateRandomCode =
          Math.floor(Math.random() * (max - min + 1)) + min;
        const generateRandomCodeString = generateRandomCode.toString();

        await User.findOneAndUpdate(
          { email },
          {
            $set: {
              verifyOTP: {
                OTP: generateRandomCodeString,
                createdAt: new Date(),
              },
            },
          },
          { new: true }
        );

        // Send OTP via email
        try {
          await sendEmailOTP(email, generateRandomCode);

          res.status(OK).send({
            status: true,
            message: `OTP sent to ${email} via email`,
          });
        } catch (error) {
          console.log(error);
          res.status(INTERNALERROR).send({
            status: false,
            message: "Error sending email with OTP",
          });
        }
      }
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
          status: true,
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
