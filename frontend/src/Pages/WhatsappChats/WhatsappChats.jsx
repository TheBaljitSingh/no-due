import React, { useEffect, useState } from "react";
import CustomerPicker from "./CustomerPicker";
import ChatHeader from "./chat/ChatHeader";
import ChatInput from "./chat/ChatInput"
import ChatMessages from "./chat/ChatMessage"
import EmptyChatState from "./chat/EmplyChatState"


export default function WhatsappChats() {
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleOnCustomerSelect = (customer) => {
    setCurrentCustomer(customer);
  };

  // Fetch chat history when customer changes
  useEffect(() => {
    if (!currentCustomer?._id) return;

    async function fetchChatHistory() {
      setLoading(true);
      try {
        // 🔗 API later
        // const res = await getWhatsappChatHistory(currentCustomer._id);
        // setMessages(res.data.messages);

        // Mock history for now
        setMessages([
          {
            id: 1,
            direction: "outgoing",
            text: "Hello! This is a reminder regarding your payment.",
            time: "10:30 AM",
          },
          {
            id: 2,
            direction: "incoming",
            text: "Yes, I will pay today.",
            time: "10:31 AM",
          },
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchChatHistory();
  }, [currentCustomer]);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const newMsg = {
      id: Date.now(),
      direction: "outgoing",
      text,
      time: new Date().toLocaleTimeString(),
    };

    // optimistic UI
    setMessages((prev) => [...prev, newMsg]);

    try {
      // 🔗 WhatsApp send API later
      // await sendWhatsappMessage({ to: currentCustomer.phone, text });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] grid grid-cols-12 gap-4 p-4">
      {/* LEFT: Customer Picker */}
      <div className="col-span-4 bg-white rounded-xl shadow-sm p-4">
        <CustomerPicker onSelect={handleOnCustomerSelect} />
      </div>

      {/* RIGHT: Chat Area */}
      <div className="col-span-8 rounded-xl shadow-sm flex flex-col bg-white h-2/4">
        {!currentCustomer ? (
          <EmptyChatState />
        ) : (
          <>
            <ChatHeader customer={currentCustomer} />
            <ChatMessages messages={messages} loading={loading} />
            <ChatInput onSend={handleSendMessage} />
          </>
        )}
      </div>
    </div>
  );
}
