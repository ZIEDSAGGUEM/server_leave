const mongoose = require("mongoose");

const LeaveSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["annual", "sick", "personal"],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  days: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  requestDate: {
    type: Date,
    default: Date.now,
  },
  reasonRefuse: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model("Leave", LeaveSchema);
