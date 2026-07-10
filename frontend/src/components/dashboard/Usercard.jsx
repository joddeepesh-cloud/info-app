export default function Usercard() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="bg-slate-800 rounded-xl p-6">

      <h2 className="text-2xl text-cyan-400 font-bold mb-4">
        👤 Profile
      </h2>

      <div className="flex flex-col items-center">

        <div className="w-24 h-24 rounded-full bg-cyan-500 flex items-center justify-center text-4xl font-bold text-white mb-4">
          {user?.username?.charAt(0).toUpperCase() || "G"}
        </div>

        <h2 className="text-2xl font-bold text-white">
          {user?.username || "Guest"}
        </h2>

        <p className="text-gray-400 mt-2 capitalize">
          Role : {user?.role || "Employee"}
        </p>

        <div className="mt-6 w-full">

          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Status</span>
            <span className="text-green-400">Online 🟢</span>
          </div>

          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Messages</span>
            <span className="text-cyan-400">128</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Department</span>
            <span className="text-yellow-400">Development</span>
          </div>

        </div>

      </div>

    </div>
  );
}