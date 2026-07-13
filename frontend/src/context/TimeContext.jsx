import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import socket from "../hooks/useSocket";

const TimeContext = createContext();

export function TimeProvider({ children }) {
  const [settings, setSettings] = useState({
    automaticTime: true,
    timezone: "UTC",
    manualTimeOffset: 0
  });

  useEffect(() => {
    fetchSettings();

    // Dynamically update workspace context when admin commits adjustments
    socket.on("settings-updated", (newSettings) => {
      setSettings(newSettings);
    });

    return () => {
      socket.off("settings-updated");
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get("http://localhost:5050/chat/settings/workspace");
      if (res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      console.error("Failed to load workspace settings:", err);
    }
  };

  // Get current active workspace time (ticks naturally relative to offset)
  const getWorkspaceTime = () => {
    const now = Date.now();
    if (settings.automaticTime) {
      return new Date(now);
    }
    return new Date(now + settings.manualTimeOffset);
  };

  // Convert any UTC database timestamp into active display time
  const adjustTimestamp = (dateInput) => {
    if (!dateInput) return new Date();
    const d = new Date(dateInput);
    if (settings.automaticTime) return d;
    
    // In manual mode, we offset the timestamp so it aligns with simulated workspace hours
    return new Date(d.getTime() + settings.manualTimeOffset);
  };

  // Format time (e.g. 10:24 AM)
  const formatTime = (dateInput) => {
    if (!dateInput) return "";
    const adjusted = adjustTimestamp(dateInput);
    try {
      return adjusted.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: settings.timezone === "Local" ? undefined : settings.timezone
      });
    } catch (e) {
      return adjusted.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  };

  // Format Date (e.g. October 10, 2026)
  const formatDate = (dateInput) => {
    if (!dateInput) return "";
    const adjusted = adjustTimestamp(dateInput);
    try {
      return adjusted.toLocaleDateString([], {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: settings.timezone === "Local" ? undefined : settings.timezone
      });
    } catch (e) {
      return adjusted.toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" });
    }
  };

  return (
    <TimeContext.Provider value={{ settings, getWorkspaceTime, adjustTimestamp, formatTime, formatDate, refreshSettings: fetchSettings }}>
      {children}
    </TimeContext.Provider>
  );
}

export function useTime() {
  return useContext(TimeContext);
}
