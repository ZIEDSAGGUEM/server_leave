const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  leaveBalance: {
    annual: {
      type: Number,
      default: 20,
    },
    sick: {
      type: Number,
      default: 10,
    },
    personal: {
      type: Number,
      default: 5,
    },
  },
  notifications: [
    {
    message: String,
    read: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date,
      default: Date.now,
  
      },
      },
  ],
  created: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
