import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:5050");

export default function Chat() {
  const sender = "JODDY";
  const receiver = "Alice";

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    loadMessages();

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off("receive-message");
  }, []);

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
      await axios.post("http://localhost:5050/chat/send", newMessage);

      socket.emit("send-message", newMessage);

      setMessage("");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">

      <h1 className="text-3xl font-bold text-cyan-400 mb-6">
        Enterprise Chat
      </h1>

      <div className="bg-slate-800 rounded-xl h-[500px] p-5 overflow-y-auto">

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`my-3 ${
              msg.sender === sender ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block px-4 py-3 rounded-xl ${
                msg.sender === sender
                  ? "bg-cyan-500"
                  : "bg-slate-700"
              }`}
            >
              <b>{msg.sender}</b>

              <br />

              {msg.text}
            </div>
          </div>
        ))}

      </div>

      <div className="flex gap-4 mt-5">

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type message..."
          className="flex-1 bg-slate-700 rounded-xl p-4 outline-none"
        />

        <button
          onClick={sendMessage}
          className="bg-cyan-500 px-8 rounded-xl hover:bg-cyan-600"
        >
          Send
        </button>

      </div>

    </div>
  );
}