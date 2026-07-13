const mongoose = require("mongoose");

const WorkspaceSettingSchema = new mongoose.Schema(
  {
    automaticTime: {
      type: Boolean,
      default: true,
    },
    timezone: {
      type: String,
      default: "UTC", // e.g., "UTC", "America/New_York", "Asia/Kolkata"
    },
    manualTimeOffset: {
      type: Number,
      default: 0, // ms offset from server system time
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WorkspaceSetting", WorkspaceSettingSchema);
