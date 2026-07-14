import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTime } from "../context/TimeContext";
import { useTheme } from "../context/ThemeContext";
import Sidebar from "../components/dashboard/Sidebar";
import Navbar from "../components/dashboard/Navbar";
import { 
  IoTimeOutline, 
  IoEarthOutline, 
  IoSaveOutline, 
  IoCalendarOutline,
  IoNotificationsOutline,
  IoColorPaletteOutline
} from "react-icons/io5";

export default function Settings() {
  const navigate = useNavigate();
  const loggedUser = JSON.parse(localStorage.getItem("user"));
  const isAdmin = loggedUser?.role === "admin";

  const { settings, getWorkspaceTime, refreshSettings } = useTime();
  const { accentColor, setAccentColor } = useTheme();

  // Local settings form state
  const [automaticTime, setAutomaticTime] = useState(true);
  const [timezone, setTimezone] = useState("UTC");
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [saving, setSaving] = useState(false);

  // Notification state
  const [browserNotifications, setBrowserNotifications] = useState(
    Notification.permission === "granted"
  );

  useEffect(() => {
    if (settings) {
      setAutomaticTime(settings.automaticTime);
      setTimezone(settings.timezone);
      
      const activeWorkspaceTime = getWorkspaceTime();
      const yyyy = activeWorkspaceTime.getFullYear();
      const mm = String(activeWorkspaceTime.getMonth() + 1).padStart(2, "0");
      const dd = String(activeWorkspaceTime.getDate()).padStart(2, "0");
      const hh = String(activeWorkspaceTime.getHours()).padStart(2, "0");
      const min = String(activeWorkspaceTime.getMinutes()).padStart(2, "0");

      setManualDate(`${yyyy}-${mm}-${dd}`);
      setManualTime(`${hh}:${min}`);
    }
  }, [settings]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);

    let calculatedOffset = 0;

    if (!automaticTime) {
      try {
        const targetString = `${manualDate}T${manualTime}:00`;
        const targetMs = new Date(targetString).getTime();
        if (isNaN(targetMs)) {
          alert("Invalid manual Date/Time inputs");
          setSaving(false);
          return;
        }
        calculatedOffset = targetMs - Date.now();
      } catch (err) {
        console.error("Offset calculate error:", err);
        setSaving(false);
        return;
      }
    }

    try {
      const res = await axios.put(window.API_BASE_URL + "/chat/settings/workspace", {
        automaticTime,
        timezone,
        manualTimeOffset: calculatedOffset
      });

      if (res.data.success) {
        alert("Workspace temporal configurations applied successfully");
        refreshSettings();
      }
    } catch (err) {
      console.error("Save settings error:", err);
      alert("Failed to update workspace settings");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      setBrowserNotifications(permission === "granted");
    } else if (Notification.permission === "granted") {
      alert("Browser notifications are already enabled.");
    } else {
      alert("Browser notifications are blocked. Please reset site permissions in your browser.");
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full p-6 overflow-hidden pt-14 md:pt-6 pb-16 md:pb-6">
        <Navbar />

        <div className="flex-1 overflow-y-auto space-y-6 max-w-2xl pr-2">
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
              Personal Preferences
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Customize your dashboard layout theme, accent color, and desktop notification rules.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            {/* Theme / Accent Palette */}
            <div className="space-y-2">
              <label className="text-slate-400 font-bold block flex items-center gap-1.5 text-xs">
                <IoColorPaletteOutline className="text-cyan-400" size={16} />
                Accent Theme Color
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { id: "cyan", name: "Cyan", color: "bg-[#00E5FF]" },
                  { id: "amber", name: "Amber", color: "bg-[#F59E0B]" },
                  { id: "emerald", name: "Emerald", color: "bg-[#10B981]" },
                  { id: "indigo", name: "Indigo", color: "bg-[#6366F1]" },
                  { id: "rose", name: "Rose", color: "bg-[#F43F5E]" },
                  { id: "violet", name: "Violet", color: "bg-[#8B5CF6]" }
                ].map((colorItem) => (
                  <button
                    key={colorItem.id}
                    onClick={() => setAccentColor(colorItem.id)}
                    className={`flex items-center gap-1.5 p-2 rounded-xl border text-[10px] font-bold transition justify-center cursor-pointer ${
                      accentColor === colorItem.id
                        ? "border-cyan-500 bg-cyan-950/15 text-white"
                        : "border-slate-800 bg-slate-955 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${colorItem.color}`} />
                    <span>{colorItem.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Notifications Toggle */}
            <div className="flex justify-between items-center p-4 bg-slate-955 border border-slate-855 rounded-xl">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-slate-200 block flex items-center gap-1.5">
                  <IoNotificationsOutline size={14} className="text-cyan-400" />
                  Enable Push Notifications
                </label>
                <p className="text-[10px] text-slate-500">Receive alerts for new private or group channel messages</p>
              </div>
              <button
                type="button"
                onClick={handleToggleNotifications}
                className={`w-12 h-6.5 rounded-full transition p-1 flex items-center cursor-pointer ${
                  browserNotifications ? "bg-cyan-500 justify-end" : "bg-slate-800 justify-start"
                }`}
              >
                <span className="w-4.5 h-4.5 bg-slate-950 rounded-full shadow-md" />
              </button>
            </div>
          </div>

          {/* Admin Temporal Configurations Section */}
          {isAdmin ? (
            <div className="space-y-4">
              <div>
                <h1 className="text-lg font-bold text-slate-200">
                  Workspace Admin Temporal Controls
                </h1>
                <p className="text-[10px] text-slate-500">
                  Simulate clocks, calendar overrides, and offset temporal parameters globally.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
                <div className="flex justify-between items-center p-4 bg-slate-955 border border-slate-855 rounded-xl">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-slate-200">Automatic Sync Clock</label>
                    <p className="text-[10px] text-slate-500">Enable default client system clock times</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutomaticTime(!automaticTime)}
                    className={`w-12 h-6.5 rounded-full transition p-1 flex items-center cursor-pointer ${
                      automaticTime ? "bg-cyan-500 justify-end" : "bg-slate-800 justify-start"
                    }`}
                  >
                    <span className="w-4.5 h-4.5 bg-slate-950 rounded-full shadow-md" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-400 font-bold block flex items-center gap-1.5">
                    <IoEarthOutline className="text-cyan-400" />
                    Workspace Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-855 p-3 rounded-xl focus:outline-none focus:border-cyan-500/50 cursor-pointer text-slate-300 font-semibold"
                  >
                    <option value="Local">Local Browser Timezone</option>
                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                    <option value="America/New_York">Eastern Standard Time (EST)</option>
                    <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                    <option value="Asia/Kolkata">Indian Standard Time (IST)</option>
                    <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                  </select>
                </div>

                {!automaticTime && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up">
                    <div className="space-y-1.5 text-xs">
                      <label className="text-slate-400 font-bold block flex items-center gap-1.5">
                        <IoCalendarOutline className="text-cyan-400" />
                        Simulated Date
                      </label>
                      <input
                        type="date"
                        value={manualDate}
                        onChange={(e) => setManualDate(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-855 p-3 rounded-xl focus:outline-none focus:border-cyan-500/50 text-white font-mono cursor-pointer"
                        required
                      />
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <label className="text-slate-400 font-bold block flex items-center gap-1.5">
                        <IoTimeOutline className="text-cyan-400" />
                        Simulated Time
                      </label>
                      <input
                        type="time"
                        value={manualTime}
                        onChange={(e) => setManualTime(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-855 p-3 rounded-xl focus:outline-none focus:border-cyan-500/50 text-white font-mono cursor-pointer"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 text-slate-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <IoSaveOutline size={16} />
                    <span>{saving ? "Saving configurations..." : "Apply Workspace Settings"}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
