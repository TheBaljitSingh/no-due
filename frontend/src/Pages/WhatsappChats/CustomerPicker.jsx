import React, { useEffect, useRef, useState, useMemo } from "react";
import { ChevronDown, Plus, Search, UserRound } from "lucide-react";


function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}



function CustomerPicker({ items = [], onSelect, selected }) {
  //item shoud contains the lastmessage, unreadcount, timestamp
  const [searchText, setSearchText] = useState("");


  const filteredCustomer = useMemo(() => {
    if (!searchText) return items;
    return items.filter(it =>
      it?.customerId?.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [items, searchText]);



  return (
    <div className="w-72 h-full flex flex-col overflow-scroll">

     <div className="sticky top-0 z-10 p-2">
    <div className="relative flex items-center">
      <Search className="absolute left-3 text-gray-400 w-4 h-4" />

      <input
        type="text"
        value={searchText}
        placeholder="Search customers..."
        className="w-full rounded-lg pl-10 pr-4 py-2.5 text-sm shadow-sm
          focus:outline-none focus:ring-2 focus:ring-gray-300"
        onChange={(e) => setSearchText(e.target.value)}
      />
    </div>
  </div>


      <div className="flex-1 overflow-y-auto">
        {filteredCustomer.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No customers found
          </div>
        ) : (
          <ul className="py-1 space-y-0.5">
            {filteredCustomer.map((it, idx) => (
              <li key={idx} >
            <button
              onClick={() => onSelect(it)}
              className={`flex w-full items-center px-4 py-3 gap-3
                hover:bg-gray-100 transition rounded-2xl outline-none
                ${selected?._id === it._id ? "bg-gray-100" : ""}`}
            >
              {/* Avatar */}
              <img
                className="h-10 w-10 rounded-full shrink-0"
                src={
                  it?.customerId?.gender === "male"
                    ? "https://img.freepik.com/free-vector/smiling-man-with-glasses_1308-174409.jpg"
                    : "https://img.freepik.com/free-vector/smiling-woman-with-long-brown-hair_1308-175662.jpg"
                }
                alt="avatar"
              />

              {/* Name + Preview */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-medium truncate">{it?.customerId?.name || it?.mobile} </span>

                  <span className="text-xs text-gray-400">
                    {formatAMPM(new Date(it.lastMessageAt || Date.now()))}
                  </span>
                </div>

                <div className="flex justify-between items-center mt-1">
                  {/* Message preview */}
                  <span
                    className={`text-sm truncate ${
                      it.unreadCount > 0
                        ? "font-medium text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    {it.lastMessage || "No messages yet"}
                    {/* have to start here last message thing */}
                  </span>

                  {/* Unread badge */}
                  {it.unreadCount > 0 && (
                    <span className="ml-2 flex items-center justify-center min-w-[20px] h-5 px-1
                      text-xs font-semibold text-white bg-green-500 rounded-full">
                      {it.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>

              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


export default CustomerPicker;