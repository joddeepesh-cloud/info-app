export default function Navbar() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="bg-slate-800 rounded-xl p-5 flex justify-between items-center">

      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome 👋
        </h1>

        <p className="text-gray-400">
          Secure Enterprise Communication
        </p>
      </div>

      <div className="text-right">

        <h2 className="text-cyan-400 text-xl font-bold">
          {user?.username || "Guest"}
        </h2>

        <p className="text-green-400">
          Online 🟢
        </p>

      </div>

    </div>
  );
}