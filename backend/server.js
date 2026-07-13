require("dotenv").config();
const express = require("express");
const cors = require("cors");

const path = require("path");
const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const chatRoutes = require("./routes/chatRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("/chat", chatRoutes);
app.use("/users", userRoutes);

// Root routes for groups and messages integration
app.get("/groups", async (req, res) => {
  try {
    const { username } = req.query;
    const Group = require("./models/Group");
    const User = require("./models/User");
    
    let groups;
    if (username) {
      const user = await User.findOne({ username });
      if (user && user.role === "admin") {
        groups = await Group.find().sort({ name: 1 });
      } else {
        groups = await Group.find({ members: username }).sort({ name: 1 });
      }
    } else {
      groups = await Group.find().sort({ name: 1 });
    }

    const GroupMessage = require("./models/GroupMessage");
    const groupsWithLastMsg = await Promise.all(
      groups.map(async (g) => {
        const lastMsg = await GroupMessage.findOne({ groupId: g._id })
          .sort({ createdAt: -1 })
          .select("content sender createdAt");
        return {
          ...g.toObject(),
          lastMessage: lastMsg ? lastMsg.content : "",
          lastMessageTime: lastMsg ? lastMsg.createdAt : null,
          lastMessageSender: lastMsg ? lastMsg.sender : ""
        };
      })
    );

    res.json(groupsWithLastMsg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.get("/messages", async (req, res) => {
  try {
    const { sender, receiver } = req.query;
    const Message = require("./models/Message");
    const now = new Date();
    const messages = await Message.find({
      groupId: null,
      $and: [
        {
          $or: [
            { sender, receiver },
            { sender: receiver, receiver: sender }
          ]
        },
        {
          $or: [
            { expiresAt: null },
            { expiresAt: { $gt: now } }
          ]
        }
      ]
    }).populate("replyTo").sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.get("/groupmessages", async (req, res) => {
  try {
    const { groupId } = req.query;
    const GroupMessage = require("./models/GroupMessage");
    const now = new Date();
    const messages = await GroupMessage.find({
      groupId,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ]
    }).populate("replyTo").sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.post("/messages", async (req, res) => {
  try {
    const { sender, receiver, content, attachments, replyTo, disappearAfter, messageType, fileUrl, fileName } = req.body;
    const Message = require("./models/Message");
    let expiresAt = null;
    if (disappearAfter && disappearAfter > 0) {
      expiresAt = new Date(Date.now() + disappearAfter * 1000);
    }
    
    const attachmentList = attachments || [];
    if (fileUrl) {
      attachmentList.push({ fileUrl, fileName: fileName || "file" });
    }

    const message = await Message.create({
      sender,
      receiver,
      content: content || "",
      attachments: attachmentList,
      read: false,
      replyTo: replyTo || null,
      disappearAfter: disappearAfter || 0,
      expiresAt,
      status: "sent",
      text: content || "",
      messageType: messageType || (fileUrl ? "file" : "text"),
      fileUrl: fileUrl || "",
      fileName: fileName || ""
    });

    res.json({ success: true, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.post("/groupmessages", async (req, res) => {
  try {
    const { sender, groupId, content, attachments, replyTo, disappearAfter, messageType, fileUrl, fileName } = req.body;
    const GroupMessage = require("./models/GroupMessage");
    let expiresAt = null;
    if (disappearAfter && disappearAfter > 0) {
      expiresAt = new Date(Date.now() + disappearAfter * 1000);
    }

    const attachmentList = attachments || [];
    if (fileUrl) {
      attachmentList.push({ fileUrl, fileName: fileName || "file" });
    }

    const message = await GroupMessage.create({
      sender,
      groupId,
      content: content || "",
      attachments: attachmentList,
      replyTo: replyTo || null,
      disappearAfter: disappearAfter || 0,
      expiresAt,
      text: content || "",
      messageType: messageType || (fileUrl ? "file" : "text"),
      fileUrl: fileUrl || "",
      fileName: fileName || ""
    });

    res.json({ success: true, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

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

    if (user.isSuspended) {
      return res.json({
        success: false,
        message: "Your account has been suspended by the administrator.",
      });
    }

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

// Background Self-Destruct Cleanup Loop (runs every 5 seconds)
const messageService = require("./services/messageService");
const socketService = require("./services/socketService");
const { getIO } = require("./socket/socket");

setInterval(async () => {
  try {
    // 1. Self-destruct messages cleanup
    const expired = await messageService.cleanupExpiredMessages();
    if (expired && expired.length > 0) {
      const io = getIO();
      if (io) {
        expired.forEach((msg) => {
          const { id, sender, receiver } = msg;

          // Notify receiver
          const receiverSockets = socketService.getSocketsByUsername(receiver);
          receiverSockets.forEach((socketId) => {
            io.to(socketId).emit("message-deleted", { id, isSelfDestruct: true });
          });

          // Notify sender
          const senderSockets = socketService.getSocketsByUsername(sender);
          senderSockets.forEach((socketId) => {
            io.to(socketId).emit("message-deleted", { id, isSelfDestruct: true });
          });
        });
      }
    }

    // 2. Scheduled broadcasts processing
    const Broadcast = require("./models/Broadcast");
    const now = new Date();
    const unsentBroadcasts = await Broadcast.find({
      sent: false,
      scheduledAt: { $lte: now }
    });

    if (unsentBroadcasts && unsentBroadcasts.length > 0) {
      const io = getIO();
      for (const b of unsentBroadcasts) {
        b.sent = true;
        await b.save();

        if (io) {
          io.emit("receive-broadcast", b);
        }
      }
      console.log(`📢 Sent ${unsentBroadcasts.length} scheduled broadcasts.`);
    }
  } catch (err) {
    console.error("Error in background cron job:", err);
  }
}, 5000);

// Start Server
const PORT = process.env.PORT || 5050;

server.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});