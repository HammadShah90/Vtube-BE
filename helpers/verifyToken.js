import jwt from "jsonwebtoken";
import { createError } from "../utils/error.js";

const { sign, verify } = jwt;

export const verifyToken = (req, res, next) => {
  const token = req.cookies.access_token;
  // console.log(token);
  if (!token) return next(createError(401, "You are not authenticated!"));

  verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) return next(createError(403, "Token is not valid!"));
    req.user = user;
    next();
  });
};

export const GenerateToken = ({ data, expireIn }) => {
  return sign({ id: data }, process.env.JWT_SECRET_KEY, {
    expiresIn: expireIn,
  });
};
