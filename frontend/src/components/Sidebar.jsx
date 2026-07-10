import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-slate-900 text-white p-6 flex flex-col">

      <h1 className="text-3xl font-bold text-cyan-400 mb-10">
        INFO APP
      </h1>

      <nav className="space-y-5">

        <Link
          to="/dashboard"
          className="block hover:bg-slate-800 p-3 rounded-xl transition"
        >
          🏠 Dashboard
        </Link>

        <Link
          to="/chat"
          className="block hover:bg-slate-800 p-3 rounded-xl transition"
        >
          💬 Chats
        </Link>

        <Link
          to="/admin"
          className="block hover:bg-slate-800 p-3 rounded-xl transition"
        >
          👤 Admin
        </Link>

        <button
          className="w-full text-left hover:bg-red-500 p-3 rounded-xl transition mt-10"
        >
          🚪 Logout
        </button>

      </nav>

    </div>
  );
}