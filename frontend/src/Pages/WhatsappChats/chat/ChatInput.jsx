import { useState } from "react";
function ChatInput({ onSend }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    onSend(text);
    setText("");
  };

  return (
    <div className=" p-3 flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message"
        className="flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-green-500"
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />
      <button
        onClick={handleSend}
        className="bg-green-600 text-white px-4 rounded-full"
      >
        Send
      </button>
    </div>
  );
}

export default ChatInput;