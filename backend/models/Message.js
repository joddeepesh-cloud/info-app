const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
    },
    receiver: {
      type: String,
      default: null, // set to null for group messages
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null, // set to null for private direct messages
    },
    content: {
      type: String,
      default: "", // maps to text content of the message
    },
    text: {
      type: String,
      default: "", // duplicate of content, used by frontend for display
    },
    messageType: {
      type: String,
      enum: ["text", "file"],
      default: "text",
    },
    fileUrl: {
      type: String,
      default: "",
    },
    fileName: {
      type: String,
      default: "",
    },
    attachments: [
      {
        fileUrl: { type: String, default: "" },
        fileName: { type: String, default: "" }
      }
    ],
    read: {
      type: Boolean,
      default: false,
    },
    // Preserve other functional properties for system stability (edit, delete, disappearing DMs, replies, reactions)
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
    deletedForMe: {
      type: [String],
      default: [],
    },
    disappearAfter: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    reactions: [
      {
        username: String,
        emoji: String
      }
    ],
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });
messageSchema.index({ receiver: 1, sender: 1, createdAt: 1 });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Message", messageSchema);