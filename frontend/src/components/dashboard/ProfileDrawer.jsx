import { 
  IoClose, 
  IoMailOutline, 
  IoCallOutline, 
  IoVideocamOutline, 
  IoBusinessOutline, 
  IoBriefcaseOutline, 
  IoFingerPrintOutline, 
  IoChatbubbleEllipsesOutline,
  IoTimeOutline,
  IoPulseOutline
} from "react-icons/io5";

export default function ProfileDrawer({ user, open, onClose, onMessage }) {
  // Resolve visibility: handles both conditional user rendering (Directory page) and drawer state toggling (Chat page)
  const isVisible = open !== undefined ? (open && !!user) : !!user;

  if (!isVisible) return null;

  const handleMessageClick = () => {
    if (onMessage) {
      onMessage(user);
    } else {
      onClose(); // Fallback if already in Chat page
    }
  };

  const lastSeenDate = user.lastSeen ? new Date(user.lastSeen) : null;
  const formattedLastSeen = (lastSeenDate && !isNaN(lastSeenDate.getTime()))
    ? lastSeenDate.toLocaleString([], { dateStyle: "short", timeStyle: "short" })
    : "Recently active";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      
      {/* 1. Backdrop Overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* 2. Slide-out Panel */}
      <div className="relative w-[420px] h-screen bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-up z-10">
        
        {/* Upper Header Card */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/30">
          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 float-right hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
            title="Close panel"
          >
            <IoClose size={22} />
          </button>

          {/* Profile Overview */}
          <div className="text-center mt-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-4xl font-black text-white mx-auto shadow-lg shadow-cyan-500/10 border border-cyan-400/20">
              {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : user.username.substring(0, 2).toUpperCase()}
            </div>
            
            <h2 className="text-xl font-bold mt-4 text-slate-100">
              {user.fullName || user.username}
            </h2>
            <p className="text-xs text-cyan-400 font-semibold mt-1">
              {user.designation || "Colleague"}
            </p>
            <span className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-[10px] font-bold ${
              user.status === "Online" ? "bg-green-500/10 text-green-400" :
              user.status === "Busy" ? "bg-red-500/10 text-red-400" :
              user.status === "Away" ? "bg-amber-500/10 text-amber-400" :
              "bg-slate-800 text-slate-400"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                user.status === "Online" ? "bg-green-400 animate-pulse" :
                user.status === "Busy" ? "bg-red-400" :
                user.status === "Away" ? "bg-amber-400" : "bg-slate-500"
              }`} />
              {user.status || "Offline"}
            </span>
          </div>
        </div>

        {/* Middle Core Details Scroll list */}
        <div className="flex-1 p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employee Information</h3>

          <div className="grid grid-cols-1 gap-3.5">
            {/* Department */}
            <div className="flex items-center gap-3 p-3 bg-slate-950/30 rounded-xl border border-slate-850/50">
              <IoBusinessOutline className="text-slate-500" size={18} />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Department</p>
                <p className="text-xs font-semibold text-slate-200">{user.department || "General"}</p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center gap-3 p-3 bg-slate-950/30 rounded-xl border border-slate-850/50">
              <IoBriefcaseOutline className="text-slate-500" size={18} />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Workspace Role</p>
                <p className="text-xs font-semibold text-slate-200 capitalize">{user.role || "Employee"}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3 p-3 bg-slate-950/30 rounded-xl border border-slate-850/50">
              <IoMailOutline className="text-slate-500" size={18} />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Email Address</p>
                <p className="text-xs font-semibold text-slate-200 truncate">{user.email || "not.provided@workspace.com"}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3 p-3 bg-slate-950/30 rounded-xl border border-slate-850/50">
              <IoCallOutline className="text-slate-500" size={18} />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Phone Number</p>
                <p className="text-xs font-semibold text-slate-200">{user.phone || "Not Configured"}</p>
              </div>
            </div>

            {/* Employee ID */}
            <div className="flex items-center gap-3 p-3 bg-slate-950/30 rounded-xl border border-slate-850/50">
              <IoFingerPrintOutline className="text-slate-500" size={18} />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Employee Badge ID</p>
                <p className="text-xs font-mono font-bold text-cyan-400">{user.employeeId || "EMP-993"}</p>
              </div>
            </div>

            {/* Presence History */}
            <div className="flex items-center gap-3 p-3 bg-slate-950/30 rounded-xl border border-slate-850/50">
              <IoTimeOutline className="text-slate-500" size={18} />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Last Seen Activity</p>
                <p className="text-xs font-semibold text-slate-200">{formattedLastSeen}</p>
              </div>
            </div>
          </div>

          {/* Biography Panel */}
          <div className="mt-6 p-4.5 bg-slate-950/20 border border-slate-850/40 rounded-xl">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Biography</h4>
            <p className="text-xs text-slate-400 leading-relaxed italic">
              {user.bio || "No summary provided by this employee yet."}
            </p>
          </div>
        </div>

        {/* Lower Core Quick Triggers */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/30 space-y-3.5">
          {/* Main Action Button */}
          <button
            onClick={handleMessageClick}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-sm text-sm"
          >
            <IoChatbubbleEllipsesOutline size={18} />
            <span>Send Direct Message</span>
          </button>

          {/* Secondary Actions (Voice/Video Call - Disabled) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled
              className="py-2.5 rounded-xl bg-slate-800 text-slate-500 border border-slate-750/30 flex items-center justify-center gap-1.5 text-xs font-semibold cursor-not-allowed"
              title="Voice service integration pending"
            >
              <IoCallOutline size={14} />
              <span>Voice Call</span>
            </button>
            <button
              disabled
              className="py-2.5 rounded-xl bg-slate-800 text-slate-500 border border-slate-750/30 flex items-center justify-center gap-1.5 text-xs font-semibold cursor-not-allowed"
              title="Video service integration pending"
            >
              <IoVideocamOutline size={14} />
              <span>Video Meet</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}