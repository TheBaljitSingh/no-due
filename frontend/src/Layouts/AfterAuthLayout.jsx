import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import SideBar from "../Components/Navbar/AfterAuthNavBar/SideBar";
import AfterNavbar from "../Components/Navbar/AfterAuthNavBar/AfterNavbar";
//

const AfterAuthLayout = () => {
  const location = useLocation();
  const [ActivePage, setActivePage] = useState("customer-master");
  const profileRef = useRef(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);


  useEffect(() => {
    const page = location.pathname.split("/")[2];
    setActivePage(page);
  }, [location.pathname]);


   const closeProfileDropdown = () => {
    setIsProfileDropdownOpen(false);
  };

  const handleCollapse = ()=>{
    setIsCollapsed(prev=>{
      const newState = !prev;
      localStorage.setItem('sidebar-collapsed', newState);
      return newState;
    });
  }


  useEffect(() => {
  const handleMouseClick = (e) => {
    if (profileRef.current && !profileRef.current.contains(e.target)) {
      // setIsProfileDropdownOpen(false);
      closeProfileDropdown();
    }
  };

  window.addEventListener("mousedown", handleMouseClick, false); //event propogation

  return () => {
    window.removeEventListener("mousedown", handleMouseClick);
  };
}, []);

useEffect(()=>{
  if(window.innerWidth<768){
    //on mobile make it false
    setIsCollapsed(false);
  }
})

useLayoutEffect(()=>{
  
    const isSidebarCollapsed = localStorage.getItem('sidebar-collapsed');
    if(isSidebarCollapsed!==null && window.innerWidth>425){
      setIsCollapsed(isSidebarCollapsed==='true') // using according to the localstorage
    }
  
})



  return (
   <div className="flex h-screen overflow-hidden">
    {/* Sidebar wrapper: fixed height, not scrollable */}
    <div
      className={`
        
        md:w-[${isCollapsed ? "60px" : "clamp(100px,20vw,200px)"}] top-0 z-40 transition-all h-screen
        sticky 
        bg-white
      `}
    >
      {/* Sidebar inner scroll area: overflow-y-auto */}

      <div className="h-full sidebar-scroll overflow-visible">
        <SideBar
          ActivePage={ActivePage}
          handleCollapse={handleCollapse}
          isCollapsed={isCollapsed}
        />
      </div>
    </div>

    {/* MAIN CONTENT AREA (scrollable) */}
    <div className="flex flex-col flex-1 overflow-y-auto sidebar-scroll min-w-0">

      {/* Navbar */}
      <header className="sticky top-0 z-30 mt-10 md:mt-0 bg-white shadow-sm ">
        <AfterNavbar
          profileRef={profileRef}
          isProfileDropdownOpen={isProfileDropdownOpen}
          setIsProfileDropdownOpen={setIsProfileDropdownOpen}
        />
      </header>

      {/* Page Content */}
      <main className="p-4 md:p-8 w-full">
        <div className="max-w-7xl mx-auto">
          <Outlet/>
        </div>
      </main>
    </div>
  </div>
  );
};

export default AfterAuthLayout;
