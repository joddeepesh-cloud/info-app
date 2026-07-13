const mongoose = require("mongoose");

const groupMessageSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    sender: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      default: "",
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
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupMessage",
      default: null,
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

groupMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("GroupMessage", groupMessageSchema);
