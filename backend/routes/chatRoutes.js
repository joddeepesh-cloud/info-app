const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getMessages,
  deleteForMe,
  deleteForEveryone,
  editMessage,
  reactMessage,
  markRead,
  markDelivered,
  searchMessages,
  uploadFile,
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
  getWorkspaceActivity,
  leaveGroup
} = require("../controllers/chatController");

router.post("/send", sendMessage);
router.get("/:sender/:receiver", getMessages);
router.put("/delete-for-me/:messageId", deleteForMe);
router.put("/delete-for-everyone/:messageId", deleteForEveryone);
router.put("/edit/:messageId", editMessage);
router.put("/react/:messageId", reactMessage);
router.put("/read", markRead);
router.put("/delivered", markDelivered);
router.get("/:sender/:receiver/search", searchMessages);
router.post("/upload", uploadFile);

// Groups Routing
router.get("/groups/list", getGroups); // list groups for user
router.post("/groups/create", createGroup);
router.put("/groups/:groupId", editGroup);
router.delete("/groups/:groupId", deleteGroup);
router.put("/groups/:groupId/leave", leaveGroup);
router.put("/groups/:groupId/pin/:messageId", pinMessage);
router.put("/groups/:groupId/unpin/:messageId", unpinMessage);

// Broadcasts Routing
router.get("/broadcasts/active", getBroadcasts); // sent = true
router.get("/broadcasts/all", getAllBroadcasts); // admin list including scheduled
router.post("/broadcasts/create", createBroadcast);

// Workspace Settings Routing
router.get("/settings/workspace", getSettings);
router.put("/settings/workspace", updateSettings);

// Dashboard Widgets Routing
router.get("/widgets/recent-dms", getRecentDMs);
router.get("/widgets/unread-notifications", getUnreadNotifications);
router.get("/widgets/recent-files", getRecentFiles);
router.get("/widgets/workspace-activity", getWorkspaceActivity);

module.exports = router;