import express from "express";
import {
  login,
  registration,
  verifyEmailOtp,
  forgotPassword,
  resetPassword,
  googleAuth,
} from "../controllers/authController.js";

const authRoutes = express.Router();

// CREATE A USER
authRoutes.post("/register", registration);

// User Email Verification
authRoutes.post("/verifyEmailOtp", verifyEmailOtp);

// SIGN IN
authRoutes.post("/login", login);

// FORGOT PASSWORD
authRoutes.post("/forgotpassword", forgotPassword);

// RESET PASSWORD
authRoutes.post("/resetpassword/:id/:token", resetPassword);

// GOOGLE AUTH
authRoutes.post('/googleSignIn', googleAuth)

export default authRoutes;
