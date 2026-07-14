const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    members: {
      type: [String], // Array of employee usernames
      default: [],
    },
    createdBy: {
      type: String,
      required: true,
    },
    admins: {
      type: [String],
      default: [],
    },
    pinnedMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GroupMessage",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Group", GroupSchema);
