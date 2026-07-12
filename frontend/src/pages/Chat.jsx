import { useEffect, useRef , useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useLocation } from "react-router-dom";
import ProfileDrawer from "../components/dashboard/ProfileDrawer";

const socket = io("http://localhost:5050");

export default function Chat() {
  const location = useLocation();

  const loggedUser = JSON.parse(localStorage.getItem("user"));

if (!loggedUser) {
  return <h1 className="text-white p-10">Please login again.</h1>;
}

if (!location.state || !location.state.user) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-red-400">
          No chat selected
        </h1>

        <p className="text-gray-400 mt-3">
          Go back to the employee list and select someone to chat with.
        </p>
      </div>
    </div>
  );
}

const sender = loggedUser.username;
const selectedUser = location.state.user;
const receiver = selectedUser.username;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const typingTimeout = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadMessages();

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on("user-typing", (data) => {
  if (data.sender !== sender) {
    setTyping(true);
  }
});

socket.on("user-stop-typing", () => {
  setTyping(false);
});

    return () => {
  socket.off("receive-message");
  socket.off("user-typing");
  socket.off("user-stop-typing");
};
  }, []);

  useEffect(() => {
  bottomRef.current?.scrollIntoView({
    behavior: "smooth",
  });
}, [messages]);

  const loadMessages = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5050/chat/${sender}/${receiver}`
      );

      setMessages(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const newMessage = {
      sender,
      receiver,
      text: message,
    };

    try {
      await axios.post(
        "http://localhost:5050/chat/send",
        newMessage
      );

      socket.emit("send-message", newMessage);

      setMessage("");
      socket.emit("stop-typing");

      loadMessages();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">

      <div className="flex justify-between items-center mb-6">

        <div>
          <h1 className="text-3xl font-bold text-cyan-400">
            Enterprise Chat
          </h1>

          <p className="text-gray-400 mt-1">
            Chatting with{" "}
            <span className="text-white font-semibold">
              {selectedUser.fullName || selectedUser.username}
            </span>
          </p>
        </div>

        <button
          onClick={() => setDrawerOpen(true)}
          className="bg-slate-700 hover:bg-slate-600 px-5 py-2 rounded-lg"
        >
          View Profile
        </button>

      </div>

      <div className="bg-slate-800 rounded-xl h-[500px] overflow-y-auto p-5">

        {messages.length === 0 ? (
          <p className="text-center text-gray-400 mt-20">
            No messages yet.
          </p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`my-3 ${
                msg.sender === sender
                  ? "text-right"
                  : "text-left"
              }`}
            >
                <div ref={bottomRef}></div>

              <div
                className={`inline-block max-w-[65%] px-4 py-3 rounded-2xl ${
                  msg.sender === sender
                    ? "bg-cyan-500"
                    : "bg-slate-700"
                }`}
              >
                <div className="font-bold text-sm mb-1">
                  {msg.sender}
                </div>

                <div>{msg.text}</div>
                <div className="text-xs mt-2 opacity-70">
  {msg.createdAt
    ? new Date(msg.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Now"}
</div>
              </div>
            </div>
          ))
        )}

      </div>

      <div className="flex gap-4 mt-5">

        {typing && (
  <p className="text-sm text-gray-400 mt-3">
    {selectedUser.fullName || selectedUser.username} is typing...
  </p>
)}

        <input
          type="text"
          value={message}
         onChange={(e) => {
  setMessage(e.target.value);

  socket.emit("typing", {
    sender,
    receiver,
  });

  clearTimeout(typingTimeout.current);

  typingTimeout.current = setTimeout(() => {
    socket.emit("stop-typing");
  }, 1500);
}}
        />

        <button
          onClick={sendMessage}
          className="bg-cyan-500 hover:bg-cyan-600 px-8 rounded-xl font-semibold"
        >
          Send
        </button>

      </div>

      <ProfileDrawer
        user={selectedUser}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

    </div>
  );
}