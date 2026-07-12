export default function ProfileDrawer({ user, onClose, onMessage }) {

  if (!user) return null;

  return (
    <div className="fixed top-0 right-0 h-screen w-[420px] bg-slate-900 border-l border-slate-700 p-8 shadow-2xl">

      <button
        onClick={onClose}
        className="text-red-400 float-right"
      >
        ✕
      </button>

      <div className="mt-8">

        <div className="w-24 h-24 rounded-full bg-cyan-500 flex items-center justify-center text-5xl font-bold mx-auto">

          {(user.fullName || user.username)[0]}

        </div>

        <h1 className="text-3xl text-center mt-5 text-white font-bold">

          {user.fullName || user.username}

        </h1>

        <p className="text-center text-cyan-400">

          {user.designation}

        </p>

        <hr className="my-6 border-slate-700"/>

        <p className="text-gray-300">
          📧 {user.email || "Not Provided"}
        </p>

        <p className="text-gray-300 mt-3">
          📱 {user.phone || "Not Provided"}
        </p>

        <p className="text-gray-300 mt-3">
          🏢 {user.department}
        </p>

        <p className="text-gray-300 mt-3">
          🆔 {user.employeeId}
        </p>

        <p className="text-gray-300 mt-3">
          🟢 {user.status}
        </p>

        <p className="text-gray-300 mt-6">

          {user.bio || "No Bio"}

        </p>

        <button

          onClick={() => onMessage(user)}

          className="w-full mt-8 bg-cyan-500 rounded-xl p-4 font-bold"

        >

          Message Employee

        </button>

      </div>

    </div>
  );

}