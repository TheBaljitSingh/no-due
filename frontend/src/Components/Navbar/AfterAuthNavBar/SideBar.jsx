import React, { useState } from "react";
import { SideBarCTC, SidebarFeatures } from "../../../utils/constants";
import NotificationPop from "../../../utils/AfterAuthUtils/SideBarUtils/NotificationPop";
import MobileOpenButton from "../../../utils/AfterAuthUtils/SideBarUtils/MobileOpenButton";
import { BadgeQuestionMark, BookOpen, Calculator, CircleUserRound, ClipboardClock, Clock, Contact, LayoutDashboard,  PanelLeft,  Upload, X } from "lucide-react";
import { Link } from "react-router-dom";

const SideBar = ({setIsLoggedIn , ActivePage, handleCollapse, isCollapsed}) => {
  //have to add  Tooltip for each icons, currently facing positions porblems
  const [open, setOpen] = useState(false);


  const handleIcons = (name , isActive) => {
    switch (name) {
      case "DashboardIcon" :
        return (
          <LayoutDashboard className={`w-5 h-5 ${isActive === 0 ? 'text-green-600' : 'text-gray-600'}`}/>
        )
      case "SubscriptionIcon" :
        return (
          <Calculator className={`w-5 h-5 ${isActive === 0 ? 'text-green-600' : 'text-gray-600'}`}/>
        )
      case "UploadIcon" : 
        return (
          // <div>hello</div>
          <Upload className={`w-5 h-5 ${isActive === 0 ? 'text-green-600' : 'text-gray-600'}`}/>
        )
      case "ReminderIcon" :
        return (
          <Clock className={`w-5 h-5 ${isActive === 0 ? 'text-green-600' : 'text-gray-600'}`}/>
        )
      case "HistoryIcon" :
        return (
          <ClipboardClock className={`w-5 h-5 ${isActive === 0 ? 'text-green-600' : 'text-gray-600'}`}/>
        )
      case "profileIcon" : 
        return (
          <CircleUserRound className={`w-5 h-5 ${isActive === 0 ? 'text-green-600' : 'text-gray-600'}`}/>
        )
      case "CustomerIcon" :
        return (
          <Contact className={`w-5 h-5 ${isActive === 0 ? 'text-green-600' : 'text-gray-600'}`}/>
        )
      case "BookIcon" : 
        return (
          <BookOpen className={`w-5 h-5 ${isActive === 0 ? 'text-green-600' : 'text-gray-600'}`}/>
        )
      case "HelpIcon": 
        return (
          <BadgeQuestionMark className={`w-5 h-5 ${isActive === 0 ? 'text-green-600' : 'text-gray-600'}`}/>
        )
    }
  }

  
  
  return (
<div className="min-h-screen">

  {/* Mobile open button */}
  <MobileOpenButton setOpen={setOpen} open={open}/>

  {/* Sidebar */}
  <aside
    className={`fixed md:sticky top-0 z-45 left-0 
      ${isCollapsed ? "w-14" : "w-64"} 
      h-screen transition-all bg-white border-r border-gray-200
      ${open ? "translate-x-0" : "-translate-x-full"}
      sm:translate-x-0
    `}
  >

    <div className="h-full px-3 py-5 overflow-y-auto">

      <div className="relative h-16 group flex items-center px-2 mb-6">

        {/* Logo (default or visible always based on isCollapsed) */}
        <img
          src={isCollapsed?`/src/assets/logo_cropped.png`:`/src/assets/logo.png`}
          alt="Nodue Logo"
          className={`
             absolute left-0 top-1/2 -translate-y-1/2
            ${
              isCollapsed
                ? "opacity-100 group-hover:hidden h-7 w-7"
                : "opacity-100 h-18"
            }
          `}
        />

        {/* Collapse Icon (hover or always visible based on isCollapsed) */}
        {/* on mobile, render cross, else render panelleft */}
        
          <X
          onClick={()=>setOpen(false)}
            className="
              md:hidden        
              block            
              absolute right-2 top-4
              w-7 h-7 text-gray-600 
              p-1 rounded-md hover:bg-gray-100 
              cursor-pointer transition z-50
            "
          />

        
        <PanelLeft
          onClick={handleCollapse}
          className={`hidden md:block
            h-8 w-8 p-1 text-gray-600 hover:bg-gray-100 rounded-md cursor-e-resize
             hover:shadow-sm transition-all
            absolute  top-1/2 -translate-y-1/2
            ${
              isCollapsed
                ? "opacity-0 group-hover:opacity-100 left-0"
                : "opacity-100 right-0"
            }
          `}
        />
        

      </div>


      {/* Sidebar Features */}
      <ul className="space-y-1 z-60 font-medium">
        {SidebarFeatures.map((features) => (
          <li key={features.name}>
            <Link
              to={features.path}
              className={`flex items-center ${isCollapsed?"justify-center":""} px-3 py-2.5 rounded-lg transition-all text-sm font-medium 
                ${ActivePage === features.path ? "bg-green-50 text-green-600" : "text-gray-700 hover:bg-gray-100"}`}
            >
              <span className="shrink-0">
                {ActivePage === features.path ? handleIcons(features.icon, 0) : handleIcons(features.icon, 1)}
              </span>

              {/* Hide text when collapsed */}
              {!isCollapsed && <span className="ml-3">{features.name}</span>}
            </Link>
          </li>
        ))}
      </ul>

      {/* CTC Section */}
      <ul className="pt-4 mt-4 space-y-1 font-medium border-t border-gray-200">
        {SideBarCTC.map((ctc) => (
          <li key={ctc.name}>
            <Link
              to={ctc.path}
              className={`flex items-center  ${isCollapsed?"justify-center":""} px-3 py-2.5 rounded-lg transition-all text-sm font-medium 
                ${ActivePage === ctc.path ? "bg-green-50 text-green-600" : "text-gray-700 hover:bg-gray-100"}`}
            >
              <span className="shrink-0">
                {ActivePage === ctc.path ? handleIcons(ctc.icon, 0) : handleIcons(ctc.icon, 1)}
              </span>

              {!isCollapsed && <span className="ml-3">{ctc.name}</span>}
            </Link>
          </li>
        ))}
      </ul>

      <div className={`absolute bottom-0 mb-3 w-full ${isCollapsed?"hidden":"block"}`}>
        <p className="text-sm text-gray-400">by~ insansa techknowledge</p>
      </div>
    </div>
  </aside>
</div>

  );
};

export default SideBar;