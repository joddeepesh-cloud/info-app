export default function ConversationList({
  users,
  selectedUser,
  onSelect,
}) {
  return (
    <div className="w-72 bg-slate-900 border-r border-slate-700 overflow-y-auto">

      <h2 className="text-xl font-bold text-cyan-400 p-5">
        Conversations
      </h2>

      {users.map((user) => (
        <div
          key={user._id}
          onClick={() => onSelect(user)}
          className={`p-4 cursor-pointer transition hover:bg-slate-800 ${
            selectedUser?._id === user._id
              ? "bg-slate-800"
              : ""
          }`}
        >
          <div className="flex justify-between">

            <span className="font-semibold text-white">
              {user.fullName || user.username}
            </span>

            <span
              className={`text-xs ${
                user.status === "Online"
                  ? "text-green-400"
                  : user.status === "Busy"
                  ? "text-yellow-400"
                  : "text-gray-400"
              }`}
            >
              ●
            </span>

          </div>

          <p className="text-sm text-gray-400">
            {user.designation}
          </p>

        </div>
      ))}

    </div>
  );
}