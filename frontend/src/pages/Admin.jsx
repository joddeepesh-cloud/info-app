import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/dashboard/Sidebar";
import Navbar from "../components/dashboard/Navbar";
import { 
  IoAlertCircleOutline, 
  IoPersonAddOutline, 
  IoTrashOutline, 
  IoKeyOutline, 
  IoCreateOutline,
  IoPeopleOutline,
  IoMegaphoneOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoDocumentAttachOutline,
  IoBanOutline,
  IoCheckmarkCircle,
  IoDownloadOutline,
  IoNewspaperOutline,
  IoWarningOutline
} from "react-icons/io5";
import socket from "../hooks/useSocket";
import { useTime } from "../context/TimeContext";

export default function Admin() {
  const navigate = useNavigate();
  const loggedUser = JSON.parse(localStorage.getItem("user"));
  const isAdmin = loggedUser?.role === "admin";
  const { formatTime, formatDate, getWorkspaceTime } = useTime();

  // Tab State: "employees" | "groups" | "broadcasts"
  const [activeTab, setActiveTab] = useState("employees");

  // General Lists
  const [employees, setEmployees] = useState([]);
  const [groups, setGroups] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Employee Form State
  const [empUsername, setEmpUsername] = useState("");
  const [empPassword, setEmpPassword] = useState("");
  const [empFullName, setEmpFullName] = useState("");
  const [empDesignation, setEmpDesignation] = useState("Software Engineer");
  const [empDepartment, setEmpDepartment] = useState("Development");
  const [empEmail, setEmpEmail] = useState("");
  const [empPhone, setEmpPhone] = useState("");
  const [empBio, setEmpBio] = useState("");
  const [empRole, setEmpRole] = useState("employee");
  const [editingEmpId, setEditingEmpId] = useState(null);
  
  // Password Reset Modal State
  const [resettingEmp, setResettingEmp] = useState(null); // User object
  const [newPassword, setNewPassword] = useState("");

  // Filters & Search states
  const [empSearchQuery, setEmpSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("All");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");
  const [currentEmpPage, setCurrentEmpPage] = useState(1);
  const itemsPerPage = 8;

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      emp.username.toLowerCase().includes(empSearchQuery.toLowerCase()) ||
      (emp.fullName && emp.fullName.toLowerCase().includes(empSearchQuery.toLowerCase())) ||
      (emp.designation && emp.designation.toLowerCase().includes(empSearchQuery.toLowerCase()));

    const matchesDept = selectedDeptFilter === "All" || emp.department === selectedDeptFilter;
    const matchesRole = selectedRoleFilter === "All" || emp.role === selectedRoleFilter;
    const matchesStatus = 
      selectedStatusFilter === "All" || 
      (selectedStatusFilter === "Suspended" && emp.isSuspended) ||
      (selectedStatusFilter === "Active" && !emp.isSuspended);

    return matchesSearch && matchesDept && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentEmpPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  // Group Form State
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [groupMembers, setGroupMembers] = useState([]); // Array of usernames
  const [editingGroupId, setEditingGroupId] = useState(null);

  // Broadcast Form State
  const [bcText, setBcText] = useState("");
  const [bcFile, setBcFile] = useState(null); // { name, base64, type }
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);

  // Audit Logs Initialization
  useEffect(() => {
    const storedLogs = localStorage.getItem("auditLogs");
    if (storedLogs) {
      setAuditLogs(JSON.parse(storedLogs));
    } else {
      const initial = [
        { id: 1, action: "Admin initialized communications node", timestamp: `${formatDate(Date.now() - 3600000)} ${formatTime(Date.now() - 3600000)}` },
        { id: 2, action: "Admin verified E2EE encryption key tiers", timestamp: `${formatDate(Date.now() - 1800000)} ${formatTime(Date.now() - 1800000)}` }
      ];
      setAuditLogs(initial);
      localStorage.setItem("auditLogs", JSON.stringify(initial));
    }
  }, []);

  const logAuditAction = (msg) => {
    const newLog = {
      id: Date.now(),
      action: msg,
      timestamp: `${formatDate(new Date())} ${formatTime(new Date())}`
    };
    setAuditLogs((prev) => {
      const updated = [newLog, ...prev];
      localStorage.setItem("auditLogs", JSON.stringify(updated));
      return updated;
    });
  };

  // Initial Load
  useEffect(() => {
    if (isAdmin) {
      loadEmployees();
      loadGroups();
      loadBroadcasts();
    }
  }, [isAdmin]);

  const loadEmployees = async () => {
    try {
      const res = await axios.get(window.API_BASE_URL + "/users");
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadGroups = async () => {
    try {
      const res = await axios.get(`${window.API_BASE_URL}/chat/groups/list?username=${loggedUser.username}`);
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBroadcasts = async () => {
    try {
      const res = await axios.get(window.API_BASE_URL + "/chat/broadcasts/all");
      setBroadcasts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // CSV Export Action
  const handleExportCSV = () => {
    if (employees.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Username,Full Name,Email,Phone,Department,Designation,Role,Status,Suspended\n";
    
    employees.forEach((emp) => {
      const row = [
        emp.username,
        emp.fullName || "",
        emp.email || "",
        emp.phone || "",
        emp.department || "",
        emp.designation || "",
        emp.role || "",
        emp.status || "",
        emp.isSuspended ? "Yes" : "No"
      ].map(val => `"${val.replace(/"/g, '""')}"`).join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `colleague_registry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logAuditAction("Admin exported colleague registry to CSV");
  };

  // Employee Management Action handlers
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      if (editingEmpId) {
        // Edit flow
        const payload = {
          fullName: empFullName,
          designation: empDesignation,
          department: empDepartment,
          email: empEmail,
          phone: empPhone,
          bio: empBio,
          role: empRole
        };
        await axios.put(`${window.API_BASE_URL}/users/${editingEmpId}`, payload);
        alert("Employee updated successfully");
        logAuditAction(`Admin edited colleague profile: ${empUsername}`);
      } else {
        // Create flow
        if (!empUsername || !empPassword) {
          alert("Username and password are required");
          return;
        }

        // a. Register credential
        const regRes = await axios.post(window.API_BASE_URL + "/register", {
          username: empUsername,
          password: empPassword
        });

        if (!regRes.data.success) {
          alert(regRes.data.message || "Registration failed");
          return;
        }

        // b. Update detail fields
        const payload = {
          fullName: empFullName || empUsername,
          designation: empDesignation,
          department: empDepartment,
          email: empEmail,
          phone: empPhone,
          bio: empBio,
          role: empRole
        };
        await axios.put(`${window.API_BASE_URL}/users/${regRes.data.user._id}`, payload);
        alert("Colleague registered successfully");
        logAuditAction(`Admin registered new colleague credentials: ${empUsername}`);
      }
      clearEmployeeForm();
      loadEmployees();
    } catch (err) {
      console.error(err);
      alert("Failed to save colleague profile");
    }
  };

  const handleEditEmpSelect = (emp) => {
    setEditingEmpId(emp._id);
    setEmpUsername(emp.username);
    setEmpFullName(emp.fullName || "");
    setEmpDesignation(emp.designation || "");
    setEmpDepartment(emp.department || "Development");
    setEmpEmail(emp.email || "");
    setEmpPhone(emp.phone || "");
    setEmpBio(emp.bio || "");
    setEmpRole(emp.role || "employee");
  };

  const handleDeleteEmp = async (id, name) => {
    if (!window.confirm("Are you sure you want to remove this employee from workspace?")) return;
    try {
      await axios.delete(`${window.API_BASE_URL}/users/${id}`);
      alert("Colleague removed");
      logAuditAction(`Admin deleted colleague credentials: ${name}`);
      loadEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Suspend colleague action
  const handleToggleSuspend = async (emp) => {
    const nextState = !emp.isSuspended;
    const actionText = nextState ? "suspend" : "reactivate";
    if (!window.confirm(`Are you sure you want to ${actionText} colleague ${emp.username}?`)) return;
    try {
      await axios.put(`${window.API_BASE_URL}/users/${emp._id}`, {
        isSuspended: nextState
      });
      alert(`Colleague account is now ${nextState ? "suspended" : "active"}`);
      logAuditAction(`Admin ${nextState ? "suspended" : "reactivated"} account: ${emp.username}`);
      loadEmployees();
    } catch (err) {
      console.error(err);
      alert("Failed to change suspension state");
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword.trim()) {
      alert("Password cannot be empty");
      return;
    }
    try {
      await axios.put(`${window.API_BASE_URL}/users/${resettingEmp._id}`, {
        password: newPassword
      });
      alert(`Password reset successfully for user: ${resettingEmp.username}`);
      logAuditAction(`Admin reset password credentials for colleague: ${resettingEmp.username}`);
      setResettingEmp(null);
      setNewPassword("");
    } catch (err) {
      console.error(err);
      alert("Failed to reset password");
    }
  };

  const clearEmployeeForm = () => {
    setEditingEmpId(null);
    setEmpUsername("");
    setEmpPassword("");
    setEmpFullName("");
    setEmpDesignation("Software Engineer");
    setEmpDepartment("Development");
    setEmpEmail("");
    setEmpPhone("");
    setEmpBio("");
    setEmpRole("employee");
  };

  // 2. Group Management Action handlers
  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    const payload = {
      name: groupName,
      description: groupDesc,
      members: groupMembers,
      createdBy: loggedUser.username
    };

    try {
      if (editingGroupId) {
        await axios.put(`${window.API_BASE_URL}/chat/groups/${editingGroupId}`, payload);
        alert("Group channel updated successfully");
        logAuditAction(`Admin modified group channel info: #${groupName}`);
      } else {
        const res = await axios.post(window.API_BASE_URL + "/chat/groups/create", payload);
        if (res.data.success) {
          socket.emit("join-group", { groupId: res.data.group._id });
          alert("Group channel created successfully");
          logAuditAction(`Admin created new group channel: #${groupName}`);
        } else {
          alert(res.data.message || "Failed to create group");
        }
      }
      clearGroupForm();
      loadGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditGroupSelect = (g) => {
    setEditingGroupId(g._id);
    setGroupName(g.name);
    setGroupDesc(g.description || "");
    setGroupMembers(g.members || []);
  };

  const handleDeleteGroup = async (id, name) => {
    if (!window.confirm("Are you sure you want to delete this channel?")) return;
    try {
      await axios.delete(`${window.API_BASE_URL}/chat/groups/${id}`);
      alert("Channel deleted");
      logAuditAction(`Admin deleted group channel: #${name}`);
      loadGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleGroupMember = (username) => {
    setGroupMembers((prev) => 
      prev.includes(username) 
        ? prev.filter((m) => m !== username) 
        : [...prev, username]
    );
  };

  const clearGroupForm = () => {
    setEditingGroupId(null);
    setGroupName("");
    setGroupDesc("");
    setGroupMembers([]);
  };

  // 3. Broadcast Action handlers
  const handleBcFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setBcFile({
        name: file.name,
        type: file.type,
        base64: reader.result.split(",")[1]
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!bcText.trim() && !bcFile) return;

    let fileUrl = "";
    let fileName = "";
    let messageType = "text";

    if (bcFile) {
      setUploadingFile(true);
      try {
        const uploadRes = await axios.post(window.API_BASE_URL + "/chat/upload", {
          fileName: bcFile.name,
          fileData: bcFile.base64
        });
        if (uploadRes.data.success) {
          fileUrl = uploadRes.data.fileUrl;
          fileName = uploadRes.data.fileName;
          messageType = "file";
        }
      } catch (err) {
        console.error("Upload failed", err);
        setUploadingFile(false);
        return;
      }
      setUploadingFile(false);
    }

    const payload = {
      sender: loggedUser.username,
      text: bcText,
      messageType,
      fileUrl,
      fileName,
      scheduledAt: isScheduled ? new Date(scheduledDate) : new Date()
    };

    try {
      await axios.post(window.API_BASE_URL + "/chat/broadcasts/create", payload);
      alert(isScheduled ? "Broadcast scheduled successfully" : "Broadcast dispatched immediately");
      logAuditAction(`Admin dispatched system announcement notice: "${bcText.substring(0, 20)}..."`);
      setBcText("");
      setBcFile(null);
      setIsScheduled(false);
      setScheduledDate("");
      loadBroadcasts();
    } catch (err) {
      console.error(err);
    }
  };

  // Access check
  if (!isAdmin) {
    return (
      <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full p-6">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center bg-slate-900 border border-slate-800 p-10 rounded-2xl max-w-sm space-y-4 shadow-xl">
              <IoAlertCircleOutline className="text-red-500 text-6xl mx-auto animate-pulse" />
              <h1 className="text-xl font-bold text-slate-200">Restricted Access Portal</h1>
              <p className="text-xs text-slate-400">
                Only system administrators are authorized to manage colleagues, adjust group lists, or dispatch announcements.
              </p>
              <button 
                onClick={() => navigate("/dashboard")}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 rounded-xl font-bold transition text-xs"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100">
      <Sidebar />

      {/* Main content block */}
      <div className="flex-1 flex flex-col h-full p-6 overflow-hidden">
        <Navbar />

        {/* Scrollable container workspace */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          
          {/* Header titles */}
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
                System Admin Console
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Add colleagues, reset workspace credentials, create channels, and dispatch system-wide notifications.
              </p>
            </div>
            
            {activeTab === "employees" && (
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 rounded-xl text-xs font-bold text-cyan-400 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <IoDownloadOutline size={16} />
                <span>Export CSV List</span>
              </button>
            )}
          </div>

          {/* Navigation tab bar */}
          <div className="flex border-b border-slate-850 gap-4">
            {[
              { id: "employees", label: "Colleagues", icon: <IoPersonAddOutline /> },
              { id: "groups", label: "Group Channels", icon: <IoPeopleOutline /> },
              { id: "broadcasts", label: "Broadcast & Audits", icon: <IoMegaphoneOutline /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 pb-3.5 px-2 text-xs font-bold transition relative ${
                  activeTab === tab.id ? "text-cyan-400" : "text-slate-500 hover:text-slate-350"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                )}
              </button>
            ))}
          </div>

          {/* TAB 1: Employee Management */}
          {activeTab === "employees" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Add/Edit form */}
              <form 
                onSubmit={handleSaveEmployee}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm"
              >
                <h3 className="text-sm font-bold text-slate-200">
                  {editingEmpId ? "Edit Colleague Profile" : "Register New Colleague"}
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Username</label>
                    <input
                      type="text"
                      value={empUsername}
                      onChange={(e) => setEmpUsername(e.target.value)}
                      disabled={!!editingEmpId}
                      className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 text-slate-200"
                      required
                    />
                  </div>

                  {!editingEmpId && (
                    <div>
                      <label className="text-slate-400 font-medium block mb-1">Temporary Password</label>
                      <input
                        type="password"
                        value={empPassword}
                        onChange={(e) => setEmpPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 text-slate-200"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={empFullName}
                      onChange={(e) => setEmpFullName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 text-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 font-medium block mb-1">Department</label>
                      <select
                        value={empDepartment}
                        onChange={(e) => setEmpDepartment(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 cursor-pointer text-slate-350"
                      >
                        <option>Development</option>
                        <option>HR</option>
                        <option>Marketing</option>
                        <option>Finance</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 font-medium block mb-1">Workspace Role</label>
                      <select
                        value={empRole}
                        onChange={(e) => setEmpRole(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 cursor-pointer text-slate-350"
                      >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Job Designation</label>
                    <input
                      type="text"
                      value={empDesignation}
                      onChange={(e) => setEmpDesignation(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Email</label>
                    <input
                      type="email"
                      value={empEmail}
                      onChange={(e) => setEmpEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Phone</label>
                    <input
                      type="text"
                      value={empPhone}
                      onChange={(e) => setEmpPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Short Bio</label>
                    <textarea
                      value={empBio}
                      onChange={(e) => setEmpBio(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 resize-none text-slate-200"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-slate-950 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {editingEmpId ? "Save Profile" : "Register Colleague"}
                  </button>
                  {editingEmpId && (
                    <button
                      type="button"
                      onClick={clearEmployeeForm}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Employee table */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-850 font-bold text-xs text-slate-400">
                  Colleague Registry ({filteredEmployees.length})
                </div>
                {/* Search & Filters Row */}
                <div className="p-4 border-b border-slate-850 grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950/20">
                  <input
                    type="text"
                    placeholder="Search by name, username..."
                    value={empSearchQuery}
                    onChange={(e) => { setEmpSearchQuery(e.target.value); setCurrentEmpPage(1); }}
                    className="bg-slate-955 border border-slate-855 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                  <select
                    value={selectedDeptFilter}
                    onChange={(e) => { setSelectedDeptFilter(e.target.value); setCurrentEmpPage(1); }}
                    className="bg-slate-955 border border-slate-855 rounded-xl px-3 py-2 text-xs text-slate-400 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                  >
                    <option value="All">All Departments</option>
                    <option>Development</option>
                    <option>HR</option>
                    <option>Marketing</option>
                    <option>Finance</option>
                  </select>
                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => { setSelectedRoleFilter(e.target.value); setCurrentEmpPage(1); }}
                    className="bg-slate-955 border border-slate-855 rounded-xl px-3 py-2 text-xs text-slate-400 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                  >
                    <option value="All">All Roles</option>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => { setSelectedStatusFilter(e.target.value); setCurrentEmpPage(1); }}
                    className="bg-slate-955 border border-slate-855 rounded-xl px-3 py-2 text-xs text-slate-400 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active Only</option>
                    <option value="Suspended">Suspended Only</option>
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-850">
                        <th className="p-4">Username</th>
                        <th className="p-4">Name</th>
                        <th className="p-4">Department / Designation</th>
                        <th className="p-4">Role</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60">
                      {paginatedEmployees.map((emp) => (
                        <tr 
                          key={emp._id} 
                          className={`hover:bg-slate-950/20 text-slate-200 transition ${
                            emp.isSuspended ? "opacity-60 bg-red-950/5" : ""
                          }`}
                        >
                          <td className="p-4 font-mono text-cyan-400 font-bold">
                            <div className="flex items-center gap-1.5">
                              {emp.username}
                              {emp.isSuspended && (
                                <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] font-extrabold uppercase px-1 rounded">
                                  Suspended
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-semibold">{emp.fullName || "-"}</td>
                          <td className="p-4">
                            <div>{emp.designation}</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{emp.department}</div>
                          </td>
                          <td className="p-4 capitalize text-[10px] font-bold">
                            <span className={`px-2 py-0.5 rounded ${
                              emp.role === "admin" ? "bg-red-500/10 text-red-400" :
                              emp.role === "manager" ? "bg-indigo-500/10 text-indigo-400" : "bg-slate-800 text-slate-400"
                            }`}>
                              {emp.role}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEditEmpSelect(emp)}
                                className="p-2 hover:bg-slate-800 text-slate-450 hover:text-white rounded-lg transition"
                                title="Edit employee profile"
                              >
                                <IoCreateOutline size={15} />
                              </button>
                              <button
                                onClick={() => setResettingEmp(emp)}
                                className="p-2 hover:bg-slate-800 text-slate-455 hover:text-white rounded-lg transition"
                                title="Reset password"
                              >
                                <IoKeyOutline size={15} />
                              </button>
                              
                              {/* Suspend Toggle trigger */}
                              <button
                                onClick={() => handleToggleSuspend(emp)}
                                className={`p-2 rounded-lg transition ${
                                  emp.isSuspended 
                                    ? "bg-red-950/20 text-red-400 hover:bg-red-900/30" 
                                    : "hover:bg-slate-800 text-slate-455 hover:text-white"
                                }`}
                                title={emp.isSuspended ? "Reactivate User" : "Suspend User"}
                              >
                                <IoBanOutline size={15} />
                              </button>

                              <button
                                onClick={() => handleDeleteEmp(emp._id, emp.username)}
                                className="p-2 hover:bg-red-500/15 text-slate-455 hover:text-red-400 rounded-lg transition"
                                title="Remove employee"
                              >
                                <IoTrashOutline size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-slate-850 flex justify-between items-center text-xs text-slate-500 bg-slate-950/10 select-none">
                    <span>
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} colleagues
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentEmpPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentEmpPage === 1}
                        className="px-3 py-1.5 bg-slate-955 border border-slate-855 rounded-lg hover:border-slate-700 disabled:opacity-40 transition font-bold cursor-pointer"
                      >
                        Prev
                      </button>
                      <span className="px-3 py-1.5 text-slate-300 font-bold bg-slate-955 border border-slate-855 rounded-lg">
                        Page {currentEmpPage} of {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentEmpPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentEmpPage === totalPages}
                        className="px-3 py-1.5 bg-slate-955 border border-slate-855 rounded-lg hover:border-slate-700 disabled:opacity-40 transition font-bold cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: Group Management */}
          {activeTab === "groups" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Add/Edit group Form */}
              <form 
                onSubmit={handleSaveGroup}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm"
              >
                <h3 className="text-sm font-bold text-slate-200">
                  {editingGroupId ? "Modify Channel Info" : "Create Group Channel"}
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Channel Name</label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="e.g. dynamic-sprint-team"
                      className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 text-slate-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Description</label>
                    <textarea
                      value={groupDesc}
                      onChange={(e) => setGroupDesc(e.target.value)}
                      placeholder="Purpose of this channel..."
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 resize-none text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-2">Select Channel Members</label>
                    <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 max-h-56 overflow-y-auto space-y-2">
                      {employees.map((emp) => {
                        const checked = groupMembers.includes(emp.username);
                        return (
                          <label key={emp._id} className="flex items-center gap-2.5 cursor-pointer text-xs select-none">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleGroupMember(emp.username)}
                              className="accent-cyan-500 w-4 h-4 rounded cursor-pointer"
                            />
                            <span className={checked ? "text-slate-200 font-bold" : "text-slate-500"}>
                              {emp.fullName || emp.username}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-slate-950 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {editingGroupId ? "Save Changes" : "Create Channel"}
                  </button>
                  {editingGroupId && (
                    <button
                      type="button"
                      onClick={clearGroupForm}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Group channels listing table */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-850 font-bold text-xs text-slate-400">
                  Workspace Channels ({groups.length})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-850">
                        <th className="p-4">Channel Name</th>
                        <th className="p-4">Description</th>
                        <th className="p-4">Members</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60">
                      {groups.map((g) => (
                        <tr key={g._id} className="hover:bg-slate-950/20 text-slate-200">
                          <td className="p-4 font-bold text-slate-200"># {g.name}</td>
                          <td className="p-4 text-slate-400 truncate max-w-[180px]">{g.description || "-"}</td>
                          <td className="p-4">
                            <span className="bg-cyan-950/40 text-cyan-400 border border-cyan-800/20 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                              {g.members?.length || 0} Members
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEditGroupSelect(g)}
                                className="p-2 hover:bg-slate-800 text-slate-455 hover:text-white rounded-lg transition"
                                title="Edit channel metadata/members"
                              >
                                <IoCreateOutline size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(g._id, g.name)}
                                className="p-2 hover:bg-red-500/15 text-slate-455 hover:text-red-400 rounded-lg transition"
                                title="Delete group channel"
                              >
                                <IoTrashOutline size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Broadcast Board & Audits */}
          {activeTab === "broadcasts" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Broadcast creator form */}
              <form 
                onSubmit={handleSendBroadcast}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm"
              >
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <IoMegaphoneOutline className="text-indigo-400" />
                  Dispatch System Announcement
                </h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Broadcast Text</label>
                    <textarea
                      value={bcText}
                      onChange={(e) => setBcText(e.target.value)}
                      placeholder="Type announcement here..."
                      rows={4}
                      className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 resize-none text-slate-200"
                      required
                    />
                  </div>

                  {/* Attachment fields */}
                  <div>
                    <label className="text-slate-400 font-medium block mb-1.5">Optional File Attachment</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => document.getElementById("bcFileInput").click()}
                        className="px-4 py-2 bg-slate-950 border border-slate-850 hover:border-slate-700 text-[10px] font-bold text-slate-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <IoDocumentAttachOutline size={16} />
                        <span>{bcFile ? "Change File" : "Choose Resource"}</span>
                      </button>
                      <input 
                        type="file"
                        id="bcFileInput"
                        onChange={handleBcFileChange}
                        className="hidden"
                      />
                      {bcFile && (
                        <div className="flex items-center gap-1 bg-indigo-950/40 text-indigo-400 border border-indigo-900/30 px-2 py-0.5 rounded text-[10px] truncate max-w-[160px]">
                          <span className="truncate">{bcFile.name}</span>
                          <button onClick={() => setBcFile(null)} className="text-slate-500 hover:text-white">✕</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scheduling fields */}
                  <div className="pt-2 border-t border-slate-850">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold select-none mb-3">
                      <input
                        type="checkbox"
                        checked={isScheduled}
                        onChange={(e) => setIsScheduled(e.target.checked)}
                        className="accent-cyan-500 w-4 h-4 rounded cursor-pointer"
                      />
                      <span>Schedule for future date</span>
                    </label>

                    {isScheduled && (
                      <div className="space-y-1 bg-slate-950 border border-slate-850 p-3 rounded-xl">
                        <label className="text-slate-500 font-bold uppercase tracking-wider text-[9px] block">Select dispatch timestamp</label>
                        <input
                          type="datetime-local"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full bg-transparent border-0 text-xs text-white focus:outline-none p-1 font-semibold cursor-pointer"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploadingFile}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 text-slate-950 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <IoMegaphoneOutline size={16} />
                  <span>{isScheduled ? "Schedule Announcement" : "Dispatch Immediately"}</span>
                </button>
              </form>

              {/* Logs */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Announcements logs */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-850 font-bold text-xs text-slate-400">
                    Announcements Logs ({broadcasts.length})
                  </div>
                  
                  <div className="p-4 space-y-3.5 max-h-[300px] overflow-y-auto">
                    {broadcasts.map((bc) => (
                      <div 
                        key={bc._id}
                        className={`p-4 rounded-xl border flex justify-between items-start gap-4 ${
                          bc.sent 
                            ? "bg-slate-950/20 border-slate-850" 
                            : "bg-indigo-950/5 border-indigo-900/30"
                        }`}
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                              <IoMegaphoneOutline size={12} className="text-cyan-400" />
                              {bc.sender}
                            </span>
                            
                            <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                              bc.sent 
                                ? "bg-green-500/10 text-green-400 border-green-800/30" 
                                : "bg-amber-500/10 text-amber-400 border-amber-800/30"
                            }`}>
                              {bc.sent ? "Active" : "Scheduled"}
                            </span>
                          </div>

                          <p className="text-xs text-slate-350 leading-relaxed break-words whitespace-pre-wrap">{bc.text}</p>
                          
                          {bc.fileUrl && (
                            <a 
                              href={bc.fileUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 p-2 bg-slate-950/50 hover:bg-slate-950 border border-slate-850 rounded-lg text-[10px] text-slate-300 transition"
                            >
                              <IoDocumentAttachOutline className="text-cyan-400" size={14} />
                              <span className="truncate max-w-[200px]">{bc.fileName.split("-").slice(1).join("-")}</span>
                            </a>
                          )}
                        </div>

                        <div className="text-right text-[10px] text-slate-550 font-semibold shrink-0">
                          <div className="flex items-center gap-1 justify-end">
                            <IoCalendarOutline />
                            <span>{formatDate(bc.scheduledAt)} {formatTime(bc.scheduledAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {broadcasts.length === 0 && (
                      <p className="text-center text-xs text-slate-500 py-6">No system announcements posted.</p>
                    )}
                  </div>
                </div>

                {/* Audit Logs Screen (Central Log repository for presentation compliance) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-850 font-bold text-xs text-slate-400 flex items-center gap-1.5">
                    <IoNewspaperOutline className="text-cyan-400" size={16} />
                    <span>System Administration Audit Logs</span>
                  </div>

                  <div className="p-4 space-y-3.5 max-h-[300px] overflow-y-auto">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="flex justify-between items-start gap-4 p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-xs">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-200">{log.action}</p>
                          <p className="text-[10px] text-slate-550 font-medium">Identity verification sync status: Success</p>
                        </div>
                        <span className="text-[9px] text-slate-500 font-bold shrink-0">{log.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </div>

      {/* Password Reset Modal overlay */}
      {resettingEmp && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-6 relative">
            <button 
              onClick={() => { setResettingEmp(null); setNewPassword(""); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="font-extrabold text-sm text-slate-200 flex items-center gap-2 mb-4">
              <IoKeyOutline className="text-cyan-400" />
              Reset Colleague Password
            </h3>
            
            <div className="space-y-4 text-xs">
              <p className="text-slate-400">
                Type the new temporary password for user: <span className="font-bold font-mono text-cyan-400">{resettingEmp.username}</span>
              </p>
              
              <input
                type="password"
                placeholder="Type new password..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
              />

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setResettingEmp(null); setNewPassword(""); }}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-xs font-semibold py-2.5 rounded-xl transition text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordReset}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-xs font-bold py-2.5 rounded-xl transition shadow-sm"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}