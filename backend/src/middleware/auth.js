import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async (req, res, next) => {
  console.log("\n--- Running Auth Middleware ---"); // Log start
  try {
    const token = req.header("Authorization")?.replace("Bearer ", ""); // Added space after Bearer
    console.log("Token received:", token); // Log the token

    if (!token) {
      console.log("Middleware Error: No token provided."); // Log reason
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided",
      });
    }

    // Verify the token AND decode it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decoded:", decoded); // Log the decoded payload (should contain user ID)

    // Check if decoded payload has the ID
    if (!decoded.id) {
       console.log("Middleware Error: Decoded token missing user ID.");
       throw new Error('Token payload invalid');
    }

    // Find the user based on the ID from the token
    const user = await User.findById(decoded.id).select("-password"); // Keep -password
    console.log("User found by ID:", user ? user.toObject() : null); // Log the user found (or null)

    // Check if user exists and is active
    if (!user || !user.isActive) {
       console.log("Middleware Error: User not found or inactive."); // Log reason
       return res.status(401).json({
        success: false,
        message: "Invalid token or user not found/inactive.", // Updated message
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
       console.log("Middleware Error: User not verified."); // Log reason
       return res.status(401).json({
        success: false,
        message: "Please verify your mobile number first.",
      });
    }

    // If all checks pass, attach user to request and continue
    console.log("Auth middleware passed. User attached."); // Log success
    req.user = user;
    next();

  } catch (err) {
    // Catch errors during jwt.verify (like invalid signature, expired token)
    console.error("Auth Middleware Catch Error:", err.message); // Log the specific error
    res.status(401).json({
      success: false,
      message: "Invalid token.", // Keep message simple for frontend
    });
  }
};

export default auth;