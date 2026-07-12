export default function EmployeeCard({ user,onClick }) {
  const color =
    user.status === "Online"
      ? "text-green-400"
      : user.status === "Busy"
      ? "text-yellow-400"
      : "text-gray-400";

  return (
    <div

onClick={onClick} className="bg-slate-800 rounded-xl p-5 hover:bg-slate-700 transition cursor-pointer">

      <div className="flex justify-between">

        <div>

          <h2 className="text-xl font-bold text-white">
            {user.fullName || user.username}
          </h2>

          <p className="text-gray-400">
            {user.designation}
          </p>

          <p className="text-gray-500 text-sm">
            {user.department}
          </p>

        </div>

        <div className={color}>
          ● {user.status}
        </div>

      </div>

    </div>
  );
}