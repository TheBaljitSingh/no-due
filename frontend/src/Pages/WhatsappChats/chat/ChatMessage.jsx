import { useEffect } from "react";

function ChatMessages({ messages, loading }) {



  
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
        Loading chats...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3  bg-[url(https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png)] ">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${
            msg.direction === "OUTBOUND"
              ? "ml-auto bg-green-600/90 text-white"
              : "mr-auto bg-white border"
          }`}
        >
          <div>{msg.text}</div>
          <div className="text-[10px] opacity-70 mt-1 text-right">
            {new Date(msg?.timestamp).toLocaleString("en-IN", {  dateStyle: "medium",  timeStyle: "short",})}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChatMessages;