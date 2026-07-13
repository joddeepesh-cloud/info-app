const mongoose = require("mongoose");

const privateMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
    },
    receiver: {
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
      ref: "PrivateMessage",
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

privateMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("PrivateMessage", privateMessageSchema);
