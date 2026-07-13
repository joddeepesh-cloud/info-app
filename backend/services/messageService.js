const Message = require("../models/Message");
const mongoose = require("mongoose");

/**
 * Create a new message (text or file) and handle self-destruct expiry calculation.
 */
const createMessage = async (data) => {
  const { sender, receiver, text, messageType, fileUrl, fileName, replyTo, disappearAfter, groupId } = data;

  let expiresAt = null;
  if (disappearAfter && disappearAfter > 0) {
    expiresAt = new Date(Date.now() + disappearAfter * 1000);
  }

  const attachments = [];
  if (fileUrl) {
    attachments.push({ fileUrl, fileName: fileName || "file" });
  }

  const messageData = {
    sender,
    receiver: groupId ? null : receiver,
    groupId: groupId || null,
    content: text || "",
    attachments,
    read: false,
    replyTo: replyTo || null,
    messageType: messageType || "text",
    fileUrl: fileUrl || "",
    fileName: fileName || "",
    disappearAfter: disappearAfter || 0,
    expiresAt,
    status: "sent"
  };

  const message = await Message.create(messageData);
  if (replyTo) {
    return await Message.findById(message._id).populate("replyTo");
  }
  return message;
};

/**
 * Fetch direct message or group message conversations, filtered by expiresAt.
 */
const getConversation = async (user1, user2) => {
  const now = new Date();

  if (mongoose.Types.ObjectId.isValid(user2)) {
    // Fetch group messages
    const messages = await Message.find({
      groupId: user2,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ]
    })
    .populate("replyTo")
    .sort({ createdAt: 1 });

    return messages;
  } else {
    // Fetch private direct messages
    const messages = await Message.find({
      groupId: null,
      $and: [
        {
          $or: [
            { sender: user1, receiver: user2 },
            { sender: user2, receiver: user1 }
          ]
        },
        {
          $or: [
            { expiresAt: null },
            { expiresAt: { $gt: now } }
          ]
        }
      ]
    })
    .populate("replyTo")
    .sort({ createdAt: 1 });

    return messages;
  }
};

/**
 * Delete a message for a specific user (soft delete).
 */
const deleteForMe = async (messageId, username) => {
  return await Message.findByIdAndUpdate(
    messageId,
    { $addToSet: { deletedForMe: username } },
    { new: true }
  ).populate("replyTo");
};

/**
 * Delete a message for everyone (replaces content).
 */
const deleteForEveryone = async (messageId) => {
  return await Message.findByIdAndUpdate(
    messageId,
    {
      deletedForEveryone: true,
      content: "This message has been deleted",
      fileUrl: "",
      fileName: "",
      messageType: "text",
      attachments: []
    },
    { new: true }
  ).populate("replyTo");
};

/**
 * Mark all messages received by receiver from sender as read.
 */
const markConversationRead = async (sender, receiver) => {
  await Message.updateMany(
    { sender: receiver, receiver: sender, status: { $ne: "read" } },
    { $set: { status: "read", read: true } }
  );
};

/**
 * Mark all messages received by receiver from sender as delivered.
 */
const markConversationDelivered = async (sender, receiver) => {
  await Message.updateMany(
    { sender: receiver, receiver: sender, status: "sent" },
    { $set: { status: "delivered" } }
  );
};

/**
 * Search messages in a conversation.
 */
const searchMessages = async (query, user1, user2) => {
  const now = new Date();
  const searchRegex = new RegExp(query, "i");

  if (mongoose.Types.ObjectId.isValid(user2)) {
    return await Message.find({
      groupId: user2,
      $or: [{ content: { $regex: searchRegex } }, { text: { $regex: searchRegex } }],
      deletedForEveryone: false,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ]
    })
    .populate("replyTo")
    .sort({ createdAt: 1 });
  }

  return await Message.find({
    groupId: null,
    $and: [
      {
        $or: [
          { sender: user1, receiver: user2 },
          { sender: user2, receiver: user1 }
        ]
      },
      {
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: now } }
        ]
      }
    ],
    $or: [{ content: { $regex: searchRegex } }, { text: { $regex: searchRegex } }],
    deletedForEveryone: false
  })
  .populate("replyTo")
  .sort({ createdAt: 1 });
};

/**
 * Clean up messages that have passed their expiration date.
 */
const cleanupExpiredMessages = async () => {
  const now = new Date();
  
  const expired = await Message.find({
    expiresAt: { $ne: null, $lte: now }
  });

  if (expired.length === 0) return [];

  const expiredIds = expired.map(msg => msg._id);
  const conversations = expired.map(msg => ({
    id: msg._id,
    sender: msg.sender,
    receiver: msg.receiver,
    groupId: msg.groupId
  }));

  await Message.deleteMany({ _id: { $in: expiredIds } });

  return conversations;
};

/**
 * Edit an existing message.
 */
const editMessage = async (messageId, newText) => {
  return await Message.findByIdAndUpdate(
    messageId,
    { content: newText, text: newText, isEdited: true },
    { new: true }
  ).populate("replyTo");
};

module.exports = {
  createMessage,
  getConversation,
  deleteForMe,
  deleteForEveryone,
  markConversationRead,
  markConversationDelivered,
  searchMessages,
  cleanupExpiredMessages,
  editMessage
};
