import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { 
  IoSend, 
  IoAttach, 
  IoTrash, 
  IoArrowBack, 
  IoSearch, 
  IoTimeOutline, 
  IoArrowUndo, 
  IoClose, 
  IoDocumentAttachOutline, 
  IoImageOutline, 
  IoCheckmark, 
  IoCheckmarkDone,
  IoAlertCircleOutline,
  IoHappyOutline,
  IoCloudUploadOutline,
  IoDocumentTextOutline,
  IoEyeOutline,
  IoPencilOutline,
  IoLockClosedOutline,
  IoPinOutline,
  IoPin,
  IoArrowRedoOutline,
  IoArrowRedo,
  IoStarOutline,
  IoStar,
  IoRefreshOutline
} from "react-icons/io5";
import socket from "../hooks/useSocket";
import Sidebar from "../components/dashboard/Sidebar";
import Navbar from "../components/dashboard/Navbar";
import ProfileDrawer from "../components/dashboard/ProfileDrawer";
import ImageViewer from "../components/common/ImageViewer";
import { encryptText, decryptText } from "../utils/crypto";
import { useTime } from "../context/TimeContext";
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught rendering error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 text-slate-100">
          <h2 className="text-sm font-bold text-red-400 mb-2">Something went wrong in the chat view.</h2>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold rounded-xl text-slate-350 transition cursor-pointer"
          >
            Refresh View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Chat() {
  const { formatTime, formatDate, adjustTimestamp, getWorkspaceTime } = useTime();
  const location = useLocation();
  const navigate = useNavigate();
  const loggedUser = JSON.parse(localStorage.getItem("user"));

  if (!loggedUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center bg-slate-900 p-8 rounded-2xl border border-slate-800 max-w-sm animate-slide-up">
          <IoAlertCircleOutline className="text-red-400 text-5xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Session Expired</h1>
          <p className="text-gray-400 mb-6">Please log in again to access the enterprise chat.</p>
          <button 
            onClick={() => navigate("/")}
            className="w-full bg-cyan-500 hover:bg-cyan-600 py-3 rounded-xl font-semibold transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const sender = loggedUser.username;

  // Active chat target state (can be a user object or group object)
  const [activeColleague, setActiveColleague] = useState(
    location.state?.user || null
  );

  // Lists & data
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [colleagueSearch, setColleagueSearch] = useState("");

  // Input states
  const [messageText, setMessageText] = useState("");
  const [disappearAfter, setDisappearAfter] = useState(0); 
  const [replyingTo, setReplyingTo] = useState(null); 
  const [attachedFile, setAttachedFile] = useState(null); 
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Editing state
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editInputText, setEditInputText] = useState("");

  // Drag and Drop state
  const [isDragging, setIsDragging] = useState(false);

  // Emoji Popover
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  // Image viewer lightbox states
  const [lightboxSrc, setLightboxSrc] = useState(null);

  // PDF Preview modal
  const [docPreviewFile, setDocPreviewFile] = useState(null); 

  // Search in chat
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Pinned messages panel
  const [pinnedPanelOpen, setPinnedPanelOpen] = useState(false);
  const [groupMetadata, setGroupMetadata] = useState(null);

  // Forwarding Modal states
  const [forwardTargetModal, setForwardTargetModal] = useState(false);
  const [forwardingMsg, setForwardingMsg] = useState(null); // Message object

  // UI state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [colleagueTyping, setColleagueTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]); 
  const [unreadCounts, setUnreadCounts] = useState({}); 

  // Advanced features states
  const [starredMessages, setStarredMessages] = useState([]);
  const [starredPanelOpen, setStarredPanelOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(35);
  const [failedMessages, setFailedMessages] = useState([]);

  const typingTimeout = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const isGroupChat = !!activeColleague?.members;

  const getGroupOnlineCount = () => {
    if (!isGroupChat || !activeColleague) return 0;
    let onlineCount = 0;
    users.forEach((u) => {
      if (activeColleague.members?.includes(u.username)) {
        const isOnline = u.status === "Online" || u.status === "Away" || u.status === "Busy";
        if (isOnline) onlineCount++;
      }
    });
    if (activeColleague.members?.includes(sender)) {
      onlineCount++;
    }
    return onlineCount;
  };

  // Synthesize notification beep locally (No external asset needed)
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.log("Audio chime blocked by browser settings", e);
    }
  };

  // Load starred messages
  useEffect(() => {
    if (loggedUser?.username) {
      const stored = localStorage.getItem("starredMessages_" + loggedUser.username);
      if (stored) setStarredMessages(JSON.parse(stored));
    }
  }, [loggedUser]);

  const handleToggleStar = (msgId) => {
    setStarredMessages((prev) => {
      const isCurrentlyStarred = prev.includes(msgId);
      const updated = isCurrentlyStarred
        ? prev.filter((id) => id !== msgId)
        : [...prev, msgId];
      localStorage.setItem("starredMessages_" + loggedUser?.username, JSON.stringify(updated));
      toast(isCurrentlyStarred ? "Removed from Stars" : "Added to Stars", { icon: "⭐" });
      return updated;
    });
  };

  // Keyboard Shortcuts (ESC to cancel replies/forwards/searches)
  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      if (e.key === "Escape") {
        setReplyingTo(null);
        setForwardTargetModal(false);
        setForwardingMsg(null);
        setChatSearchOpen(false);
        setChatSearchQuery("");
        setSearchResults([]);
        setEmojiPickerOpen(false);
      }
    };
    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, []);

  // Load colleagues, groups, and presence
  useEffect(() => {
    loadColleagues();
    loadGroups();

    // Register user as online
    socket.emit("user-online", loggedUser._id);

    // Socket listeners with strict unbinds on dependency change
    socket.on("private-message", (msg) => {
      const isForActivePrivate = !isGroupChat && (
        (msg.sender === activeColleague?.username && msg.receiver === sender) ||
        (msg.sender === sender && msg.receiver === activeColleague?.username)
      );

      if (isForActivePrivate) {
        setMessages((prev) => {
          if (prev.find((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        if (msg.sender !== sender) {
          markChatRead(activeColleague.username);
          socket.emit("message-read", { sender: activeColleague.username, receiver: sender });
        }
      } else {
        const countKey = msg.sender;
        setUnreadCounts((prev) => ({
          ...prev,
          [countKey]: (prev[countKey] || 0) + 1
        }));
        playNotificationSound();
        if (Notification.permission === "granted") {
          new Notification(`New DM from ${msg.sender}`, {
            body: decryptText(msg.text) || "Sent a file"
          });
        }
        toast(`New direct message from ${msg.sender}: "${decryptText(msg.text) || "Sent a file"}"`, {
          icon: "👤",
          style: {
            background: "#151C2C",
            color: "#E2E8F0",
            border: "1px solid #222F47"
          }
        });
      }
    });

    socket.on("group-message", (msg) => {
      const isForActiveGroup = isGroupChat && msg.groupId === activeColleague?._id;

      if (isForActiveGroup) {
        setMessages((prev) => {
          if (prev.find((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      } else {
        const countKey = msg.groupId;
        setUnreadCounts((prev) => ({
          ...prev,
          [countKey]: (prev[countKey] || 0) + 1
        }));
        playNotificationSound();
        if (Notification.permission === "granted") {
          new Notification(`New message in group channel`, {
            body: `${msg.sender}: ${msg.text || "Sent a file"}`
          });
        }
        toast(`New group message in #${msg.groupId}: "${msg.text || "Sent a file"}"`, {
          icon: "📣",
          style: {
            background: "#151C2C",
            color: "#E2E8F0",
            border: "1px solid #222F47"
          }
        });
      }
    });

    socket.on("user-typing", (data) => {
      if (isGroupChat && data.groupId === activeColleague?._id) {
        if (data.sender !== sender && !typingUsers.includes(data.sender)) {
          setTypingUsers((prev) => [...prev, data.sender]);
        }
      } else if (!isGroupChat && data.sender === activeColleague?.username) {
        setColleagueTyping(true);
      }
    });

    socket.on("user-stop-typing", (data) => {
      if (isGroupChat && data.groupId === activeColleague?._id) {
        setTypingUsers((prev) => prev.filter((u) => u !== data.sender));
      } else if (!isGroupChat && data.sender === activeColleague?.username) {
        setColleagueTyping(false);
      }
    });

    socket.on("message-read", (data) => {
      if (!isGroupChat && data.receiver === activeColleague?.username) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender === sender ? { ...msg, status: "read" } : msg
          )
        );
      }
    });

    socket.on("message-delivered", (data) => {
      if (!isGroupChat && data.receiver === activeColleague?.username) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender === sender && msg.status === "sent"
              ? { ...msg, status: "delivered" }
              : msg
          )
        );
      }
    });

    socket.on("message-deleted", (data) => {
      const { id, isEveryone } = data;
      setMessages((prev) =>
        prev
          .map((msg) => {
            if (msg._id === id) {
              if (isEveryone) {
                return {
                  ...msg,
                  deletedForEveryone: true,
                  text: "This message has been deleted",
                  fileUrl: "",
                  fileName: "",
                  messageType: "text"
                };
              }
              return null; // deleted for me
            }
            return msg;
          })
          .filter(Boolean)
      );
    });

    socket.on("message-edited", (data) => {
      const { id, text } = data;
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === id ? { ...msg, text, isEdited: true } : msg
        )
      );
    });

    socket.on("message-reacted", (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId ? { ...msg, reactions: data.reactions } : msg
        )
      );
    });

    socket.on("group-pin-updated", (data) => {
      if (isGroupChat && activeColleague?._id === data.groupId) {
        loadGroupMetadata(data.groupId);
      }
    });

    socket.on("user-status-change", (data) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.username === data.username ? { ...u, status: data.status } : u
        )
      );
      if (!isGroupChat && activeColleague && activeColleague.username === data.username) {
        setActiveColleague((prev) => ({ ...prev, status: data.status }));
      }
    });

    socket.on("group-created", (group) => {
      if (group.members.includes(sender) || group.createdBy === sender) {
        setGroups((prev) => {
          if (prev.find((g) => g._id === group._id)) return prev;
          return [...prev, group];
        });
        socket.emit("join-group", { groupId: group._id });
        toast(`Added to channel: #${group.name}`, { icon: "📣" });
      }
    });

    socket.on("group-updated", (group) => {
      if (group.members.includes(sender) || group.createdBy === sender) {
        setGroups((prev) =>
          prev.map((g) => (g._id === group._id ? group : g))
        );
        if (activeColleague?._id === group._id) {
          setActiveColleague(group);
          loadGroupMetadata(group._id);
        }
      } else {
        setGroups((prev) => prev.filter((g) => g._id !== group._id));
        if (activeColleague?._id === group._id) {
          setActiveColleague(null);
        }
      }
    });

    socket.on("group-deleted", ({ groupId }) => {
      setGroups((prev) => prev.filter((g) => g._id !== groupId));
      if (activeColleague?._id === groupId) {
        setActiveColleague(null);
        toast("This channel has been deleted", { icon: "🗑️" });
      }
    });

    return () => {
      socket.off("private-message");
      socket.off("group-message");
      socket.off("user-typing");
      socket.off("user-stop-typing");
      socket.off("message-read");
      socket.off("message-delivered");
      socket.off("message-deleted");
      socket.off("message-edited");
      socket.off("message-reacted");
      socket.off("group-pin-updated");
      socket.off("user-status-change");
      socket.off("group-created");
      socket.off("group-updated");
      socket.off("group-deleted");
    };
  }, [activeColleague]);

  // Load conversation when active target changes
  useEffect(() => {
    if (activeColleague) {
      loadConversation(activeColleague);
      setColleagueTyping(false);
      setTypingUsers([]);
      setPinnedPanelOpen(false);
    }
  }, [activeColleague]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, colleagueTyping, typingUsers]);

  const loadColleagues = async () => {
    try {
      const res = await axios.get(window.API_BASE_URL + "/users");
      setUsers(res.data.filter((u) => u.username !== sender && !u.isSuspended));
    } catch (err) {
      console.error(err);
    }
  };

  const loadGroups = async () => {
    try {
      const res = await axios.get(
        `${window.API_BASE_URL}/groups?username=${sender}`
      );
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadGroupMetadata = async (groupId) => {
    try {
      const res = await axios.get(
        `${window.API_BASE_URL}/groups?username=${sender}`
      );
      const matched = res.data.find((g) => g._id === groupId);
      setGroupMetadata(matched);
    } catch (err) {
      console.error(err);
    }
  };

  const loadConversation = async (target) => {
    setLoadingMessages(true);
    try {
      if (target.members) {
        // Group Chat load
        const res = await axios.get(
          `${window.API_BASE_URL}/groupmessages?groupId=${target._id}`
        );
        setMessages(res.data);
        await loadGroupMetadata(target._id);
        
        socket.emit("join-group", { groupId: target._id });

        setUnreadCounts((prev) => ({ ...prev, [target._id]: 0 }));
      } else {
        // Private Chat load
        const res = await axios.get(
          `${window.API_BASE_URL}/messages?sender=${sender}&receiver=${target.username}`
        );
        const visible = res.data.filter((m) => !m.deletedForMe?.includes(sender));
        setMessages(visible);
        await markChatRead(target.username);
        
        setUnreadCounts((prev) => ({ ...prev, [target.username]: 0 }));
        socket.emit("message-read", { sender: target.username, receiver: sender });
        socket.emit("message-delivered", { sender: target.username, receiver: sender });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const markChatRead = async (colleagueUsername) => {
    try {
      await axios.put(window.API_BASE_URL + "/chat/read", {
        sender: colleagueUsername,
        receiver: sender
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Typing emits
  const handleMessageChange = (e) => {
    setMessageText(e.target.value);
    if (!activeColleague) return;

    const payload = isGroupChat 
      ? { sender, groupId: activeColleague._id }
      : { sender, receiver: activeColleague.username };

    socket.emit("typing", payload);

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stop-typing", payload);
    }, 2000);
  };

  // Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file) => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(10);
    
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 150);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedFile({
        name: file.name,
        type: file.type,
        base64: reader.result.split(",")[1]
      });
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 300);
    };
    reader.readAsDataURL(file);
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !attachedFile) return;
    if (!activeColleague) return;

    let fileUrl = "";
    let fileName = "";
    let messageType = "text";

    if (attachedFile) {
      setIsUploading(true);
      setUploadProgress(15);
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => (prev >= 90 ? 90 : prev + 15));
      }, 100);

      try {
        const uploadRes = await axios.post(window.API_BASE_URL + "/chat/upload", {
          fileName: attachedFile.name,
          fileData: attachedFile.base64
        });
        clearInterval(progressTimer);
        setUploadProgress(100);
        
        if (uploadRes.data.success) {
          fileUrl = uploadRes.data.fileUrl;
          fileName = uploadRes.data.fileName;
          messageType = "file";
        }
        
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 200);
      } catch (err) {
        clearInterval(progressTimer);
        setIsUploading(false);
        setUploadProgress(0);
        console.error("Upload failed", err);
        toast.error("File upload failed");
        return;
      }
    }

    const textToSend = isGroupChat ? messageText : encryptText(messageText);

    const payload = {
      sender,
      receiver: isGroupChat ? "" : activeColleague.username,
      groupId: isGroupChat ? activeColleague._id : null,
      text: textToSend,
      messageType,
      fileUrl,
      fileName,
      replyTo: replyingTo?._id || null,
      disappearAfter
    };

    try {
      const endpoint = isGroupChat ? window.API_BASE_URL + "/groupmessages" : window.API_BASE_URL + "/messages";
      const res = await axios.post(endpoint, {
        ...payload,
        content: payload.text
      });
      if (res.data.success) {
        const newMsg = res.data.message;
        setMessages((prev) => [...prev, newMsg]);
        
        if (isGroupChat) {
          socket.emit("group-message", newMsg);
        } else {
          socket.emit("private-message", newMsg);
        }
        
        setMessageText("");
        setReplyingTo(null);
        setAttachedFile(null);
        socket.emit("stop-typing", isGroupChat 
          ? { sender, groupId: activeColleague._id } 
          : { sender, receiver: activeColleague.username }
        );
      }
    } catch (err) {
      console.error(err);
      const failedMsg = {
        _id: "failed_" + Date.now(),
        sender,
        receiver: isGroupChat ? "" : activeColleague.username,
        groupId: isGroupChat ? activeColleague._id : null,
        text: messageText,
        messageType,
        fileUrl,
        fileName,
        replyTo: replyingTo?._id || null,
        disappearAfter,
        createdAt: new Date().toISOString(),
        status: "failed"
      };
      setFailedMessages((prev) => [...prev, failedMsg]);
      toast.error("Message failed to send. Click retry.", { icon: "⚠️" });
    }
  };

  const handleRetryMessage = async (failedMsg) => {
    setFailedMessages((prev) => prev.filter((m) => m._id !== failedMsg._id));
    const textToSend = failedMsg.groupId ? failedMsg.text : encryptText(failedMsg.text);
    const payload = {
      sender: failedMsg.sender,
      receiver: failedMsg.receiver,
      groupId: failedMsg.groupId,
      text: textToSend,
      messageType: failedMsg.messageType,
      fileUrl: failedMsg.fileUrl,
      fileName: failedMsg.fileName,
      replyTo: failedMsg.replyTo,
      disappearAfter: failedMsg.disappearAfter
    };

    try {
      const endpoint = failedMsg.groupId ? window.API_BASE_URL + "/groupmessages" : window.API_BASE_URL + "/messages";
      const res = await axios.post(endpoint, {
        ...payload,
        content: payload.text
      });
      if (res.data.success) {
        const newMsg = res.data.message;
        setMessages((prev) => [...prev, newMsg]);
        if (failedMsg.groupId) {
          socket.emit("group-message", newMsg);
        } else {
          socket.emit("private-message", newMsg);
        }
      }
    } catch (err) {
      console.error("Retry failed", err);
      setFailedMessages((prev) => [...prev, failedMsg]);
      toast.error("Retry failed");
    }
  };

  const handleScroll = (e) => {
    const element = e.target;
    if (element.scrollTop === 0) {
      if (messages.length > displayLimit) {
        const prevHeight = element.scrollHeight;
        setDisplayLimit((prev) => prev + 35);
        setTimeout(() => {
          element.scrollTop = element.scrollHeight - prevHeight;
        }, 0);
      }
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;
    try {
      const res = await axios.put(`${window.API_BASE_URL}/chat/groups/${activeColleague._id}/leave`, {
        username: sender
      });
      if (res.data.success) {
        toast.success("Left group successfully");
        setActiveColleague(null);
        loadGroups();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to leave group");
    }
  };

  // Edit message
  const handleEditSubmit = async (messageId) => {
    if (!editInputText.trim()) return;
    try {
      const textToSave = isGroupChat ? editInputText : encryptText(editInputText);

      const res = await axios.put(`${window.API_BASE_URL}/chat/edit/${messageId}`, {
        text: textToSave
      });
      if (res.data.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId ? { ...msg, text: textToSave, isEdited: true } : msg
          )
        );
        
        socket.emit("message-edited", {
          id: messageId,
          sender,
          receiver: isGroupChat ? "" : activeColleague.username,
          groupId: isGroupChat ? activeColleague._id : null,
          text: textToSave
        });

        setEditingMessageId(null);
        setEditInputText("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete message handlers
  const handleDeleteForMe = async (messageId) => {
    try {
      const res = await axios.put(`${window.API_BASE_URL}/chat/delete-for-me/${messageId}`, {
        username: sender
      });
      if (res.data.success) {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteForEveryone = async (messageId) => {
    try {
      const res = await axios.put(`${window.API_BASE_URL}/chat/delete-for-everyone/${messageId}`);
      if (res.data.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? {
                  ...m,
                  deletedForEveryone: true,
                  text: "This message has been deleted",
                  fileUrl: "",
                  fileName: "",
                  messageType: "text"
                }
              : m
          )
        );
        
        socket.emit("message-deleted", {
          id: messageId,
          sender,
          receiver: isGroupChat ? "" : activeColleague.username,
          groupId: isGroupChat ? activeColleague._id : null,
          isEveryone: true
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Group pinning API calls
  const handlePinToggle = async (msg) => {
    if (!isGroupChat) return;
    const isAlreadyPinned = groupMetadata?.pinnedMessages?.includes(msg._id);
    const urlEndpoint = isAlreadyPinned ? "unpin" : "pin";

    try {
      const res = await axios.put(`${window.API_BASE_URL}/chat/groups/${activeColleague._id}/${urlEndpoint}/${msg._id}`);
      if (res.data.success) {
        setGroupMetadata(res.data.group);
        socket.emit("group-pin-change", { groupId: activeColleague._id });
        alert(isAlreadyPinned ? "Message unpinned" : "Message pinned to channel");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Message Reaction API
  const handleToggleReaction = async (msgId, emoji) => {
    try {
      const res = await axios.put(`${window.API_BASE_URL}/chat/react/${msgId}`, {
        username: sender,
        emoji
      });
      if (res.data.success) {
        const updatedMsg = res.data.message;
        setMessages((prev) =>
          prev.map((m) => (m._id === msgId ? { ...m, reactions: updatedMsg.reactions } : m))
        );

        socket.emit("send-reaction", {
          messageId: msgId,
          reactions: updatedMsg.reactions,
          receiver: isGroupChat ? "" : activeColleague.username,
          groupId: isGroupChat ? activeColleague._id : null
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Forwarding Action handler
  const handleSelectForwardTarget = (msg) => {
    setForwardingMsg(msg);
    setForwardTargetModal(true);
  };

  const handleForwardMessage = async (target) => {
    if (!forwardingMsg) return;
    
    const isTargetGroup = !!target.members;
    const isOriginalGroup = !!forwardingMsg.groupId;
    
    // Decrypt if originally private
    const rawText = isOriginalGroup ? forwardingMsg.text : decryptText(forwardingMsg.text);
    
    // Encrypt if forward target is private
    const textToSend = isTargetGroup ? rawText : encryptText(rawText);

    const payload = {
      sender,
      receiver: isTargetGroup ? "" : target.username,
      groupId: isTargetGroup ? target._id : null,
      text: textToSend ? `[Forwarded] ${textToSend}` : "[Forwarded Media]",
      messageType: forwardingMsg.messageType,
      fileUrl: forwardingMsg.fileUrl,
      fileName: forwardingMsg.fileName
    };

    try {
      const endpoint = isTargetGroup ? window.API_BASE_URL + "/groupmessages" : window.API_BASE_URL + "/messages";
      const res = await axios.post(endpoint, {
        ...payload,
        content: payload.text
      });
      if (res.data.success) {
        const forwardedMsg = res.data.message;
        if (isTargetGroup) {
          socket.emit("group-message", forwardedMsg);
        } else {
          socket.emit("private-message", forwardedMsg);
        }
        toast(`Message forwarded to ${isTargetGroup ? target.name : (target.fullName || target.username)}`, { icon: "↪️" });
        setForwardTargetModal(false);
        setForwardingMsg(null);
      }
    } catch (err) {
      console.error("Failed to forward", err);
    }
  };

  // Emoji picker appender
  const appendEmoji = (emoji) => {
    setMessageText((prev) => prev + emoji);
    setEmojiPickerOpen(false);
  };

  // Search message matching
  // Search message matching
  useEffect(() => {
    if (!chatSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      if (!activeColleague) return;
      try {
        const endpoint = isGroupChat 
          ? `${window.API_BASE_URL}/chat/${sender}/${activeColleague._id}/search?q=${chatSearchQuery}`
          : `${window.API_BASE_URL}/chat/${sender}/${activeColleague.username}/search?q=${chatSearchQuery}`;
        const res = await axios.get(endpoint);
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [chatSearchQuery, activeColleague, isGroupChat, sender]);

  const handleChatSearch = (e) => {
    setChatSearchQuery(e.target.value);
  };

  // Date Separators Logic
  const groupMessages = (msgList) => {
    const groups = {};
    msgList.forEach((msg) => {
      const dateStr = formatDate(msg.createdAt);
      const todayStr = formatDate(getWorkspaceTime());
      const yesterdayStr = formatDate(new Date(getWorkspaceTime().getTime() - 86400000));

      let header = dateStr;
      if (dateStr === todayStr) header = "Today";
      else if (dateStr === yesterdayStr) header = "Yesterday";

      if (!groups[header]) groups[header] = [];
      groups[header].push(msg);
    });
    return groups;
  };

  const displayedMessages = messages.slice(-displayLimit);
  const groupedMessages = groupMessages(displayedMessages);

  const firstUnreadId = messages.find(
    (m) => m.sender !== sender && m.status !== "read"
  )?._id;

  const filteredColleagues = users.filter((u) =>
    (u.fullName || u.username).toLowerCase().includes(colleagueSearch.toLowerCase())
  );

  // Extract all images in current messages for gallery view
  const conversationImages = messages
    .filter((m) => m.messageType === "file" && m.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)/i))
    .map((m) => m.fileUrl);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Toaster position="top-right" />
      
      {/* 1. Sidebar */}
      <Sidebar />

      {/* 2. Chat console layout */}
      <div className="flex-1 flex overflow-hidden pt-14 lg:pt-0 pb-16 lg:pb-0">
        
        {/* Left Column: List sidebar */}
        <div className={`w-full sm:w-80 border-r border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col h-full shrink-0 ${activeColleague ? "hidden sm:flex" : "flex"}`}>
          <div className="p-4 border-b border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-extrabold text-slate-100">Enterprise Channels</h2>
            </div>
            
            <div className="relative">
              <IoSearch className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Find colleague or channel..."
                value={colleagueSearch}
                onChange={(e) => setColleagueSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:border-cyan-500/50 text-slate-350 transition"
              />
            </div>
          </div>

          {/* List Scroll wrapper */}
          <div className="flex-1 overflow-y-auto p-2 space-y-4">
            
            {/* Section A: Group Channels */}
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2.5 mb-2">Group Channels</h4>
              {groups.map((g) => {
                const isActive = activeColleague?._id === g._id;
                const unread = unreadCounts[g._id] || 0;
                return (
                  <button
                    key={g._id}
                    onClick={() => setActiveColleague(g)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition text-left relative ${
                      isActive 
                        ? "bg-gradient-to-r from-cyan-500/10 to-indigo-500/5 border border-slate-800 text-white" 
                        : "hover:bg-slate-800/40 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-indigo-950/40 text-indigo-400 border border-indigo-900/30 flex items-center justify-center font-black text-xs shrink-0">
                      #
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="font-bold text-xs text-slate-200 truncate"># {g.name}</p>
                        {g.lastMessageTime && (
                          <span className="text-[9px] text-slate-500 font-semibold shrink-0 pl-1">
                            {formatTime(g.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-0.5 gap-2">
                        <p className="text-[10px] text-slate-400 truncate flex-1">
                          {g.lastMessage ? `${g.lastMessageSender}: ${g.lastMessage}` : "No messages"}
                        </p>
                        <span className="bg-slate-850/60 border border-slate-800 text-slate-500 text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0">
                          {g.members?.length || 0} members
                        </span>
                      </div>
                    </div>
                    {unread > 0 && (
                      <span className="bg-cyan-500 text-slate-950 font-extrabold text-[9px] px-2 py-0.5 rounded-full shrink-0">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
              {groups.length === 0 && (
                <p className="text-[10px] text-slate-655 px-2.5">No group memberships.</p>
              )}
            </div>

            {/* Section B: Colleague Cards */}
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2.5 mb-2">Direct Messages</h4>
              {filteredColleagues.map((u) => {
                const isActive = activeColleague?.username === u.username && !isGroupChat;
                const unread = unreadCounts[u.username] || 0;
                return (
                  <button
                    key={u._id}
                    onClick={() => setActiveColleague(u)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition text-left relative ${
                      isActive 
                        ? "bg-gradient-to-r from-cyan-500/10 to-indigo-500/5 border border-slate-800 text-white" 
                        : "hover:bg-slate-800/40 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-350 text-xs border border-slate-700/60 uppercase">
                        {u.username.substring(0, 2)}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                        u.status === "Online" ? "bg-green-500" :
                        u.status === "Busy" ? "bg-red-500" :
                        u.status === "Away" ? "bg-amber-500" : "bg-slate-550"
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-200 truncate">{u.fullName || u.username}</p>
                      <p className="text-[9px] text-slate-500 truncate">{u.designation}</p>
                    </div>

                    {unread > 0 && (
                      <span className="bg-cyan-500 text-slate-950 font-extrabold text-[9px] px-2 py-0.5 rounded-full shrink-0">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* Right Active pane */}
        <div className={`flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative ${activeColleague ? "flex" : "hidden sm:flex"}`}>
          <ErrorBoundary>
            {activeColleague ? (
            <>
              {/* Header */}
              <div className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveColleague(null)}
                    className="sm:hidden p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition mr-1 cursor-pointer flex items-center justify-center shrink-0"
                    title="Back to list"
                  >
                    <IoArrowBack size={16} />
                  </button>

                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-cyan-400 text-sm border border-slate-700/60 uppercase">
                    {isGroupChat ? "#" : (activeColleague.fullName ? activeColleague.fullName.substring(0, 2) : activeColleague.username.substring(0, 2))}
                  </div>
                  <div>
                    <h2 
                      onClick={() => !isGroupChat && setDrawerOpen(true)}
                      className={`font-bold text-sm text-slate-200 flex items-center gap-1.5 ${!isGroupChat ? "hover:underline cursor-pointer" : ""}`}
                    >
                      {isGroupChat ? activeColleague.name : (activeColleague.fullName || activeColleague.username)}
                    </h2>
                    
                    <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      {isGroupChat ? (
                        <span>{activeColleague.members?.length || 0} Members • {getGroupOnlineCount()} Online • {activeColleague.description || "Channel Chat"}</span>
                      ) : (
                        <>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            activeColleague.status === "Online" ? "bg-green-500 animate-pulse" :
                            activeColleague.status === "Busy" ? "bg-red-500" :
                            activeColleague.status === "Away" ? "bg-amber-500" : "bg-slate-500"
                          }`} />
                          {activeColleague.status || "Offline"} • {
                            activeColleague.lastSeen 
                              ? `Active seen ${formatTime(activeColleague.lastSeen)}` 
                              : "Recently active"
                          }
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Pin panel toggle for Groups */}
                  {isGroupChat && (
                    <button
                      onClick={() => setPinnedPanelOpen(!pinnedPanelOpen)}
                      className={`p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition ${
                        pinnedPanelOpen ? "bg-slate-850 text-amber-400" : ""
                      }`}
                      title="View pinned messages"
                    >
                      <IoPinOutline size={18} />
                    </button>
                  )}

                  <button
                    onClick={() => setStarredPanelOpen(!starredPanelOpen)}
                    className={`p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition ${
                      starredPanelOpen ? "bg-slate-850 text-yellow-400" : ""
                    }`}
                    title="View starred messages"
                  >
                    <IoStar size={18} />
                  </button>

                  <button
                    onClick={() => setChatSearchOpen(!chatSearchOpen)}
                    className={`p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition ${
                      chatSearchOpen ? "bg-slate-855 text-cyan-400" : ""
                    }`}
                    title="Search messages"
                  >
                    <IoSearch size={18} />
                  </button>

                  {isGroupChat && (
                    <button
                      onClick={handleLeaveGroup}
                      className="bg-red-955/35 hover:bg-red-900/30 text-red-400 border border-red-900/30 text-xs px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer"
                    >
                      Leave Group
                    </button>
                  )}

                  {!isGroupChat && (
                    <button
                      onClick={() => setDrawerOpen(true)}
                      className="bg-slate-800 hover:bg-slate-750 text-xs px-3.5 py-1.5 rounded-lg font-bold text-slate-350 transition cursor-pointer"
                    >
                      Profile
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Panel Thread area */}
              <div 
                className="flex-1 flex overflow-hidden relative"
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                
                {/* Drag zone overlay */}
                <AnimatePresence>
                  {isDragging && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm border-2 border-dashed border-cyan-500/50 m-4 rounded-2xl flex flex-col items-center justify-center gap-3 z-30"
                    >
                      <IoCloudUploadOutline className="text-cyan-400 animate-bounce" size={48} />
                      <p className="text-sm font-bold text-slate-200">Drop files to attach</p>
                      <p className="text-xs text-slate-500">Images, PDFs, spreadsheets, Word or ZIP documents</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Conversation Scroller */}
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6" onScroll={handleScroll}>
                    
                    {loadingMessages ? (
                      <div className="space-y-4">
                        {[1, 2].map((n) => (
                          <div key={n} className="h-10 bg-slate-900 rounded animate-pulse w-48" />
                        ))}
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-655 flex-col gap-2">
                        <p className="text-xs font-semibold">Secure conversation portal.</p>
                      </div>
                    ) : (
                      Object.keys(groupedMessages).map((dateHeader) => (
                        <div key={dateHeader} className="space-y-4">
                          
                          {/* Date Separator */}
                          <div className="flex items-center gap-4 my-4">
                            <div className="flex-1 h-px bg-slate-800/60" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                              {dateHeader}
                            </span>
                            <div className="flex-1 h-px bg-slate-800/60" />
                          </div>

                          {groupedMessages[dateHeader].map((msg) => {
                            const isMe = msg.sender === sender;
                            const hasReply = msg.replyTo;
                            const isFile = msg.messageType === "file";
                            const isMsgUnreadLine = msg._id === firstUnreadId;
                            const isPinned = groupMetadata?.pinnedMessages?.includes(msg._id);

                            // Decrypt text client-side if it is a private message (not group message)
                            const displayText = msg.groupId ? msg.text : decryptText(msg.text);
                            const isEncrypted = !msg.groupId && msg.text?.startsWith("[E2EE-SECURE] ");

                            return (
                              <div key={msg._id} className="space-y-2 animate-fade-in">
                                
                                {/* Unread separator line */}
                                {isMsgUnreadLine && (
                                  <div className="flex items-center gap-4 my-6">
                                    <div className="flex-1 h-px bg-red-500/30" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/20 px-3 py-1 rounded-full border border-red-900/30">
                                      New Messages
                                    </span>
                                    <div className="flex-1 h-px bg-red-500/30" />
                                  </div>
                                )}

                                <div className={`flex gap-3 group relative ${isMe ? "justify-end" : "justify-start"}`}>
                                  
                                  {!isMe && (
                                    <div className="w-8 h-8 rounded-lg bg-slate-850 flex items-center justify-center font-bold text-slate-350 text-[10px] uppercase border border-slate-700/60 self-end">
                                      {msg.sender.substring(0, 2)}
                                    </div>
                                  )}

                                  <div className="flex flex-col max-w-[65%] gap-1">
                                    
                                    {/* Action dropdown hover panel */}
                                    <div className={`absolute top-0 opacity-0 group-hover:opacity-100 flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1.5 shadow-lg z-20 gap-1.5 transition ${
                                      isMe ? "-left-36" : "-right-36"
                                    }`}>
                                      <button
                                        onClick={() => setReplyingTo(msg)}
                                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                                        title="Reply"
                                      >
                                        <IoArrowUndo size={13} />
                                      </button>

                                      <button
                                        onClick={() => handleSelectForwardTarget(msg)}
                                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                                        title="Forward"
                                      >
                                        <IoArrowRedoOutline size={13} />
                                      </button>
                                      
                                      {isGroupChat && (
                                        <button
                                          onClick={() => handlePinToggle(msg)}
                                          className={`p-1 hover:bg-slate-800 rounded ${
                                            isPinned ? "text-amber-400" : "text-slate-400 hover:text-white"
                                          }`}
                                          title={isPinned ? "Unpin message" : "Pin message"}
                                        >
                                          <IoPinOutline size={13} />
                                        </button>
                                      )}

                                      <button
                                        onClick={() => handleToggleStar(msg._id)}
                                        className={`p-1 hover:bg-slate-800 rounded ${
                                          starredMessages.includes(msg._id) ? "text-yellow-400" : "text-slate-400 hover:text-white"
                                        }`}
                                        title={starredMessages.includes(msg._id) ? "Unstar message" : "Star message"}
                                      >
                                        <IoStarOutline size={13} />
                                      </button>

                                      {isMe && !msg.deletedForEveryone && (
                                        <button
                                          onClick={() => {
                                            setEditingMessageId(msg._id);
                                            setEditInputText(displayText);
                                          }}
                                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                                          title="Edit message"
                                        >
                                          <IoPencilOutline size={13} />
                                        </button>
                                      )}

                                      <button
                                        onClick={() => handleDeleteForMe(msg._id)}
                                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                                        title="Delete for me"
                                      >
                                        <IoTrash size={13} />
                                      </button>
                                      
                                      {isMe && !msg.deletedForEveryone && (
                                        <button
                                          onClick={() => handleDeleteForEveryone(msg._id)}
                                          className="p-1 hover:bg-slate-800 text-red-400 hover:text-red-300 rounded"
                                          title="Delete for everyone"
                                        >
                                          <IoTrash size={13} />
                                        </button>
                                      )}
                                    </div>

                                    {/* Bubble box */}
                                    <div className={`p-3.5 rounded-2xl text-xs relative border transition ${
                                      isMe 
                                        ? "bg-gradient-to-br from-cyan-600/30 to-cyan-700/10 border-cyan-800/40 text-slate-100 rounded-br-none" 
                                        : (!isMe && isGroupChat && displayText && displayText.includes(`@${sender}`))
                                          ? "bg-amber-955/20 border-amber-600/40 text-amber-200 rounded-bl-none shadow-sm shadow-amber-950/20"
                                          : "bg-slate-900 border-slate-800/80 text-slate-200 rounded-bl-none"
                                    } ${msg.deletedForEveryone ? "italic text-slate-500 border-slate-900" : ""} ${
                                      isPinned ? "border-amber-600/40 shadow-sm shadow-amber-950/20" : ""
                                    }`}>
                                      
                                      {/* Pinned visual dot tag */}
                                      {isPinned && (
                                        <div className="flex items-center gap-1 text-[8px] font-bold text-amber-400 uppercase tracking-widest mb-1.5">
                                          <IoPin size={9} />
                                          <span>Pinned Message</span>
                                        </div>
                                      )}

                                      {/* Quoted replies */}
                                      {hasReply && !msg.deletedForEveryone && (
                                        <div className="bg-black/20 border-l-2 border-cyan-400 p-2.5 rounded-lg mb-2 text-[10px] opacity-80 max-w-sm">
                                          <p className="font-bold text-[9px] text-cyan-200">Ref: {msg.replyTo.sender}</p>
                                          <p className="truncate mt-0.5">{
                                            msg.replyTo.deletedForEveryone 
                                              ? "This message was deleted" 
                                              : (msg.replyTo.groupId ? msg.replyTo.text : decryptText(msg.replyTo.text))
                                          }</p>
                                        </div>
                                      )}

                                      {/* Attachment File markup */}
                                      {isFile && !msg.deletedForEveryone && (
                                        <div className="mb-2">
                                          {msg.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                                            <div className="relative rounded-xl overflow-hidden border border-slate-800 max-w-xs cursor-zoom-in group/img">
                                              <img 
                                                src={msg.fileUrl} 
                                                alt={msg.fileName} 
                                                className="object-cover max-h-40 w-full group-hover/img:scale-102 transition duration-200"
                                                onClick={() => setLightboxSrc(msg.fileUrl)}
                                              />
                                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition">
                                                <IoEyeOutline size={18} />
                                              </div>
                                            </div>
                                          ) : (
                                            <div 
                                              onClick={() => setDocPreviewFile({
                                                url: msg.fileUrl,
                                                name: msg.fileName.split("-").slice(1).join("-"),
                                                type: msg.fileName.split(".").pop().toUpperCase()
                                              })}
                                              className="flex items-center gap-3 p-3 bg-black/20 hover:bg-black/30 border border-slate-800 rounded-xl cursor-pointer max-w-xs transition"
                                            >
                                              <IoDocumentAttachOutline className="text-cyan-400" size={22} />
                                              <div className="flex-1 min-w-0">
                                                <p className="font-bold text-[11px] truncate text-slate-200">
                                                  {msg.fileName.split("-").slice(1).join("-")}
                                                </p>
                                                <p className="text-[9px] text-slate-500 uppercase font-semibold">
                                                  {msg.fileName.split(".").pop()} file
                                                </p>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Main Text Content / Edit Box */}
                                      {editingMessageId === msg._id ? (
                                        <div className="flex flex-col gap-2 mt-1">
                                          <input
                                            type="text"
                                            value={editInputText}
                                            onChange={(e) => setEditInputText(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-850 p-2 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500/50"
                                            onKeyDown={(e) => e.key === "Enter" && handleEditSubmit(msg._id)}
                                            autoFocus
                                          />
                                          <div className="flex justify-end gap-2 text-[10px]">
                                            <button 
                                              onClick={() => setEditingMessageId(null)}
                                              className="text-slate-500 hover:text-white"
                                            >
                                              Cancel
                                            </button>
                                            <button 
                                              onClick={() => handleEditSubmit(msg._id)}
                                              className="text-cyan-400 font-bold"
                                            >
                                              Save
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="whitespace-pre-wrap break-words">{displayText}</div>
                                      )}

                                      {/* Emoji reactions block */}
                                      {msg.reactions && msg.reactions.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2.5">
                                          {Object.entries(
                                            msg.reactions.reduce((acc, curr) => {
                                              acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
                                              return acc;
                                            }, {})
                                          ).map(([emoji, count]) => (
                                            <button
                                              key={emoji}
                                              onClick={() => handleToggleReaction(msg._id, emoji)}
                                              className="px-2 py-0.5 bg-black/30 border border-slate-800/40 rounded-full text-[10px] font-bold text-slate-350 hover:border-cyan-500/20 hover:text-white transition flex items-center gap-1"
                                            >
                                              <span>{emoji}</span>
                                              <span>{count}</span>
                                            </button>
                                          ))}
                                        </div>
                                      )}

                                      {/* Message Info footer */}
                                      <div className="flex items-center justify-end gap-1.5 mt-2 opacity-60 text-[9px] font-semibold text-slate-400">
                                        {isEncrypted && (
                                          <IoLockClosedOutline 
                                            className="text-green-400" 
                                            size={10.5} 
                                            title="End-to-End Encrypted (AES-256 Prototype)" 
                                          />
                                        )}
                                        {msg.isEdited && (
                                          <span className="italic text-[8px] text-slate-505 font-bold uppercase tracking-wider pr-1">Edited</span>
                                        )}
                                        <span>
                                          {formatTime(msg.createdAt)}
                                        </span>

                                        {msg.disappearAfter > 0 && !msg.deletedForEveryone && (
                                          <IoTimeOutline className="text-amber-500" size={10} title={`Expires in ${msg.disappearAfter}s`} />
                                        )}

                                        {isMe && !msg.deletedForEveryone && !isGroupChat && (
                                          <span>
                                            {msg.status === "read" ? (
                                              <IoCheckmarkDone className="text-cyan-400 font-bold" size={12} title="Read" />
                                            ) : msg.status === "delivered" ? (
                                              <IoCheckmarkDone className="text-slate-550" size={12} title="Delivered" />
                                            ) : (
                                              <IoCheckmark className="text-slate-550" size={12} title="Sent" />
                                            )}
                                          </span>
                                        )}
                                      </div>

                                      {/* Reactions Tray on hover */}
                                      {!msg.deletedForEveryone && (
                                        <div className="absolute -top-7 right-2 hidden group-hover:flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full shadow-lg z-25">
                                          {["👍", "❤️", "🔥", "👏", "😂", "🎉"].map((emoji) => (
                                            <button
                                              key={emoji}
                                              onClick={() => handleToggleReaction(msg._id, emoji)}
                                              className="hover:scale-130 transition px-1 text-[11px]"
                                            >
                                              {emoji}
                                            </button>
                                          ))}
                                        </div>
                                      )}

                                    </div>
                                  </div>

                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))
                    )}

                    {/* Private Typing dots */}
                    {colleagueTyping && !isGroupChat && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-850 flex items-center justify-center font-bold text-slate-350 text-[10px] uppercase">
                          {activeColleague.username.substring(0, 2)}
                        </div>
                        <div className="bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-2xl rounded-bl-none flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                          <span className="text-[10px] text-slate-500 font-semibold">{activeColleague.username} is typing...</span>
                        </div>
                      </div>
                    )}

                    {/* Group Typing labels */}
                    {isGroupChat && typingUsers.length > 0 && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 italic pl-10 font-medium">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span>{typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...</span>
                      </div>
                    )}

                    {/* Failed Messages Retry Render */}
                    {failedMessages
                      .filter((fm) => 
                        fm.groupId === (isGroupChat ? activeColleague?._id : null) && 
                        (isGroupChat || fm.receiver === activeColleague?.username)
                      )
                      .map((fm) => (
                        <div key={fm._id} className="flex gap-3 justify-end items-end animate-fade-in opacity-80 my-2">
                          <div className="flex flex-col max-w-[65%] gap-1">
                            <div className="p-3.5 rounded-2xl text-xs relative border border-red-900/40 bg-red-950/10 text-slate-300 rounded-br-none flex flex-col gap-2">
                              <p className="italic text-red-200">{fm.text}</p>
                              <div className="flex justify-between items-center text-[9px] text-red-400 font-bold gap-4">
                                <span>⚠️ Failed to send</span>
                                <button 
                                  onClick={() => handleRetryMessage(fm)}
                                  className="flex items-center gap-1 bg-red-900/30 hover:bg-red-900/50 px-2.5 py-1 rounded border border-red-800 transition uppercase tracking-wider cursor-pointer"
                                >
                                  <IoRefreshOutline size={10} />
                                  <span>Retry</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                    <div ref={bottomRef} />
                  </div>

                  {/* Input area */}
                  <div className="p-4 border-t border-slate-800 bg-slate-900/20 backdrop-blur-md">
                    
                    {/* Mentions Autocomplete suggestions */}
                    {isGroupChat && messageText.match(/@(\w*)$/) && (
                      <div className="bg-slate-950 border border-slate-855 rounded-t-xl p-2 space-y-1 max-h-40 overflow-y-auto mb-1">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2 py-1">Mention Group Members</p>
                        {(() => {
                          const match = messageText.match(/@(\w*)$/);
                          const query = match ? match[1].toLowerCase() : "";
                          const suggestions = (groupMetadata?.members || []).filter(
                            (username) => username !== sender && username.toLowerCase().includes(query)
                          );
                          if (suggestions.length === 0) {
                            return <p className="text-[10px] text-slate-600 italic px-2">No matching members</p>;
                          }
                          return suggestions.map((username) => (
                            <button
                              key={username}
                              onClick={() => {
                                const newText = messageText.replace(/@(\w*)$/, `@${username} `);
                                setMessageText(newText);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-850 text-slate-300 hover:text-white transition font-semibold"
                            >
                              @{username}
                            </button>
                          ));
                        })()}
                      </div>
                    )}

                    {/* Reply banner */}
                    {replyingTo && (
                      <div className="flex justify-between items-center bg-slate-950 border border-slate-855 rounded-t-xl px-4 py-2 text-[10px] border-b-0 animate-slide-up">
                        <div>
                          <span className="font-bold text-cyan-400">Replying to {replyingTo.sender}</span>
                          <span className="text-slate-400 block truncate max-w-lg mt-0.5">
                            {replyingTo.groupId ? replyingTo.text : decryptText(replyingTo.text)}
                          </span>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className="text-slate-550 hover:text-white">
                          <IoClose size={14} />
                        </button>
                      </div>
                    )}

                    {/* Attached file thumbnail */}
                    {attachedFile && (
                      <div className="flex justify-between items-center bg-slate-950 border border-slate-855 rounded-t-xl px-4 py-2.5 text-[10px] border-b-0">
                        <div className="flex items-center gap-2">
                          {attachedFile.type.startsWith("image/") ? (
                            <IoImageOutline className="text-cyan-400" size={16} />
                          ) : (
                            <IoDocumentAttachOutline className="text-cyan-400" size={16} />
                          )}
                          <span className="font-semibold text-slate-300 truncate max-w-[200px]">{attachedFile.name}</span>
                        </div>
                        <button onClick={() => setAttachedFile(null)} className="text-slate-550 hover:text-white">
                          <IoClose size={14} />
                        </button>
                      </div>
                    )}

                    {/* Progress uploading indicator */}
                    {isUploading && (
                      <div className="bg-slate-950 border border-slate-855 px-4 py-2 text-[9px] border-b-0 space-y-1 rounded-t-xl">
                        <div className="flex justify-between text-slate-500">
                          <span>Encrypting & uploading resource...</span>
                          <span className="font-bold text-cyan-400">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-cyan-400 h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Controls */}
                    <div className="flex items-center gap-3">
                      
                      <button
                        onClick={() => fileInputRef.current.click()}
                        className="p-3 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition shrink-0"
                        title="Upload file attachment"
                      >
                        <IoAttach size={20} />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {/* Emoji Selector */}
                      <div className="relative shrink-0">
                        <button
                          onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                          className={`p-3 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition ${
                            emojiPickerOpen ? "bg-slate-800 text-cyan-400" : ""
                          }`}
                          title="Emojis"
                        >
                          <IoHappyOutline size={20} />
                        </button>

                        <AnimatePresence>
                          {emojiPickerOpen && (
                            <motion.div
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: 20, opacity: 0 }}
                              className="absolute bottom-full left-0 mb-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-2xl z-30 w-64"
                            >
                              <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-855 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                <span>Emojis</span>
                                <button onClick={() => setEmojiPickerOpen(false)} className="hover:text-white">✕</button>
                              </div>
                              <div className="grid grid-cols-6 gap-2 text-lg">
                                {[
                                  "😊", "😂", "🥰", "😎", "🤔", "👍", 
                                  "🙌", "👏", "🔥", "🎉", "❤️", "💯", 
                                  "💻", "📝", "📎", "🔒", "🚨", "✅",
                                  "❌", "💬", "🚀", "💡", "📌", "🎈"
                                ].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => appendEmoji(emoji)}
                                    className="hover:scale-120 transition p-1 hover:bg-slate-855 rounded cursor-pointer"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Input field */}
                      <input
                        type="text"
                        placeholder={
                          isGroupChat 
                            ? `Broadcast message to group channel #${activeColleague.name}...`
                            : `Send encrypted DM to user ${activeColleague.username}... (E2EE Active)`
                        }
                        value={messageText}
                        onChange={handleMessageChange}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        className="flex-1 bg-slate-955 border border-slate-855 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 transition font-semibold"
                      />

                      {/* Self Destruct */}
                      <div className="relative shrink-0 group">
                        <button
                          className={`p-3 rounded-xl border flex items-center gap-1.5 text-[10px] font-bold transition ${
                            disappearAfter > 0 
                              ? "bg-amber-955/20 border-amber-600/40 text-amber-400 hover:bg-amber-900/30"
                              : "bg-slate-955 border-slate-855 text-slate-500 hover:border-slate-800 hover:text-white"
                          }`}
                        >
                          <IoTimeOutline size={16} />
                          <span>
                            {disappearAfter === 10 ? "10s" :
                             disappearAfter === 300 ? "5m" :
                             disappearAfter === 600 ? "10m" :
                             disappearAfter === 1800 ? "30m" : "Destruct Off"}
                          </span>
                        </button>
                        
                        <div className="absolute right-0 bottom-full mb-2 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 hidden group-hover:block hover:block z-30">
                          <p className="text-[9px] text-slate-505 font-bold p-2 uppercase tracking-wider">Self Destruct Message</p>
                          {[
                            { label: "10 Seconds", value: 10 },
                            { label: "5 Minutes", value: 300 },
                            { label: "10 Minutes", value: 600 },
                            { label: "30 Minutes", value: 1800 },
                            { label: "Until Removed", value: 0 }
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setDisappearAfter(opt.value)}
                              className={`w-full text-left p-2 rounded-lg text-xs font-semibold hover:bg-slate-800 transition ${
                                disappearAfter === opt.value ? "text-cyan-400 bg-cyan-950/15" : "text-slate-500"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() && !attachedFile}
                        className="p-3 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-bold rounded-xl transition shrink-0 cursor-pointer"
                      >
                        <IoSend size={16} />
                      </button>

                    </div>
                  </div>
                </div>

                {/* Message Search slider */}
                <AnimatePresence>
                  {chatSearchOpen && (
                    <motion.div
                      initial={{ x: 300, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 300, opacity: 0 }}
                      className="w-72 border-l border-slate-800 bg-slate-900/60 backdrop-blur-xl h-full flex flex-col shrink-0 z-20"
                    >
                      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="font-extrabold text-xs text-cyan-400 uppercase tracking-wider">Search Keywords</h3>
                        <button 
                          onClick={() => { setChatSearchOpen(false); setChatSearchQuery(""); setSearchResults([]); }}
                          className="p-1 hover:bg-slate-800 rounded text-slate-455 hover:text-white"
                        >
                          <IoClose size={18} />
                        </button>
                      </div>

                      <div className="p-4">
                        <div className="relative">
                          <IoSearch className="absolute left-3 top-2 text-slate-505" size={14} />
                          <input
                            type="text"
                            placeholder="Type keywords..."
                            value={chatSearchQuery}
                            onChange={handleChatSearch}
                            className="w-full bg-slate-955 border border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:border-cyan-500/50 text-white"
                          />
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                        {searchResults.map((res) => {
                          const displayResText = res.groupId ? res.text : decryptText(res.text);
                          return (
                            <div
                              key={res._id}
                              onClick={() => {
                                const index = messages.findIndex((m) => m._id === res._id);
                                if (index !== -1) {
                                  const els = document.getElementsByClassName("group relative");
                                  els[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
                                }
                              }}
                              className="p-3 bg-slate-955 border border-slate-855 hover:border-cyan-500/30 rounded-xl cursor-pointer transition text-left"
                            >
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="text-[9px] font-bold text-cyan-400">{res.sender}</span>
                                <span className="text-[8px] text-slate-550">{formatDate(res.createdAt)}</span>
                              </div>
                              <p className="text-xs text-slate-350 line-clamp-2">{displayResText}</p>
                            </div>
                          );
                        })}

                        {chatSearchQuery.trim() && searchResults.length === 0 && (
                          <p className="text-center text-[10px] text-slate-500 pt-6">No matching keywords logs.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pinned Messages panel (Groups only) */}
                <AnimatePresence>
                  {isGroupChat && pinnedPanelOpen && (
                    <motion.div
                      initial={{ x: 300, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 300, opacity: 0 }}
                      className="w-80 border-l border-slate-800 bg-slate-900/60 backdrop-blur-xl h-full flex flex-col shrink-0 z-20"
                    >
                      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="font-extrabold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <IoPin size={12} />
                          <span>Pinned Board</span>
                        </h3>
                        <button 
                          onClick={() => setPinnedPanelOpen(false)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-455 hover:text-white"
                        >
                          <IoClose size={18} />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.filter((m) => groupMetadata?.pinnedMessages?.includes(m._id)).map((pinMsg) => (
                          <div 
                            key={pinMsg._id}
                            onClick={() => {
                              const idx = messages.findIndex((m) => m._id === pinMsg._id);
                              if (idx !== -1) {
                                const els = document.getElementsByClassName("group relative");
                                els[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
                              }
                            }}
                            className="bg-slate-955 border border-slate-855 hover:border-amber-500/20 p-3 rounded-xl cursor-pointer transition text-left relative group/pin"
                          >
                            <div className="flex justify-between items-center mb-1 text-[9px]">
                              <span className="font-bold text-slate-200">{pinMsg.sender}</span>
                              <span className="text-slate-505">{formatTime(pinMsg.createdAt)}</span>
                            </div>
                            <p className="text-xs text-slate-350 line-clamp-3">{pinMsg.text}</p>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePinToggle(pinMsg);
                              }}
                              className="absolute top-2 right-2 opacity-0 group-hover/pin:opacity-100 p-1 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded transition"
                              title="Unpin message"
                            >
                              <IoClose size={12} />
                            </button>
                          </div>
                        ))}

                        {(!groupMetadata?.pinnedMessages || groupMetadata.pinnedMessages.length === 0) && (
                          <p className="text-center text-slate-505 text-xs py-10">No messages pinned to this channel.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Starred Messages Panel */}
                <AnimatePresence>
                  {starredPanelOpen && (
                    <motion.div
                      initial={{ x: 300, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 300, opacity: 0 }}
                      className="w-80 border-l border-slate-800 bg-slate-900/60 backdrop-blur-xl h-full flex flex-col shrink-0 z-20"
                    >
                      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="font-extrabold text-xs text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                          <IoStar size={12} />
                          <span>Starred Messages</span>
                        </h3>
                        <button 
                          onClick={() => setStarredPanelOpen(false)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-455 hover:text-white"
                        >
                          <IoClose size={18} />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.filter((m) => starredMessages.includes(m._id)).map((starMsg) => {
                          const displayStarText = starMsg.groupId ? starMsg.text : decryptText(starMsg.text);
                          return (
                            <div 
                              key={starMsg._id}
                              onClick={() => {
                                const idx = messages.findIndex((m) => m._id === starMsg._id);
                                if (idx !== -1) {
                                  const els = document.getElementsByClassName("group relative");
                                  els[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
                                }
                              }}
                              className="bg-slate-955 border border-slate-855 hover:border-yellow-500/20 p-3 rounded-xl cursor-pointer transition text-left relative group/star"
                            >
                              <div className="flex justify-between items-center mb-1 text-[9px]">
                                <span className="font-bold text-slate-200">{starMsg.sender}</span>
                                <span className="text-slate-505">{formatTime(starMsg.createdAt)}</span>
                              </div>
                              <p className="text-xs text-slate-350 line-clamp-3">{displayStarText}</p>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStar(starMsg._id);
                                }}
                                className="absolute top-2 right-2 opacity-0 group-hover/star:opacity-100 p-1 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded transition"
                                title="Unstar message"
                              >
                                <IoClose size={12} />
                              </button>
                            </div>
                          );
                        })}

                        {messages.filter((m) => starredMessages.includes(m._id)).length === 0 && (
                          <p className="text-center text-slate-505 text-xs py-10">No starred messages in this thread.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

              {/* Colleague Details */}
              <ProfileDrawer
                user={activeColleague}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
              />
            </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 flex-col gap-4 text-center p-8 bg-slate-950 h-full">
                <span className="text-4xl text-cyan-400">💬</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-350">Select a conversation</h3>
                </div>
              </div>
            )}
          </ErrorBoundary>

        </div>

      </div>

      {/* 3. Image Lightbox Zoom Viewer */}
      {lightboxSrc && (
        <ImageViewer 
          src={lightboxSrc} 
          images={conversationImages}
          onClose={() => setLightboxSrc(null)} 
        />
      )}

      {/* 4. PDF Document Preview Modal */}
      {docPreviewFile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-6 relative">
            <button 
              onClick={() => setDocPreviewFile(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition"
            >
              <IoClose size={18} />
            </button>
            
            <div className="text-center space-y-4 py-4">
              <IoDocumentTextOutline className="text-cyan-400 mx-auto animate-pulse" size={48} />
              <div>
                <h3 className="font-extrabold text-sm text-slate-200 truncate px-4">{docPreviewFile.name}</h3>
                <p className="text-[10px] text-slate-505 font-bold uppercase tracking-wider mt-1">{docPreviewFile.type} DOCUMENT</p>
              </div>
              
              <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-850/50 text-left text-[11px] text-slate-400 space-y-1.5">
                <p><span className="font-bold text-slate-500">File URL:</span> <a href={docPreviewFile.url} className="text-cyan-400 hover:underline break-all" target="_blank" rel="noreferrer">{docPreviewFile.url}</a></p>
                <p><span className="font-bold text-slate-500">Storage Tier:</span> Secure Encrypted Drive</p>
                <p><span className="font-bold text-slate-500">Availability:</span> Download Authorized</p>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  onClick={() => setDocPreviewFile(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-xs font-semibold py-2.5 rounded-xl transition text-slate-350"
                >
                  Close Preview
                </button>
                <a 
                  href={docPreviewFile.url} 
                  download
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <span>Download Resource</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Message Forwarding Target Selection Modal */}
      {forwardTargetModal && forwardingMsg && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-6 relative animate-slide-up">
            <button 
              onClick={() => { setForwardTargetModal(false); setForwardingMsg(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="font-extrabold text-sm text-slate-200 flex items-center gap-2 mb-4">
              <IoArrowRedo className="text-cyan-400" />
              Forward Message
            </h3>
            
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Select Destination Channel</p>
            <div className="bg-slate-950 border border-slate-855 rounded-xl max-h-60 overflow-y-auto p-1.5 divide-y divide-slate-850/50">
              
              {/* Groups forwarding targets */}
              {groups.map((g) => (
                <button
                  key={g._id}
                  onClick={() => handleForwardMessage(g)}
                  className="w-full text-left p-2.5 hover:bg-slate-900/60 transition text-xs text-slate-200 font-bold flex items-center gap-2"
                >
                  <span className="text-cyan-400">#</span>
                  <span className="truncate">{g.name}</span>
                </button>
              ))}

              {/* Colleagues forwarding targets */}
              {users.map((u) => (
                <button
                  key={u._id}
                  onClick={() => handleForwardMessage(u)}
                  className="w-full text-left p-2.5 hover:bg-slate-900/60 transition text-xs text-slate-200 font-bold flex items-center gap-2"
                >
                  <span className="text-indigo-400">👤</span>
                  <span className="truncate">{u.fullName || u.username}</span>
                </button>
              ))}

            </div>

            <div className="pt-4">
              <button
                onClick={() => { setForwardTargetModal(false); setForwardingMsg(null); }}
                className="w-full bg-slate-800 hover:bg-slate-750 text-xs font-bold py-2.5 rounded-xl transition text-slate-350"
              >
                Cancel Forward
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}