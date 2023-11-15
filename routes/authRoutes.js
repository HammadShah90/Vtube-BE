import express from 'express';
import {
    login,
    registration
} from '../controllers/authController.js';

const authRoutes = express.Router()

// CREATE A USER
authRoutes.post('/register', registration)

// SIGN IN
authRoutes.post('/login', login)

// GOOGLE AUTH
// authRoutes.post('/google', googleAuth)

export default authRoutes