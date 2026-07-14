import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import Navbar from "../components/dashboard/Navbar";
import SearchBar from "../components/dashboard/SearchBar";
import EmployeeCard from "../components/dashboard/EmployeeCard";
import ProfileDrawer from "../components/dashboard/ProfileDrawer";
import { getUsers } from "../services/userService";
import socket from "../hooks/useSocket";

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUsers();
    
    // Listening to real-time online/offline updates
    socket.on("status-updated", () => {
      loadUsers();
    });

    return () => {
      socket.off("status-updated");
    };
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const filtered = users
    .filter((user) =>
      (user.fullName || user.username).toLowerCase().includes(search.toLowerCase())
    )
    .filter((user) => (department ? user.department === department : true))
    .filter((user) => (status ? user.status === status : true))
    .sort((a, b) => {
      if (sortBy === "nameDesc") {
        return (b.fullName || b.username).localeCompare(a.fullName || a.username);
      } else if (sortBy === "status") {
        const weight = { Online: 4, Away: 3, Busy: 2, Offline: 1 };
        const weightA = weight[a.status] || 0;
        const weightB = weight[b.status] || 0;
        if (weightA !== weightB) return weightB - weightA;
        return (a.fullName || a.username).localeCompare(b.fullName || b.username);
      } else {
        // default "name" (A-Z)
        return (a.fullName || a.username).localeCompare(b.fullName || b.username);
      }
    });

  return (
    <div className="flex h-[100dvh] bg-slate-950 overflow-hidden text-slate-100">
      {/* Global Sidebar Shell */}
      <Sidebar />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col h-full p-6 overflow-hidden pt-14 lg:pt-6 pb-16 lg:pb-6">
        {/* Top Navbar */}
        <Navbar />

        {/* Scrollable Workspace Container */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Header Section */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
                Colleague Directory
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Browse, search, and connect with other team members in the organization.
              </p>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs text-slate-350">
              Total Members: <span className="font-bold text-cyan-400">{filtered.length}</span>
            </div>
          </div>

          {/* Filtering Options Control Component */}
          <SearchBar
            search={search}
            setSearch={setSearch}
            department={department}
            setDepartment={setDepartment}
            status={status}
            setStatus={setStatus}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />

          {/* Colleague Listing Grid */}
          {filtered.length === 0 ? (
            <div className="bg-slate-900 border border-slate-850 p-12 rounded-2xl text-center max-w-md mx-auto mt-12 space-y-4">
              <span className="text-3xl">👥</span>
              <h3 className="text-base font-bold text-slate-200">No Colleagues Found</h3>
              <p className="text-xs text-slate-500">
                Try widening your filters or adjusting your keywords to find matching employees.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((user) => (
                <EmployeeCard
                  key={user._id}
                  user={user}
                  onClick={() => setSelectedUser(user)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Detailed Profile Overlay Drawer */}
      <ProfileDrawer
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onMessage={(user) => {
          navigate("/chat", {
            state: { user }
          });
        }}
      />
    </div>
  );
}