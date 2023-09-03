import express from 'express';
import {
    login,
    registration
} from '../controllers/authController.js';

const authRoutes = express.Router()

// Create a User
authRoutes.post('/register', registration)

// Sign in
authRoutes.post('/login', login)

// Google Authentication
// authRoutes.post('/google', googleAuth)

export default authRoutes