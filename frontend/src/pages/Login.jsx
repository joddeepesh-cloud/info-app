import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  IoLockClosedOutline, 
  IoPersonOutline, 
  IoEyeOutline, 
  IoEyeOffOutline, 
  IoHelpCircleOutline,
  IoInformationCircleOutline,
  IoLogoSlack
} from "react-icons/io5";
import socket from "../hooks/useSocket";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);

  // Load remembered username if exists
  useEffect(() => {
    const savedUser = localStorage.getItem("rememberedUsername");
    if (savedUser) {
      setUsername(savedUser);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!username.trim() || !password.trim()) {
      setErrorMessage("Please enter both username and password");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("http://localhost:5050/login", {
        username: username.trim(),
        password: password.trim(),
      });

      if (res.data.success) {
        // Handle Remember Me
        if (rememberMe) {
          localStorage.setItem("rememberedUsername", username.trim());
        } else {
          localStorage.removeItem("rememberedUsername");
        }

        // Save session credentials
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        // Connect socket
        socket.emit("user-online", res.data.user._id);

        // Transition to dashboard
        navigate("/dashboard");
      } else {
        setErrorMessage(res.data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      if (err.response) {
        setErrorMessage(err.response.data.message || "Invalid workspace credentials");
      } else {
        setErrorMessage("Cannot connect to server. Check network connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* 1. Left Side: Visual Illustration Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 relative items-center justify-center border-r border-slate-900 overflow-hidden">
        
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl" />

        <div className="relative text-center max-w-md p-8 space-y-6 z-10 animate-slide-up">
          {/* Futuristic branding element */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-cyan-500 flex items-center justify-center text-4xl shadow-2xl shadow-cyan-500/20 border border-cyan-400/20">
            💬
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-white">
              INFO WORKSPACE
            </h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
              Secure Internal Enterprise Portal
            </p>
          </div>

          <div className="p-4.5 bg-slate-900/60 border border-slate-850 rounded-2xl text-left text-xs space-y-2 text-slate-350">
            <div className="flex items-center gap-2 font-bold text-cyan-400">
              <IoLockClosedOutline />
              <span>Identity & Access Managed</span>
            </div>
            <p className="leading-relaxed">
              Welcome to the centralized internal operations portal. Communications are encrypted end-to-end and roles are enforced under administrative credentials.
            </p>
          </div>
        </div>

        {/* Floating brand signature */}
        <div className="absolute bottom-6 left-8 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
          Enterprise Communication Node v1.1
        </div>
      </div>

      {/* 2. Right Side: Login Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16 relative">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          
          {/* Logo signature for small screens */}
          <div className="lg:hidden text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500 flex items-center justify-center text-2xl shadow-xl">
              💬
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-200">INFO WORKSPACE</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Internal Operations</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-200">Welcome Back</h2>
            <p className="text-xs text-slate-500">Sign in to sync your active chats and announcements.</p>
          </div>

          {/* Error panel */}
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-red-400">
              <IoInformationCircleOutline className="shrink-0 mt-0.5" size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form fields */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-400 font-medium block mb-1.5">Username</label>
              <div className="relative">
                <IoPersonOutline className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Type username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-200 focus:outline-none focus:border-cyan-500/50 transition font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1.5">Password</label>
              <div className="relative">
                <IoLockClosedOutline className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Type password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-11 text-slate-200 focus:outline-none focus:border-cyan-500/50 transition font-semibold"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-white"
                >
                  {showPassword ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between text-slate-400 pt-1 font-semibold">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-cyan-500 w-4 h-4 rounded cursor-pointer"
                />
                <span>Remember Me</span>
              </label>

              <button
                type="button"
                onClick={() => setForgotPasswordModal(true)}
                className="text-cyan-400 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-bold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2 mt-6 shadow-lg shadow-cyan-500/5"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Administrator registration check notice */}
          <div className="pt-6 border-t border-slate-900 text-center">
            <p className="text-slate-500 font-medium">
              Need an account? <span className="text-slate-400 font-bold block mt-0.5">Contact your administrator.</span>
            </p>
          </div>

        </div>
      </div>

      {/* 3. Managed Account Password Reset Modal */}
      {forgotPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-6 relative animate-slide-up">
            <button 
              onClick={() => setForgotPasswordModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              ✕
            </button>
            <h3 className="font-extrabold text-sm text-slate-200 flex items-center gap-2 mb-3">
              <IoHelpCircleOutline className="text-cyan-400" size={18} />
              Reset Workspace Password
            </h3>
            
            <div className="space-y-4 text-xs">
              <p className="text-slate-400 leading-relaxed">
                This app operates as an internal enterprise node. Self-service password recovery is disabled.
              </p>
              
              <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-start gap-2.5 text-slate-500 leading-relaxed font-semibold">
                <IoInformationCircleOutline className="text-cyan-400 shrink-0 mt-0.5" />
                <span>Please coordinate directly with your designated IT Systems Administrator to request credentials resetting.</span>
              </div>

              <button
                onClick={() => setForgotPasswordModal(false)}
                className="w-full bg-slate-800 hover:bg-slate-750 text-xs font-bold py-3 rounded-xl transition text-slate-350"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}