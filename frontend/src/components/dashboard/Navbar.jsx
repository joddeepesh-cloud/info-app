import { useLocation, useNavigate } from "react-router-dom";
import { 
  IoNotificationsOutline, 
  IoSearchOutline, 
  IoAddCircleOutline,
  IoSunnyOutline,
  IoMoonOutline
} from "react-icons/io5";
import { useTheme } from "../../context/ThemeContext";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const { theme, toggleTheme } = useTheme();

  // Dynamic breadcrumb mapping
  const getBreadcrumb = () => {
    switch (location.pathname) {
      case "/dashboard":
        return "Workspace > Dashboard";
      case "/users":
        return "Workspace > Colleague Directory";
      case "/chat":
        return "Workspace > Chat Console";
      case "/admin":
        return "Workspace > System Admin";
      default:
        return "Workspace > Portal";
    }
  };

  return (
    <div className="h-16 bg-slate-900 border-b border-slate-800/80 px-6 flex justify-between items-center rounded-2xl glass-panel shadow-sm shrink-0 mb-6">
      
      {/* 1. Breadcrumb and Search */}
      <div className="flex items-center gap-6">
        {/* Breadcrumb path */}
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase select-none">
          {getBreadcrumb()}
        </span>

        {/* Search box */}
        <div className="relative hidden md:block w-64">
          <IoSearchOutline className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Global search..."
            className="w-full bg-slate-950 border border-slate-850/80 rounded-xl py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:border-cyan-500/50 transition text-slate-300"
          />
        </div>
      </div>

      {/* 2. Right Side: Quick Actions, Theme, Notifications, User details */}
      <div className="flex items-center gap-4">
        
        {/* Quick Action button */}
        <button
          onClick={() => navigate("/users")}
          className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
          title="Start conversation"
        >
          <IoAddCircleOutline size={16} />
          <span>New Chat</span>
        </button>

        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-slate-800/50 rounded-lg text-slate-400 hover:text-white transition"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <IoSunnyOutline size={18} /> : <IoMoonOutline size={18} />}
        </button>

        {/* Notifications Icon (Mock count for UI polish) */}
        <div className="relative cursor-pointer p-2 hover:bg-slate-800/50 rounded-lg text-slate-400 hover:text-white transition">
          <IoNotificationsOutline size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-800" />

        {/* User Card */}
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <h5 className="text-xs font-bold text-slate-200">{user?.fullName || user?.username || "Guest"}</h5>
            <p className="text-[9px] text-green-400 font-semibold flex items-center justify-end gap-1.5">
              <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse-subtle" />
              Active Online
            </p>
          </div>
          
          <div className="w-8.5 h-8.5 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400 uppercase text-xs">
            {user?.username ? user.username.substring(0, 2) : "GU"}
          </div>
        </div>

      </div>

    </div>
  );
}