import express from 'express';
import {
    login,
    registration,
    forgotPassword,
    resetPassword,
} from '../controllers/authController.js';

const authRoutes = express.Router()

// CREATE A USER
authRoutes.post('/register', registration)

// SIGN IN
authRoutes.post('/login', login)

// FORGOT PASSWORD
authRoutes.post('/forgotpassword', forgotPassword)

// RESET PASSWORD
authRoutes.post('/resetpassword', resetPassword)

// GOOGLE AUTH
// authRoutes.post('/google', googleAuth)

export default authRoutes