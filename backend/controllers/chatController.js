const fs = require("fs");
const path = require("path");
const messageService = require("../services/messageService");

/**
 * Send a message (text, file, and/or self-destruct).
 */
const sendMessage = async (req, res) => {
  try {
    const { sender, receiver, text, messageType, fileUrl, fileName, replyTo, disappearAfter, groupId } = req.body;

    const message = await messageService.createMessage({
      sender,
      receiver,
      text,
      messageType,
      fileUrl,
      fileName,
      replyTo,
      disappearAfter,
      groupId
    });

    res.json({
      success: true,
      message
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to send message"
    });
  }
};

/**
 * Fetch all messages in a conversation.
 */
const getMessages = async (req, res) => {
  try {
    const { sender, receiver } = req.params;
    const mongoose = require("mongoose");
    const Group = require("../models/Group");
    const Message = require("../models/Message");

    // Check if receiver is a valid MongoDB Group ID
    if (mongoose.Types.ObjectId.isValid(receiver)) {
      const group = await Group.findById(receiver);
      if (group) {
        const now = new Date();
        const messages = await Message.find({
          groupId: receiver,
          $or: [
            { expiresAt: null },
            { expiresAt: { $gt: now } }
          ]
        })
          .populate("replyTo")
          .sort({ createdAt: 1 });
        return res.json(messages);
      }
    }

    const messages = await messageService.getConversation(sender, receiver);
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to load messages"
    });
  }
};

/**
 * Delete a message for a specific user (soft delete).
 */
const deleteForMe = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { username } = req.body; // User requesting deletion

    if (!username) {
      return res.status(400).json({ success: false, message: "Username is required" });
    }

    const message = await messageService.deleteForMe(messageId, username);
    res.json({ success: true, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete message for me" });
  }
};

/**
 * Delete a message for everyone (hard delete/content replacement).
 */
const deleteForEveryone = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await messageService.deleteForEveryone(messageId);
    res.json({ success: true, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete message for everyone" });
  }
};

/**
 * Mark unread messages in a conversation as read.
 */
