import React, { useEffect, useState, useRef } from "react";
import CustomerPicker from "./CustomerPicker";
import { getAllcustomers } from "../../utils/service/customerService";
import {getAllconversations} from "../../utils/service/whatsappService.js"
import ChatHeader from "./chat/ChatHeader";
import ChatInput from "./chat/ChatInput"
import ChatMessages from "./chat/ChatMessage"
import EmptyChatState from "./chat/EmplyChatState"
import { io } from "socket.io-client";
import {whatsappReply, getChatHistory} from "../../utils/service/whatsappService.js"
import {useAuth} from ".././../context/AuthContext.jsx"

export default function WhatsappChats() {
  const socketRef = useRef(null); //one time
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const CHAT_UI = {  OPEN: "open", MINIMIZED: "minimized", CLOSED: "closed",};
  const [chatUI, setChatUI] = useState(CHAT_UI.CLOSED);
  const {user} = useAuth();

  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await getAllconversations();
        console.log(data);

        const customerList = data?.data || [];
        console.log(customerList);
        setCustomers(customerList);
        
        
      } catch (error) {
        console.error("Failed to load customers", error);
        setCustomers([]);
      }
    }
    loadCustomers();
  }, []);


  useEffect(()=>{
    console.log(customers);
    
  },[]);


  // Fetch chat history when customer changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !currentCustomer?.mobile || !currentCustomer._id) {
      console.log("returing");
      return;
    };

    socket.emit("join_customer_chat", { //one time
      customerId: currentCustomer.mobile
    });

    fetchChatHistory(`${currentCustomer.mobile}`);

    return () => {
      socket.emit("leave_customer_chat", {
        customerId: currentCustomer.mobile
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
      payload.to=currentCustomer.mobile;
      //later add context reply
      payload.text=text;
      console.log(payload);
      const replyRes = await whatsappReply(payload);
      console.log("replyRes",replyRes);

    } catch (err) {
      console.error(err);
    }
  };



  async function fetchChatHistory(mobile) {
    //customerId:918709548015
    console.log("fetching history");
    setLoading(true);
    try {
      //api later

      const res = await getChatHistory(mobile);
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

    socket.emit("join_user", {userId:user?._id}) // it will join global user room

    socket.on("new_message", (msg) => {
      // console.log("new_message",msg);
      setMessages((prev) => [...prev, {id:msg.messageId, text:msg.text, timestamp: msg.timestamp}]);
    });

    socket.on("new_message_preview",(data)=>{
      //handing preview messages
      // console.log("new_message_preview", data)
      console.log(currentCustomer, data);


   setCustomers(prev =>
    prev.map(c =>
      c.mobile === data.mobile && (
        !currentCustomer || currentCustomer.mobile !== c.mobile
      )
        ? {
            ...c,
            lastMessage: data.text,
            unreadCount: (c.unreadCount || 0) + 1,
            updatedAt: new Date().toISOString()
          }
        : c
    )
  );



  
    })

    

    return () => {
      socket.disconnect();
    }

  }, []);


function markAsRead(mobile){
  //._id
  //here customerId is mobile
  const socket = socketRef.current;

  socket.emit("mark_read", mobile);

  console.log("marked read")

  setCustomers(prev=> prev && prev.map(c=>c.mobile===mobile?{...c, unreadCount:0}:c));
}

  const handleOnCustomerSelect = (customer) => {
  if (currentCustomer && customer._id === currentCustomer._id && chatUI==='open') return;
  setCurrentCustomer(customer);
  console.log(customer)
  setMessages([]);
  
  setChatUI(CHAT_UI.OPEN);
  console.log("printing customer", customer)
  markAsRead(customer?.mobile);
};



  return (
    <div className="h-[calc(100vh-64px)] grid grid-cols-12 bg-gray-300/40 rounded-2xl gap-9 fixed">
      {/* LEFT: Customer Picker */}
      <div className="col-span-4 bg-white rounded-xl shadow-sm p-4 m-2">
        <CustomerPicker items={customers} onSelect={handleOnCustomerSelect} selected={currentCustomer} />
      </div>

 {/* RIGHT: Chat Area */}
    {chatUI !== CHAT_UI.CLOSED && (
      <div
        className={`
          fixed right-8 bottom-6 rounded-xl shadow-lg flex flex-col
          transition-all duration-300 ease-in-out
          ${chatUI === CHAT_UI.MINIMIZED
            ? "w-80 h-14"
            : "w-1/2 h-[calc(100vh-8.5rem)]"}
        `}
      >
        <ChatHeader
          customer={currentCustomer}
          onClose={() => setChatUI(CHAT_UI.CLOSED)}
          onMinimize={() => setChatUI(CHAT_UI.MINIMIZED)}
          onExpand={()=>setChatUI(CHAT_UI.OPEN)}
          isMinimized={chatUI === CHAT_UI.MINIMIZED}
        />

        {chatUI === CHAT_UI.OPEN && (
          <>
            <ChatMessages messages={messages} loading={loading} />
            <ChatInput onSend={handleSendMessage} />
          </>
        )}
      </div>
    )}


    </div>
  );
}
