import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    
    const token = authHeader?.replace("Bearer", "").trim();
   
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.log('Auth Middleware: User not found - returning 401');
      return res.status(401).json({
        success: false,
        message: "Invalid token or user not found.",
      });
    }

    if (!user.isActive) {
      console.log('Auth Middleware: User not active - returning 401');
      return res.status(401).json({
        success: false,
        message: "Invalid token or user not found.",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your mobile number first.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

export default auth;
