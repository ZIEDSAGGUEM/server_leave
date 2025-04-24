const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app); // <-- wrap with http server
// Load environment variables
dotenv.config();



const io = new Server(server, {
  cors: {
    origin: "*", // your frontend URL
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/leaves", leaveRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
// Store connected users
let onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("New socket connected:", socket.id);

  // Handle user connection
  socket.on("newNotification", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log("Notification:", userId);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    for (let [userId, id] of onlineUsers.entries()) {
      if (id === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

// Make io accessible in routes
app.set("io", io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
