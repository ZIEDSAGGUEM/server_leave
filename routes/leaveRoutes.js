const express = require("express");
const {
  createLeave,
  getUserLeaves,
  getAllLeaves,
  updateLeaveStatus,
  markNotificationAsRead,
} = require("../controllers/leaveController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// User routes
router.post("/", protect, createLeave);
router.get("/", protect, getUserLeaves);
router.put("/notify/:id", protect, markNotificationAsRead);

// Admin routes
router.get("/all", protect, admin, getAllLeaves);
router.put("/:id", protect, admin, updateLeaveStatus);


module.exports = router;
