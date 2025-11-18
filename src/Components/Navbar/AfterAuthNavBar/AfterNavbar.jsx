import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, X } from "lucide-react";
import { notificationData } from "../../../utils/constants";

const AfterNavbar = ({ setIsLoggedIn, profileRef, closeProfileDropdown , isProfileDropdownOpen, setIsProfileDropdownOpen}) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(notificationData || []);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items]
  );

  useEffect(() => {
    const onDown = (e) => {
      if (!open) return;
      const el = dropdownRef.current;
      const btn = buttonRef.current;
      if (el && !el.contains(e.target) && btn && !btn.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markAllRead = () =>
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  const user = {name:"tanmay shah", email:'tanmay@example.com'};

  return (
    <nav className="hidden md:block sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-4 flex items-center justify-between">
        {/* Welcome */}
        <h1 className="text-[17px] sm:text-lg font-semibold tracking-tight text-gray-800">
          Welcome, <span className="text-gray-900">Tanmay Seth</span> 👋
        </h1>

        {/* Right cluster */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setOpen((s) => !s)}
              aria-expanded={open}
              aria-controls="notif-popover"
              className="relative inline-flex items-center justify-center rounded-full p-2 ring-1 ring-gray-200 bg-white hover:bg-gray-50 transition shadow-sm focus:outline-none"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {open && (
              <div
                id="notif-popover"
                ref={dropdownRef}
                className="absolute right-0 mt-3 w-[22rem] origin-top-right"
              >
                {/* Arrow */}
                <div className="flex justify-end pr-6">
                  <div className="h-3 w-3 rotate-45 bg-white border border-gray-200 -mb-2 mr-2"></div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white shadow-xl ring-1 ring-black/5 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-gray-50/80">
                    <div className="text-sm font-semibold text-gray-800">
                      Notifications
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={markAllRead}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 ring-1 ring-gray-200"
                      >
                        <CheckCheck className="w-4 h-4" />
                        Mark all read
                      </button>
                      <button
                        onClick={() => setOpen(false)}
                        className="rounded-md p-1 text-gray-500 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                        aria-label="Close notifications"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* List */}
                  <div className="max-h-72 overflow-y-auto">
                    {items.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                        You’re all caught up 🎉
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {items.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition"
                          >
                            <div className="relative">
                              <img
                                src={item.img}
                                alt={item.name}
                                className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200"
                              />
                              {!item.read && (
                                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold text-gray-900">
                                  {item.name}
                                </span>
                                <span className="text-gray-600">: {item.msg}</span>
                              </p>
                              <div className="mt-1 text-xs text-gray-500">
                                {item.time}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* <button
                    className="w-full text-center px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-50 transition"
                    onClick={() => {
                      setOpen(false);
                    }}
                  >
                    View all notifications
                  </button> */}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <span className="h-6 w-px bg-gray-200" aria-hidden />

          {/* Profile / Logout */}
          {/* <div className="bg-amber-400"> */}

          
        <div
          ref={profileRef}
          onClick={() => setIsProfileDropdownOpen(prev => !prev)}
          className="group hover:cursor-pointer inline-flex items-center 
                    rounded-full p-1 bg-white hover:bg-gray-50 
                    ring-1 ring-gray-200 transition focus:outline-none 
                    focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <img
            className="w-9 h-9 rounded-full ring-1 ring-gray-300 shadow-sm 
                      object-cover group-hover:scale-[1.03] transition-transform"
            src="https://randomuser.me/api/portraits/men/45.jpg"
            alt="Profile"
          />
        </div>

         {isProfileDropdownOpen && (
        <div
          className="absolute right-2 top-full mt-2 w-48 bg-white 
                    rounded-xl shadow-xl py-1 z-50 border border-gray-200"
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">
              {user.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user.email}
            </p>
          </div>

          <Link
            to="/nodue/user-profile"
            // onClick={()=>closeProfileDropdown()}
            className="flex items-center px-4 py-2 font-medium text-sm text-gray-700 
              hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            My Profile
          </Link>

          <button
            onClick={()=>console.log("logout clicked") }
            className="flex items-center w-full font-medium px-4 py-2 text-sm text-gray-700 
                      hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
        )}

        </div>
        {/* </div> */}
      </div>
      {/* Click outside to close dropdown */}
        {/* {isProfileDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={closeProfileDropdown}
        />
      )} */}
    </nav>
  );
};

export default AfterNavbar;
