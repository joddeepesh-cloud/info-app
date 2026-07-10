import Sidebar from "../components/dashboard/Sidebar";
import Navbar from "../components/dashboard/Navbar";
import Usercard from "../components/dashboard/Usercard";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-slate-950">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-8">

        <Navbar />

        <div className="grid grid-cols-3 gap-6 mt-8">

          <Usercard />

          <div className="bg-slate-800 rounded-xl p-6">

            <h2 className="text-2xl text-cyan-400 font-bold mb-4">
              💬 Recent Chats
            </h2>

            <Link to="/chat">
  <button className="w-full bg-cyan-500 hover:bg-cyan-600 rounded-lg p-3 font-bold mb-4 transition">
    Open Chat
  </button>
</Link>



            <div className="space-y-3">

              <div className="bg-slate-700 rounded-lg p-4">
                HR Department
              </div>

              <div className="bg-slate-700 rounded-lg p-4">
                Development Team
              </div>

              <div className="bg-slate-700 rounded-lg p-4">
                Project Manager
              </div>

            </div>

          </div>

          <div className="bg-slate-800 rounded-xl p-6">

            <h2 className="text-2xl text-yellow-400 font-bold mb-4">
              🔔 Notifications
            </h2>

            <ul className="space-y-3 text-gray-300">

              <li>✔ Login Successful</li>

              <li>✔ MongoDB Connected</li>

              <li>✔ Secure JWT Enabled</li>

            </ul>

          </div>

        </div>

        <div className="bg-slate-800 rounded-xl p-8 mt-8">

          <h2 className="text-2xl font-bold text-white mb-4">
            📊 Enterprise Overview
          </h2>

          <div className="grid grid-cols-4 gap-5">

            <div className="bg-slate-700 rounded-xl p-6 text-center">

              <h1 className="text-5xl font-bold text-cyan-400">25</h1>

              <p className="text-gray-300 mt-2">Employees</p>

            </div>

            <div className="bg-slate-700 rounded-xl p-6 text-center">

              <h1 className="text-5xl font-bold text-green-400">18</h1>

              <p className="text-gray-300 mt-2">Online</p>

            </div>

            <div className="bg-slate-700 rounded-xl p-6 text-center">

              <h1 className="text-5xl font-bold text-yellow-400">12</h1>

              <p className="text-gray-300 mt-2">Projects</p>

            </div>

            <div className="bg-slate-700 rounded-xl p-6 text-center">

              <h1 className="text-5xl font-bold text-red-400">3</h1>

              <p className="text-gray-300 mt-2">Alerts</p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}