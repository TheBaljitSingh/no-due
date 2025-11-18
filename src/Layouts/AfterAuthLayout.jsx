import React, { useEffect, useState, useRef } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import SideBar from "../Components/Navbar/AfterAuthNavBar/SideBar";
import AfterNavbar from "../Components/Navbar/AfterAuthNavBar/AfterNavbar";

const AfterAuthLayout = ({ setIsLoggedIn, isLoggedIn }) => {
  // if (!isLoggedIn) return <Navigate to="/" replace />;

  const location = useLocation();
  const [ActivePage, setActivePage] = useState("customer-master");
  const profileRef = useRef(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);



  useEffect(() => {
    const page = location.pathname.split("/")[2];
    setActivePage(page);
  }, [location.pathname]);


   const closeProfileDropdown = () => {
    setIsProfileDropdownOpen(false);
  };
  useEffect(() => {
  const handleMouseClick = (e) => {
    if (profileRef.current && !profileRef.current.contains(e.target)) {
      // setIsProfileDropdownOpen(false);
      closeProfileDropdown();
    }
  };

  window.addEventListener("mousedown", handleMouseClick);

  return () => {
    window.removeEventListener("mousedown", handleMouseClick);
  };
}, []);

  return (
    <div className="min-h-screen ">
      {/* Sidebar */}
      <div className="fixed h-full z-40">
        <SideBar setIsLoggedIn={setIsLoggedIn} ActivePage={ActivePage} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 sm:ml-64 sm:mt-20">
        
        <header className="fixed top-0 left-64 right-0 z-30 bg-white shadow-sm border-b border-gray-200">
          <AfterNavbar setIsLoggedIn={setIsLoggedIn} profileRef={profileRef} isProfileDropdownOpen={isProfileDropdownOpen} setIsProfileDropdownOpen={setIsProfileDropdownOpen} />
        </header>

        {/* Page Content */}
        <main className="pt-20 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet context={{ isLoggedIn, setIsLoggedIn }} />
        </main>
      </div>
    </div>
  );
};

export default AfterAuthLayout;
