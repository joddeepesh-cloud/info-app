import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTime } from "../context/TimeContext";
import Sidebar from "../components/dashboard/Sidebar";
import Navbar from "../components/dashboard/Navbar";
import { 
  IoTimeOutline, 
  IoEarthOutline, 
  IoSaveOutline, 
  IoCalendarOutline,
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline
} from "react-icons/io5";

export default function Settings() {
  const navigate = useNavigate();
  const loggedUser = JSON.parse(localStorage.getItem("user"));
  const isAdmin = loggedUser?.role === "admin";

  const { settings, getWorkspaceTime, refreshSettings } = useTime();

  // Local settings form state
  const [automaticTime, setAutomaticTime] = useState(true);
  const [timezone, setTimezone] = useState("UTC");
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setAutomaticTime(settings.automaticTime);
      setTimezone(settings.timezone);
      
      // Seed manual inputs with current workspace time
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
    setSaving(true);

    let calculatedOffset = 0;

    if (!automaticTime) {
      // Calculate offset: target simulated time - actual server time
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

  if (!isAdmin) {
    return (
      <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full p-6">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center bg-slate-900 border border-slate-800 p-10 rounded-2xl max-w-sm space-y-4 shadow-xl">
              <IoAlertCircleOutline className="text-red-500 text-6xl mx-auto animate-pulse" />
              <h1 className="text-xl font-bold text-slate-200">Restricted Settings</h1>
              <p className="text-xs text-slate-400">
                Workspace calendar modifications, time offsets, and global timezone overrides can only be set by authorized Admins.
              </p>
              <button 
                onClick={() => navigate("/dashboard")}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 rounded-xl font-bold transition text-xs"
              >
                Return to Dashboard
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

      <div className="flex-1 flex flex-col h-full p-6 overflow-hidden pt-14 md:pt-6">
        <Navbar />

        <div className="flex-1 overflow-y-auto space-y-6 max-w-2xl">
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
              Workspace Settings
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Adjust global timezone configurations, calendar sync rules, and simulated system clocks.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            
            {/* Automatic toggle */}
            <div className="flex justify-between items-center p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
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

            {/* Timezone Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="text-slate-400 font-bold block flex items-center gap-1.5">
                <IoEarthOutline className="text-cyan-400" />
                Workspace Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-cyan-500/50 cursor-pointer text-slate-300 font-semibold"
              >
                <option value="Local">Local Browser Timezone</option>
                <option value="UTC">Coordinated Universal Time (UTC)</option>
                <option value="America/New_York">Eastern Standard Time (EST)</option>
                <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                <option value="Asia/Kolkata">Indian Standard Time (IST)</option>
                <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
              </select>
            </div>

            {/* Manual Date/Time overrides */}
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
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-cyan-500/50 text-white font-mono cursor-pointer"
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
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-cyan-500/50 text-white font-mono cursor-pointer"
                    required
                  />
                </div>

              </div>
            )}

            {/* Submit button */}
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
      </div>
    </div>
  );
}
