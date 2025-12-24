function ChatMessages({ messages, loading }) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
        Loading chats...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 ">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${
            msg.direction === "outgoing"
              ? "ml-auto bg-green-600 text-white"
              : "mr-auto bg-white border"
          }`}
        >
          <div>{msg.text}</div>
          <div className="text-[10px] opacity-70 mt-1 text-right">
            {msg.time}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChatMessages;