const Leave = require("../models/Leave");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");
const { jsPDF } = require("jspdf");

// Map to store online users and their socket IDs
const onlineUsers = new Map();

// @desc    Create a new leave request
// @route   POST /api/leaves
// @access  Private
const createLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, days, reason } = req.body;

    // Check if user has enough leave balance
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.leaveBalance[type] < days) {
      return res.status(400).json({
        message: `Insufficient ${type} leave balance`,
      });
    }

    // Create leave request
    const leaveData = {
      user: req.user._id,
      type,
      startDate,
      endDate,
      days,
    };

    // Include reason only for personal leave
    if (type === "personal") {
      leaveData.reason = reason;
    }

    const leave = await Leave.create(leaveData);

    if (leave) {
      res.status(201).json(leave);
    } else {
      res.status(400).json({ message: "Invalid leave data" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all leaves for a user
// @route   GET /api/leaves
// @access  Private
const getUserLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ user: req.user._id })
      .sort("-requestDate")
      .populate("user");
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all leaves (admin only)
// @route   GET /api/leaves/all
// @access  Private/Admin
const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({})
      .populate("user", "name email")
      .sort("-requestDate");
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update leave status (admin only)
// @route   PUT /api/leaves/:id
// @access  Private/Admin
const updateLeaveStatus = async (req, res) => {
  try {
    const { status, reasonRefuse } = req.body;
    const io = req.app.get('io');

    const leave = await Leave.findById(req.params.id).populate('user');

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    // Only update if the status is changing
    if (leave.status !== status) {
      // If the status is accepted, decrease the user's leave balance
      if (status === "approved" && leave.type !== "personal") {
        await User.findByIdAndUpdate(leave.user._id, {
          $inc: { [`leaveBalance.${leave.type}`]: -leave.days },
        });
      }

      // If the status is rejected, set the reason for refusal
      if (status === "rejected") {
        leave.reasonRefuse = reasonRefuse;
      }

      // If the status is pending, increase the user's leave balance
      if (status === "pending" && leave.type !== "personal") {
        await User.findByIdAndUpdate(leave.user._id, {
          $inc: { [`leaveBalance.${leave.type}`]: leave.days },
        });
      }

      leave.status = status;
      await leave.save();

      // Send real-time notification
      const message = `Your leave request has been ${status} : ${leave.type}`;
      const notification = { message, read: false, date: new Date() };
      
      // Add notification to user document
      await User.findByIdAndUpdate(leave.user._id, {
        $push: { notifications: { $each: [notification], $position: 0 } }
      });

      // Send socket notification if user is online
      const socketId = onlineUsers.get(leave.user._id.toString());
      if (socketId) {
        io.to(socketId).emit("newNotification", notification);
      }
    }

    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/leaves/notifications/:id
// @access  Private
const markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    const user = await User.findOneAndUpdate(
      { 
        _id: req.user._id,
        "notifications._id": notificationId 
      },
      { 
        $set: { "notifications.$.read": true } 
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createLeave,
  getUserLeaves,
  getAllLeaves,
  updateLeaveStatus,
  markNotificationAsRead,
};
