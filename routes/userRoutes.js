const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
  getNotifications,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.post("/", registerUser);
router.post("/login", loginUser);
router.get("/notifications", protect, getNotifications);

// Protected routes
router.get("/profile", protect, getUserProfile);

module.exports = router;
