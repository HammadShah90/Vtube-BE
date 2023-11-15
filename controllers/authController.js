import User from '../models/user.js'
import bcrypt from 'bcrypt'
import { createError } from '../error.js';
import jwt from "jsonwebtoken";
// import mongoose from 'mongoose';

// const jwt = pkg

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
        const user = await newUser.save()
        res.status(200).send({
            status: "Success",
            message: "User has been created",
            data: user,
        });

    } catch (err) {
        next(err)
    }

}

// User Login
export const login = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) return next(createError(404, "Email not found"));

        const validPassword = await bcrypt.compare(req.body.password, user.password)

        if (!validPassword) return next(createError(400, "Wrong password"));

        const token = jwt.sign({id: user._id}, process.env.JWT)

        const { password, ...others} = user._doc

        res.cookie("access_token", token, {
            httpOnly:true
        }).status(200).send({
            status: "Success",
            message: "User has been Signed In",
            data: others,
        })

    } catch (err) {
        next(err)
    }
}

// Google Authentication

// export const googleAuth = (req, res) => {

// }