import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  IoHomeOutline, IoHome,
  IoPeopleOutline, IoPeople,
  IoChatbubbleOutline, IoChatbubble,
  IoShieldOutline, IoShield,
  IoLogOutOutline,
  IoChevronBackOutline, IoChevronForwardOutline,
  IoMenuOutline,
  IoCloseOutline,
  IoSettingsOutline, IoSettings
} from "react-icons/io5";
import Logo from "../common/Logo";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "admin";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      iconOutline: <IoHomeOutline size={20} />,
      iconSolid: <IoHome size={20} />,
    },
    {
      name: "Colleagues",
      path: "/users",
      iconOutline: <IoPeopleOutline size={20} />,
      iconSolid: <IoPeople size={20} />,
    },
    {
      name: "Chat Console",
      path: "/chat",
      iconOutline: <IoChatbubbleOutline size={20} />,
      iconSolid: <IoChatbubble size={20} />,
      badge: 2
    },
    ...(isAdmin ? [
      {
        name: "Admin Portal",
        path: "/admin",
        iconOutline: <IoShieldOutline size={20} />,
        iconSolid: <IoShield size={20} />,
      },
      {
        name: "Settings",
        path: "/settings",
        iconOutline: <IoSettingsOutline size={20} />,
        iconSolid: <IoSettings size={20} />,
      }
    ] : [])
  ];

  return (
    <>
      {/* ==================================================== */}
      {/* DESKTOP SIDEBAR (Visible on md and larger) */}
      {/* ==================================================== */}
      <div className={`hidden md:flex h-screen bg-slate-900 border-r border-slate-800 flex-col justify-between transition-all duration-300 relative shrink-0 z-40 ${
        collapsed ? "w-20" : "w-64"
      }`}>
        <div>
          {/* Logo signature header */}
          <div className={`flex items-center justify-between p-5 border-b border-slate-800/85 ${collapsed ? "justify-center" : ""}`}>
            <Logo size={collapsed ? "small" : "small"} showText={!collapsed} />
            
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              {collapsed ? <IoChevronForwardOutline size={18} /> : <IoChevronBackOutline size={18} />}
            </button>
          </div>

          {/* Navigation Links list */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-xs font-bold transition relative group ${
                    isActive 
                      ? "bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 border-l-4 border-cyan-500 text-white" 
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-100"
                  }`}
                >
                  <div className="shrink-0">
                    {isActive ? item.iconSolid : item.iconOutline}
                  </div>
                  {!collapsed && (
                    <span className="flex-1 truncate">{item.name}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className="bg-cyan-500 text-slate-950 font-bold text-[9px] px-2 py-0.5 rounded-full shrink-0">
                      {item.badge}
                    </span>
                  )}
                  {collapsed && item.badge && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile lower tier card */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/20">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-cyan-400 uppercase text-xs shrink-0">
              {user?.username ? user.username.substring(0, 2) : "GU"}
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-200 truncate">{user?.fullName || user?.username || "Guest"}</h4>
                <p className="text-[9px] text-slate-500 truncate uppercase tracking-wider">{user?.role || "Employee"}</p>
              </div>
            )}

            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition shrink-0"
                title="Logout session"
              >
                <IoLogOutOutline size={18} />
              </button>
            )}
          </div>
          {collapsed && (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center p-2 mt-3 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition"
              title="Logout session"
            >
              <IoLogOutOutline size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ==================================================== */}
      {/* MOBILE HEADER & BURGER BAR (Visible on screens < md) */}
      {/* ==================================================== */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 flex justify-between items-center px-4 z-40">
        <Logo size="small" showText={true} />
        <button 
          onClick={() => setMobileDrawerOpen(true)}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
        >
          <IoMenuOutline size={24} />
        </button>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            onClick={() => setMobileDrawerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Slider content */}
          <div className="relative w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-5 z-10 animate-slide-up">
            <div>
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800">
                <Logo size="small" showText={true} />
                <button 
                  onClick={() => setMobileDrawerOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <IoCloseOutline size={24} />
                </button>
              </div>

              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl text-xs font-bold transition ${
                        isActive 
                          ? "bg-cyan-500/10 border-l-4 border-cyan-500 text-white" 
                          : "text-slate-400 hover:bg-slate-800/40"
                      }`}
                    >
                      {item.iconOutline}
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-cyan-400 text-xs uppercase">
                  {user?.username ? user.username.substring(0, 2) : "GU"}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{user?.username}</h4>
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest">{user?.role}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition"
              >
                <IoLogOutOutline size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Visible on screens < md) */}
      {/* ==================================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800/80 flex justify-around items-center z-40 px-2 shadow-2xl pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
                isActive ? "text-cyan-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className="relative">
                {isActive ? item.iconSolid : item.iconOutline}
                {item.badge && !isActive && (
                  <span className="absolute -top-1.5 -right-1.5 bg-cyan-500 text-slate-950 font-extrabold text-[8px] px-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[8px] font-bold uppercase tracking-wider mt-1">{item.name.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
      
      {/* Bottom spacing offset to prevent navigation overlay overlapping content */}
      <div className="md:hidden h-16 shrink-0 pointer-events-none" />
    </>
  );
}