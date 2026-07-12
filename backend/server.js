require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const chatRoutes = require("./routes/chatRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("/chat", chatRoutes);
app.use("/users", userRoutes);

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const http = require("http");
const { initSocket } = require("./socket/socket");

const User = require("./models/User");



// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log(err));

// Home
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "INFO APP Backend Running 🚀",
  });
});

// Register
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    const exists = await User.findOne({ username });

    if (exists) {
      return res.json({
        success: false,
        message: "Username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

   const user = await User.create({
  username,
  password: hashedPassword,

  fullName: username,

  employeeId: "EMP" + Date.now(),

  department: "Development",

  designation: "Software Engineer",

  email: "",

  phone: "",

  avatar: "",

  bio: "",

  status: "Online",

  role: "employee",
});

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
    });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user)
      return res.json({
        success: false,
        message: "User not found",
      });

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.json({
        success: false,
        message: "Wrong password",
      });

    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET || "secretkey",
      {
        expiresIn: "7d",
      }
    );

    res.json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
    });
  }
});

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Start Server
const PORT = process.env.PORT || 5050;

server.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});