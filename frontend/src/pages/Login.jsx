import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Logo from "../components/common/Logo";
import socket from "../hooks/useSocket";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Please enter username and password");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5050/login",
        {
          username,
          password,
        }
      );

      if (res.data.success) {
        // Save login details
        localStorage.setItem("token", res.data.token);
        localStorage.setItem(
          "user",
          JSON.stringify(res.data.user)
        );

        // Notify socket that user is online
        socket.emit("user-online", res.data.user._id);

        // Go to dashboard
        navigate("/dashboard");
      } else {
        alert("Login failed");
      }
    } catch (err) {
      console.error(err);

      if (err.response) {
        alert(err.response.data.message || "Login failed");
      } else {
        alert("Cannot connect to server");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 w-[420px] rounded-3xl shadow-2xl p-10">

        <Logo />

        <input
          type="text"
          placeholder="Username"
          className="w-full p-4 rounded-xl mb-4 bg-slate-700 text-white outline-none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-4 rounded-xl mb-6 bg-slate-700 text-white outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-cyan-500 hover:bg-cyan-600 rounded-xl p-4 font-bold text-white"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </div>
    </div>
  );
}