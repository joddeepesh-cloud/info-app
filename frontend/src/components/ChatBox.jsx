import { useState } from "react";
import { FaPaperPlane } from "react-icons/fa";

export default function ChatBox() {

  const [messages,setMessages]=useState([
    {
      sender:"Alice",
      text:"Hey JODDY 👋"
    },
    {
      sender:"You",
      text:"Hello!"
    }
  ])

  const [text,setText]=useState("");

  function sendMessage(){

    if(text==="") return;

    setMessages([
      ...messages,
      {
        sender:"You",
        text
      }
    ])

    setText("");

  }

  return(

    <div className="flex flex-col flex-1 bg-slate-950">

      <div className="bg-slate-900 p-5 border-b border-slate-700">

        <h2 className="text-2xl font-bold text-white">

          Alice

        </h2>

        <p className="text-green-400">
          Online
        </p>

      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-4">

        {messages.map((msg,index)=>(

          <div
            key={index}
            className={`max-w-sm rounded-xl p-4 ${
              msg.sender==="You"
              ?"bg-cyan-500 ml-auto"
              :"bg-slate-800"
            }`}
          >

            <h4 className="font-bold">

              {msg.sender}

            </h4>

            <p>

              {msg.text}

            </p>

          </div>

        ))}

      </div>

      <div className="flex p-5 bg-slate-900">

        <input

          value={text}

          onChange={(e)=>setText(e.target.value)}

          onKeyDown={(e)=>{

            if(e.key==="Enter") sendMessage();

          }}

          placeholder="Type a message..."

          className="flex-1 rounded-xl bg-slate-800 p-4 outline-none"

        />

        <button

          onClick={sendMessage}

          className="ml-3 bg-cyan-500 px-6 rounded-xl hover:bg-cyan-600"

        >

          <FaPaperPlane/>

        </button>

      </div>

    </div>

  )

}