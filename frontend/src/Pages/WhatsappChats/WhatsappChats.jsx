import React, { useEffect, useState, useRef } from "react";
import CustomerPicker from "./CustomerPicker";
import { getAllcustomers } from "../../utils/service/customerService";
import ChatHeader from "./chat/ChatHeader";
import ChatInput from "./chat/ChatInput"
import ChatMessages from "./chat/ChatMessage"
import EmptyChatState from "./chat/EmplyChatState"
import { io } from "socket.io-client";
import {whatsappReply, getChatHistory} from "../../utils/service/whatsappService.js"

export default function WhatsappChats() {
  const socketRef = useRef(null); //one time
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleOnCustomerSelect = (customer) => {
    if(currentCustomer && customer._id===currentCustomer._id) return;
    setCurrentCustomer(customer);
    setMessages([]);
    //remove the existing room, and join new room
    //also make sure changed customer history is being loaded
  };

  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await getAllcustomers();

        const customerList = data?.data?.customers || [];
        setCustomers(customerList);
      } catch (error) {
        console.error("Failed to load customers", error);
        setCustomers([]);
      }
    }
    loadCustomers();
  }, []);



  // Fetch chat history when customer changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !currentCustomer?.mobile || !currentCustomer._id) {
      console.log("returing");
      return;
    };

    socket.emit("join_customer_chat", { //one time
      customerId: `91${currentCustomer.mobile}`
    });

    fetchChatHistory(`91${currentCustomer.mobile}`);

    return () => {
      socket.emit("leave_customer_chat", {
        customerId: `91${currentCustomer.mobile}`
      });
    }

  }, [currentCustomer]);

  const handleSendMessage = async (text) => {
    if (!text.trim() || !currentCustomer) return;

    const newMsg = {
      customerId: currentCustomer.mobile,
      direction: "OUTBOUND",
      from: "owner",
      text,
      timestamp: new Date(),
    };

    // optimistic UI
    setMessages((prev) => [...prev, newMsg]);

    try {
      //api later
      const payload = {};
      payload.to=`91${currentCustomer.mobile}`;
      //later add context reply
      payload.text=text;
      console.log(payload);
      const replyRes = await whatsappReply(payload);
      console.log(replyRes);

    } catch (err) {
      console.error(err);
    }
  };


  async function fetchChatHistory(customerId) {
    //customerId:918709548015
    console.log("fetching history");
    setLoading(true);
    try {
      //api later

      const res = await getChatHistory(customerId);
      console.log(res.data);

      // Mock history for now
      // Mock history for now
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }



  useEffect(() => {
    socketRef.current = io("http://localhost:3000", { withCredentials: true }); //will not change on refresh
    const socket = socketRef.current;
    //make sure only connect if it is authenticated

    socket.on("connect", () => {
      console.log("connected", socket.id);
    })

    socket.on("welcome", (d) => {
      console.log("Welcome:", d);
    })

    socket.on("new_message", (msg) => {
      console.log(msg);
      setMessages((prev) => [...prev, {id:msg.messageId, text:msg.text, timestamp: msg.timestamp}]);
    });

    return () => {
      socket.disconnect();
    }

  }, []);


  return (
    <div className="h-[calc(100vh-64px)] grid grid-cols-12 gap-4 ">
      {/* LEFT: Customer Picker */}
      <div className="col-span-4 bg-white rounded-xl shadow-sm p-4">
        <CustomerPicker items={customers} onSelect={handleOnCustomerSelect} selected={currentCustomer} />
      </div>

 {/* RIGHT: Chat Area */}
<div
  className=" fixed right-24 w-1/2 h-[calc(100vh-8.5rem)] rounded-xl shadow-sm flex flex-col bg-white  ml-auto "
>
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