const markRead = async (req, res) => {
  try {
    const { sender, receiver } = req.body; // receiver is the reader

    await messageService.markConversationRead(receiver, sender);
    res.json({ success: true, message: "Messages marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

/**
 * Mark sent messages in a conversation as delivered.
 */
const markDelivered = async (req, res) => {
  try {
    const { sender, receiver } = req.body;

    await messageService.markConversationDelivered(receiver, sender);
    res.json({ success: true, message: "Messages marked as delivered" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

/**
 * Search messages text in a conversation.
 */
const searchMessages = async (req, res) => {
  try {
    const { sender, receiver } = req.params;
    const { q } = req.query;

    if (!q) {
      return res.json([]);
    }

    const messages = await messageService.searchMessages(q, sender, receiver);
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to search messages" });
  }
};

/**
 * Upload a file as base64 and save it to the static uploads folder.
 */
const uploadFile = async (req, res) => {
  try {
    const { fileName, fileData } = req.body;
    if (!fileName || !fileData) {
      return res.status(400).json({ success: false, message: "Missing file name or data" });
    }

    const buffer = Buffer.from(fileData, "base64");
    const uploadDir = path.join(__dirname, "../uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${fileName}`;
    const filePath = path.join(uploadDir, uniqueName);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `http://localhost:5050/uploads/${uniqueName}`;
    res.json({
      success: true,
      fileUrl,
      fileName: uniqueName
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to upload file" });
  }
};

const getGroups = async (req, res) => {
  try {
    const { username } = req.query;
    const User = require("../models/User");
    const Group = require("../models/Group");
    const GroupMessage = require("../models/GroupMessage");

    const user = await User.findOne({ username });
    let groups;
    if (user && user.role === "admin") {
      groups = await Group.find().sort({ name: 1 });
    } else {
      groups = await Group.find({ members: username }).sort({ name: 1 });
    }

    const groupsWithLastMessage = await Promise.all(
      groups.map(async (g) => {
        const lastMsg = await GroupMessage.findOne({ groupId: g._id })
          .sort({ createdAt: -1 })
          .select("text sender createdAt messageType fileUrl");
        return {
          ...g.toObject(),
          lastMessage: lastMsg ? (lastMsg.messageType === "file" ? "Sent a file" : lastMsg.text) : "",
          lastMessageTime: lastMsg ? lastMsg.createdAt : null,
          lastMessageSender: lastMsg ? lastMsg.sender : ""
        };
      })
    );

    res.json(groupsWithLastMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load groups" });
  }
};

const createGroup = async (req, res) => {
  try {
    const { name, description, members, createdBy } = req.body;
    const Group = require("../models/Group");

    const exists = await Group.findOne({ name });
    if (exists) {
      return res.json({ success: false, message: "Group name already exists" });
    }

    const group = await Group.create({
      name,
      description,
      members: members || [],
      createdBy
    });

    const io = require("../socket/socket").getIO();
    if (io) {
      io.emit("group-created", group);
    }

    res.json({ success: true, group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to create group" });
  }
};

const editGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, members } = req.body;
    const Group = require("../models/Group");

    const group = await Group.findByIdAndUpdate(
      groupId,
      { name, description, members },
      { new: true }
    );

    const io = require("../socket/socket").getIO();
    if (io) {
      io.emit("group-updated", group);
    }

    res.json({ success: true, group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to edit group" });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const Group = require("../models/Group");

    const group = await Group.findByIdAndDelete(groupId);

    const io = require("../socket/socket").getIO();
    if (io) {
      io.emit("group-deleted", { groupId });
    }

    res.json({ success: true, message: "Group deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete group" });
  }
};

const pinMessage = async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const Group = require("../models/Group");

    const group = await Group.findByIdAndUpdate(
      groupId,
      { $addToSet: { pinnedMessages: messageId } },
      { new: true }
    );
    res.json({ success: true, group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to pin message" });
  }
};

const unpinMessage = async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const Group = require("../models/Group");

    const group = await Group.findByIdAndUpdate(
      groupId,
      { $pull: { pinnedMessages: messageId } },
      { new: true }
    );
    res.json({ success: true, group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to unpin message" });
  }
};

const getBroadcasts = async (req, res) => {
  try {
    const Broadcast = require("../models/Broadcast");
    const broadcasts = await Broadcast.find({
      sent: true,
      scheduledAt: { $lte: new Date() }
    }).sort({ scheduledAt: -1 });
    res.json(broadcasts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load broadcasts" });
  }
};

const getAllBroadcasts = async (req, res) => {
  try {
    const Broadcast = require("../models/Broadcast");
    const broadcasts = await Broadcast.find().sort({ scheduledAt: -1 });
    res.json(broadcasts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load all broadcasts" });
  }
};

const createBroadcast = async (req, res) => {
  try {
    const { sender, text, messageType, fileUrl, fileName, scheduledAt } = req.body;
    const Broadcast = require("../models/Broadcast");

    const isScheduledFuture = scheduledAt && new Date(scheduledAt) > new Date();

    const broadcast = await Broadcast.create({
      sender,
      text,
      messageType: messageType || "text",
      fileUrl: fileUrl || "",
      fileName: fileName || "",
      scheduledAt: scheduledAt || new Date(),
      sent: !isScheduledFuture
    });

    res.json({ success: true, broadcast });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to create broadcast" });
  }
};

const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: "Text content is required" });
    }

    const message = await messageService.editMessage(messageId, text);
    res.json({ success: true, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to edit message" });
  }
};

const reactMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { username, emoji } = req.body;

    const Message = require("../models/Message");
    let msg = await Message.findById(messageId);

    if (!msg) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    const existingIndex = msg.reactions.findIndex(
      (r) => r.username === username && r.emoji === emoji
    );

    if (existingIndex !== -1) {
      msg.reactions.splice(existingIndex, 1);
    } else {
      const previousIndex = msg.reactions.findIndex((r) => r.username === username);
      if (previousIndex !== -1) {
        msg.reactions.splice(previousIndex, 1);
      }
      msg.reactions.push({ username, emoji });
    }

    await msg.save();
    res.json({ success: true, message: msg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update reaction" });
  }
};

const getSettings = async (req, res) => {
  try {
    const WorkspaceSetting = require("../models/WorkspaceSetting");
    let setting = await WorkspaceSetting.findOne();
    if (!setting) {
      setting = await WorkspaceSetting.create({
        automaticTime: true,
        timezone: "UTC",
        manualTimeOffset: 0
      });
    }
    res.json(setting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch workspace settings" });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { automaticTime, timezone, manualTimeOffset } = req.body;
    const WorkspaceSetting = require("../models/WorkspaceSetting");
    let setting = await WorkspaceSetting.findOne();
    if (!setting) {
      setting = new WorkspaceSetting();
    }
    
    setting.automaticTime = automaticTime !== undefined ? automaticTime : setting.automaticTime;
    setting.timezone = timezone || setting.timezone;
    setting.manualTimeOffset = manualTimeOffset !== undefined ? manualTimeOffset : setting.manualTimeOffset;

    await setting.save();

    const io = require("../socket/socket").getIO();
    if (io) {
      io.emit("settings-updated", setting);
    }

    res.json({ success: true, setting });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update workspace settings" });
  }
};

const getRecentDMs = async (req, res) => {
  try {
    const { username } = req.query;
    const Message = require("../models/Message");
    if (!username) {
      return res.status(400).json({ success: false, message: "Username query param is required" });
    }

    const messages = await Message.find({
      groupId: null,
      $or: [{ sender: username }, { receiver: username }]
    }).sort({ createdAt: -1 });

    const partnersMap = new Map();
    messages.forEach((msg) => {
      const partner = msg.sender === username ? msg.receiver : msg.sender;
      if (!partnersMap.has(partner)) {
        partnersMap.set(partner, {
          partner,
          content: msg.content || msg.text || "Sent a file",
          createdAt: msg.createdAt
        });
      }
    });

    res.json(Array.from(partnersMap.values()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load recent DMs" });
  }
};

const getUnreadNotifications = async (req, res) => {
  try {
    const { username } = req.query;
    const Message = require("../models/Message");
    if (!username) {
      return res.status(400).json({ success: false, message: "Username is required" });
    }

    const unread = await Message.find({
      receiver: username,
      groupId: null,
      read: false
    })
    .sort({ createdAt: -1 })
    .limit(10);

    res.json(unread);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

const getRecentFiles = async (req, res) => {
  try {
    const Message = require("../models/Message");
    const files = await Message.find({
      $or: [
        { fileUrl: { $ne: "" } },
        { "attachments.0": { $exists: true } }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(8);

    const formatted = files.map((f) => ({
      _id: f._id,
      fileName: f.fileName || (f.attachments[0] && f.attachments[0].fileName) || "attachment",
      fileUrl: f.fileUrl || (f.attachments[0] && f.attachments[0].fileUrl) || "",
      sender: f.sender,
      createdAt: f.createdAt
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

const getWorkspaceActivity = async (req, res) => {
  try {
    const Message = require("../models/Message");
    const Group = require("../models/Group");

    const messages = await Message.find().sort({ createdAt: -1 }).limit(6);
    const groups = await Group.find().sort({ createdAt: -1 }).limit(6);

    const activity = [];
    messages.forEach((m) => {
      activity.push({
        _id: m._id,
        type: "message",
        text: `${m.sender} sent a message`,
        createdAt: m.createdAt
      });
    });

    groups.forEach((g) => {
      activity.push({
        _id: g._id,
        type: "group",
        text: `Channel #${g.name} created by ${g.createdBy}`,
        createdAt: g.createdAt
      });
    });

    activity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(activity.slice(0, 10));
  } catch (err) {
    console.error(err);
    res.status(550).json({ success: false });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  deleteForMe,
  deleteForEveryone,
  markRead,
  markDelivered,
  searchMessages,
  uploadFile,
  editMessage,
  reactMessage,
  getGroups,
  createGroup,
  editGroup,
  deleteGroup,
  pinMessage,
  unpinMessage,
  getBroadcasts,
  createBroadcast,
  getAllBroadcasts,
  getSettings,
  updateSettings,
  getRecentDMs,
  getUnreadNotifications,
  getRecentFiles,
  getWorkspaceActivity
};