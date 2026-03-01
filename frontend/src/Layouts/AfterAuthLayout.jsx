import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import SideBar from "../Components/Navbar/AfterAuthNavBar/SideBar";
import AfterNavbar from "../Components/Navbar/AfterAuthNavBar/AfterNavbar";
import { socket } from "../socket/index.js";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import WhatsAppSetupOverlay from "../Pages/AfterAuthPages/WhatsAppSetupPage";
//

// Routes that require WhatsApp to be connected
const WHATSAPP_GATED_ROUTES = [
  "reminder-management",
  "reminder-templates",
  "reminder-history",
  "whatsapp-chat",
];

const AfterAuthLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ActivePage, setActivePage] = useState("customer-master");
  const profileRef = useRef(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Modal state
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isRouteBlocked, setIsRouteBlocked] = useState(false);
  const hasShownInitialModal = useRef(false);

  const isWhatsAppConnected = user?.whatsapp?.status === "connected";

  // Show modal on first load if WhatsApp not connected
  useEffect(() => {
    if (!isWhatsAppConnected && !hasShownInitialModal.current) {
      hasShownInitialModal.current = true;
      setShowSetupModal(true);
      setIsRouteBlocked(false);
    }
  }, [isWhatsAppConnected]);

  // Watch route changes — block reminder pages if WhatsApp not connected
  useEffect(() => {
    const page = location.pathname.split("/")[2];
    setActivePage(page);

    if (!isWhatsAppConnected && WHATSAPP_GATED_ROUTES.includes(page)) {
      setShowSetupModal(true);
      setIsRouteBlocked(true);
    }
  }, [location.pathname, isWhatsAppConnected]);

  // Close modal — if route was blocked, navigate away from the gated page
  const handleCloseModal = () => {
    setShowSetupModal(false);

    if (isRouteBlocked) {
      setIsRouteBlocked(false);
      navigate("/nodue/customer-master", { replace: true });
    }
  };

  // Auto-hide modal when WhatsApp gets connected
  useEffect(() => {
    if (isWhatsAppConnected) {
      setShowSetupModal(false);
      setIsRouteBlocked(false);
    }
  }, [isWhatsAppConnected]);

  const closeProfileDropdown = () => {
    setIsProfileDropdownOpen(false);
  };

  const handleCollapse = () => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem("sidebar-collapsed", newState);
      return newState;
    });
  };

  useEffect(() => {
    const handleMouseClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        closeProfileDropdown();
      }
    };

    window.addEventListener("mousedown", handleMouseClick, false);

    return () => {
      window.removeEventListener("mousedown", handleMouseClick);
    };
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsCollapsed(false);
    }
  });

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleFeedbackUpdate = (data) => {
      console.log("[Global Socket] Feedback update received:", data);
      toast.info(
        `Feedback from ${data.customerName || data.mobile}: "${data.feedback}"`,
        {
          toastId: data.messageId,
          containerId: "stackbar",
          position: "bottom-right",
          autoClose: 5000,
          className:
            "bg-white border-t-4 border-green-500 shadow-2xl rounded-none md:rounded-lg min-w-[320px] md:min-w-[450px]",
          bodyClassName: "text-gray-800 font-medium",
          progressClassName: "bg-green-500",
        },
      );
    };

    socket.on("feedback_updated", handleFeedbackUpdate);

    return () => {
      socket.off("feedback_updated", handleFeedbackUpdate);
    };
  }, []);

  useLayoutEffect(() => {
    const isSidebarCollapsed = localStorage.getItem("sidebar-collapsed");
    if (isSidebarCollapsed !== null && window.innerWidth > 425) {
      setIsCollapsed(isSidebarCollapsed === "true");
    }
  });

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="h-full sidebar-scroll overflow-visible z-50 ">
        <SideBar
          ActivePage={ActivePage}
          handleCollapse={handleCollapse}
          isCollapsed={isCollapsed}
        />
      </div>

      {/* MAIN CONTENT AREA */}
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
            <Outlet />
          </div>
        </main>
      </div>

      {/* WhatsApp Setup Modal — dismissable, route-gated */}
      {showSetupModal && (
        <WhatsAppSetupOverlay
          onClose={handleCloseModal}
          isRouteBlocked={isRouteBlocked}
        />
      )}
    </div>
  );
};

export default AfterAuthLayout;
