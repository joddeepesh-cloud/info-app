import { IoBusinessOutline, IoTimeOutline, IoChevronForward } from "react-icons/io5";

export default function EmployeeCard({ user, onClick }) {
  
  // Custom badges color styling based on department
  const getDeptColor = (dept) => {
    switch (dept) {
      case "Development": return "bg-cyan-950/40 text-cyan-400 border-cyan-800/30";
      case "HR": return "bg-rose-950/40 text-rose-400 border-rose-800/30";
      case "Marketing": return "bg-purple-950/40 text-purple-400 border-purple-800/30";
      case "Finance": return "bg-amber-950/40 text-amber-400 border-amber-800/30";
      default: return "bg-slate-900/60 text-slate-400 border-slate-800/30";
    }
  };

  const lastSeenDate = user.lastSeen ? new Date(user.lastSeen) : null;
  const formattedLastSeen = (lastSeenDate && !isNaN(lastSeenDate.getTime()))
    ? lastSeenDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Recently active";

  return (
    <div
      onClick={onClick}
      className="bg-slate-900 border border-slate-800/60 hover:border-cyan-500/20 hover:shadow-lg hover:shadow-cyan-950/5 rounded-2xl p-5 hover:bg-slate-850/80 transition-all duration-300 cursor-pointer flex items-center justify-between group"
    >
      
      {/* 1. Left side: Avatar, Name, Designation & Department details */}
      <div className="flex items-center gap-4 min-w-0">
        
        {/* Avatar Initials Placeholder */}
        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center font-black text-white text-sm border border-slate-700/60 uppercase shadow-inner shrink-0 group-hover:bg-slate-750 transition-colors">
          {user.fullName ? user.fullName.substring(0, 2) : user.username.substring(0, 2)}
        </div>

        <div className="min-w-0 space-y-1">
          {/* Name & Status Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-100 text-sm group-hover:text-cyan-400 transition-colors truncate">
              {user.fullName || user.username}
            </h3>
            
            {/* Status dot */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
              user.status === "Online" ? "bg-green-500/10 text-green-400" :
              user.status === "Busy" ? "bg-red-500/10 text-red-400" :
              user.status === "Away" ? "bg-amber-500/10 text-amber-400" : "bg-slate-800 text-slate-400"
            }`}>
              <span className={`w-1 h-1 rounded-full ${
                user.status === "Online" ? "bg-green-400 animate-pulse" :
                user.status === "Busy" ? "bg-red-400" :
                user.status === "Away" ? "bg-amber-400" : "bg-slate-500"
              }`} />
              {user.status || "Offline"}
            </span>
          </div>

          {/* Designation */}
          <p className="text-xs text-slate-400 truncate">
            {user.designation || "Enterprise Associate"}
          </p>

          {/* Department badge and last seen info */}
          <div className="flex items-center gap-3 pt-1 flex-wrap text-[10px] text-slate-500 font-medium">
            <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg border font-bold uppercase tracking-wider ${getDeptColor(user.department)}`}>
              <IoBusinessOutline size={10} />
              {user.department || "General"}
            </span>
            <span className="flex items-center gap-1">
              <IoTimeOutline size={11} />
              Last Seen: {formattedLastSeen}
            </span>
          </div>
        </div>

      </div>

      {/* 2. Right side: Action chevron */}
      <div className="p-2 hover:bg-slate-850 rounded-xl text-slate-500 group-hover:text-cyan-400 transition-all shrink-0">
        <IoChevronForward size={18} />
      </div>

    </div>
  );
}