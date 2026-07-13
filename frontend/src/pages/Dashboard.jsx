import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../components/dashboard/Sidebar";
import Navbar from "../components/dashboard/Navbar";
import { 
  IoChatbubblesOutline, 
  IoNotificationsOutline, 
  IoFolderOutline, 
  IoPeopleOutline,
  IoCalendarOutline,
  IoMegaphoneOutline,
  IoPinOutline,
  IoGridOutline,
  IoNewspaperOutline,
  IoSpeedometerOutline,
  IoFlashOutline
} from "react-icons/io5";
import { getUsers } from "../services/userService";
import socket from "../hooks/useSocket";
import { useTime } from "../context/TimeContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const loggedUser = JSON.parse(localStorage.getItem("user"));
  const { formatTime, formatDate, getWorkspaceTime } = useTime();

  // Widget States
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeBroadcasts, setActiveBroadcasts] = useState([]);
  const [recentDMs, setRecentDMs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [workspaceActivity, setWorkspaceActivity] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(false);

  useEffect(() => {
    if (!loggedUser) {
      navigate("/");
      return;
    }

    loadAllDashboardData();

    socket.on("status-updated", () => {
      loadOnlineUsers();
    });

    socket.on("receive-broadcast", (bc) => {
      setActiveBroadcasts((prev) => [bc, ...prev].slice(0, 10));
      toast(`Announcement: "${bc.text}"`, {
        icon: "📢",
        style: {
          background: "#151C2C",
          color: "#E2E8F0",
          border: "1px solid #222F47"
        }
      });
      loadWorkspaceActivity();
    });

    socket.on("private-message", () => {
      loadRecentDMs();
      loadUnreadNotifications();
      loadWorkspaceActivity();
    });

    socket.on("group-message", () => {
      loadWorkspaceActivity();
    });

    // Handle group creation auto refresh
    socket.on("group-created", (group) => {
      loadGroups();
      loadWorkspaceActivity();
      toast(`New group created: #${group.name}`, { icon: "📁" });
    });

    socket.on("group-updated", () => {
      loadGroups();
    });

    socket.on("group-deleted", () => {
      loadGroups();
    });

    return () => {
      socket.off("status-updated");
      socket.off("receive-broadcast");
      socket.off("private-message");
      socket.off("group-message");
      socket.off("group-created");
      socket.off("group-updated");
      socket.off("group-deleted");
    };
  }, []);

  const loadAllDashboardData = async () => {
    setLoading(true);
    setErrorState(false);
    try {
      await Promise.all([
        loadOnlineUsers(),
        loadGroups(),
        loadActiveBroadcasts(),
        loadRecentDMs(),
        loadUnreadNotifications(),
        loadWorkspaceActivity()
      ]);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setErrorState(true);
      setLoading(false);
    }
  };

  const loadOnlineUsers = async () => {
    const data = await getUsers();
    setUsers(data.filter((u) => !u.isSuspended));
  };

  const loadGroups = async () => {
    const res = await axios.get(
      `${window.API_BASE_URL}/chat/groups/list?username=${loggedUser.username}`
    );
    setGroups(res.data);
  };

  const loadActiveBroadcasts = async () => {
    const res = await axios.get(window.API_BASE_URL + "/chat/broadcasts/active");
    setActiveBroadcasts(res.data.slice(0, 5));
  };

  const loadRecentDMs = async () => {
    const res = await axios.get(
      `${window.API_BASE_URL}/chat/widgets/recent-dms?username=${loggedUser.username}`
    );
    setRecentDMs(res.data.slice(0, 5));
  };

  const loadUnreadNotifications = async () => {
    const res = await axios.get(
      `${window.API_BASE_URL}/chat/widgets/unread-notifications?username=${loggedUser.username}`
    );
    setNotifications(res.data.slice(0, 5));
  };

  const loadWorkspaceActivity = async () => {
    const res = await axios.get(window.API_BASE_URL + "/chat/widgets/workspace-activity");
    setWorkspaceActivity(res.data.slice(0, 6));
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-955 items-center justify-center text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-bold">Synchronizing telemetry...</p>
        </div>
      </div>
    );
  }

  if (errorState) {
    return (
      <div className="flex h-screen bg-slate-955 items-center justify-center text-slate-100 p-8 text-center">
        <div className="max-w-md space-y-4">
          <h2 className="text-sm font-bold text-red-400">Failed to establish dashboard database connection</h2>
          <p className="text-xs text-slate-500">The corporate telemetry node could not retrieve system records.</p>
          <button 
            onClick={loadAllDashboardData}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold rounded-xl text-slate-350 transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const onlineEmployees = users.filter((u) => u.username !== loggedUser?.username && (u.status === "Online" || u.status === "Away" || u.status === "Busy"));
  const totalEmployeesCount = users.length;
  const totalGroupsCount = groups.length;

  // Group departments dynamically
  const departmentCounts = {};
  users.forEach((u) => {
    const dept = u.department || "General";
    departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
  });

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100 font-sans">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <Sidebar />

      {/* Main content frame */}
      <div className="flex-1 flex flex-col h-full p-6 overflow-hidden pt-14 md:pt-6 pb-16 md:pb-6">
        
        {/* Top Navbar */}
        <Navbar />

        {/* Scrollable Dashboard Grid */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          
          {/* Welcome status header bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800/80 p-6 rounded-2xl">
            <div>
              <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
                Workspace Monitor
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Real-time communications monitor for {loggedUser?.fullName || loggedUser?.username}.
              </p>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-widest bg-cyan-950/30 px-3 py-1 rounded-full border border-cyan-900/30">
                Today: {formatDate(getWorkspaceTime())}
              </span>
            </div>
          </div>

          {/* ==================================================== */}
          {/* STATS ROW (Total Employees, Online, Groups, Unread) */}
          {/* ==================================================== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Stat 1: Employees Online */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-950/30 text-green-400 border border-green-900/30 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employees Online</p>
                <h4 className="text-lg font-black text-slate-200 mt-0.5">{onlineEmployees.length} Online</h4>
              </div>
            </div>

            {/* Stat 2: Total Employees */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/30 text-cyan-400 border border-cyan-900/30 flex items-center justify-center shrink-0">
                <IoPeopleOutline size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Employees</p>
                <h4 className="text-lg font-black text-slate-200 mt-0.5">{totalEmployeesCount} Users</h4>
              </div>
            </div>

            {/* Stat 3: Total Groups */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-950/30 text-indigo-400 border border-indigo-900/30 flex items-center justify-center shrink-0">
                <IoFolderOutline size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Groups</p>
                <h4 className="text-lg font-black text-slate-200 mt-0.5">{totalGroupsCount} Groups</h4>
              </div>
            </div>

            {/* Stat 4: Unread Messages */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-950/30 text-red-400 border border-red-900/30 flex items-center justify-center shrink-0">
                <IoNotificationsOutline size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unread Alerts</p>
                <h4 className="text-lg font-black text-slate-200 mt-0.5">{notifications.length} Unread</h4>
              </div>
            </div>

          </div>

          {/* ==================================================== */}
          {/* LOWER GRID LAYOUT */}
          {/* ==================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN: Announcements & Recent Chats */}
            <div className="space-y-6">
              
              {/* Recent Announcements */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-355 flex items-center gap-2 mb-3">
                  <IoMegaphoneOutline className="text-cyan-400" size={16} />
                  <span>Recent Announcements</span>
                </h3>
                <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
                  {activeBroadcasts.map((bc) => (
                    <div key={bc._id} className="border-l-2 border-cyan-400 pl-3 py-1 text-xs">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mb-0.5">
                        <span className="font-bold text-slate-300">📢 {bc.sender}</span>
                        <span>{formatTime(bc.scheduledAt)}</span>
                      </div>
                      <p className="text-slate-400 line-clamp-2 leading-relaxed">{bc.text}</p>
                    </div>
                  ))}
                  {activeBroadcasts.length === 0 && (
                    <p className="text-xs text-slate-500 italic py-3 text-center">No recent activity</p>
                  )}
                </div>
              </div>

              {/* Recent Chats */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-355 flex items-center gap-2 mb-3">
                  <IoChatbubblesOutline className="text-cyan-400" size={16} />
                  <span>Recent Chats</span>
                </h3>
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {recentDMs.map((dm, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigate("/chat")}
                      className="p-2.5 bg-slate-950/40 hover:bg-slate-850 rounded-xl border border-slate-855 transition cursor-pointer flex justify-between items-center"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold text-slate-200 truncate">@{dm.partner}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">{dm.content}</p>
                      </div>
                      <span className="text-[9px] text-slate-500 font-semibold shrink-0">
                        {formatTime(dm.createdAt)}
                      </span>
                    </div>
                  ))}
                  {recentDMs.length === 0 && (
                    <p className="text-xs text-slate-500 italic py-3 text-center">No recent activity</p>
                  )}
                </div>
              </div>

            </div>

            {/* CENTER COLUMN: Recent Activity & Departments */}
            <div className="space-y-6">
              
              {/* Recent Activity */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-355 flex items-center gap-2 mb-3">
                  <IoNewspaperOutline className="text-cyan-400" size={16} />
                  <span>Recent Activity</span>
                </h3>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {workspaceActivity.map((log) => (
                    <div key={log._id} className="flex justify-between items-baseline text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-300 font-medium truncate">{log.text}</p>
                      </div>
                      <span className="text-[8px] text-slate-505 shrink-0 pl-1">
                        {formatTime(log.createdAt)}
                      </span>
                    </div>
                  ))}
                  {workspaceActivity.length === 0 && (
                    <p className="text-xs text-slate-500 italic py-3 text-center">No recent activity</p>
                  )}
                </div>
              </div>

              {/* Departments distribution */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-355 flex items-center gap-2 mb-3">
                  <IoGridOutline className="text-cyan-400" size={16} />
                  <span>Teammate Departments</span>
                </h3>
                <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {Object.keys(departmentCounts).map((dept, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{dept}</p>
                      <h4 className="text-base font-black text-slate-200 mt-1">{departmentCounts[dept]} {departmentCounts[dept] === 1 ? "member" : "members"}</h4>
                    </div>
                  ))}
                  {Object.keys(departmentCounts).length === 0 && (
                    <p className="text-xs text-slate-500 italic py-3 text-center">No recent activity</p>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Employees Online & Quick Actions */}
            <div className="space-y-6">
              
              {/* Online Employees list */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-355 flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span>Teammates Online ({onlineEmployees.length})</span>
                </h3>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {onlineEmployees.map((emp) => (
                    <div
                      key={emp._id}
                      onClick={() => navigate("/chat", { state: { user: emp } })}
                      className="flex items-center justify-between cursor-pointer hover:bg-slate-850/50 p-1.5 rounded-lg transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center font-bold text-slate-350 text-[10px] uppercase">
                          {emp.username.substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{emp.fullName || emp.username}</p>
                        </div>
                      </div>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        emp.status === "Online" ? "bg-green-500" :
                        emp.status === "Busy" ? "bg-red-500" : "bg-amber-500"
                      }`} />
                    </div>
                  ))}
                  {onlineEmployees.length === 0 && (
                    <p className="text-xs text-slate-500 italic py-3 text-center">No recent activity</p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-355 flex items-center gap-2 mb-3">
                  <IoFlashOutline className="text-cyan-400" size={16} />
                  <span>Quick Actions</span>
                </h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => navigate("/chat")}
                    className="w-full text-left p-2.5 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs text-slate-250 font-bold transition flex items-center gap-2"
                  >
                    💬 Open Chat Console
                  </button>
                  <button 
                    onClick={() => navigate("/users")}
                    className="w-full text-left p-2.5 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs text-slate-250 font-bold transition flex items-center gap-2"
                  >
                    👥 Teammates Directory
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}