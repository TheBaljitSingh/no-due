import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SideBarCTC, SidebarFeatures } from "../../../utils/constants";
import NotificationPop from "../../../utils/AfterAuthUtils/SideBarUtils/NotificationPop";
import MobileOpenButton from "../../../utils/AfterAuthUtils/SideBarUtils/MobileOpenButton";
import {
  BadgeQuestionMark,
  BookOpen,
  Calculator,
  ChevronDown,
  CircleUserRound,
  ClipboardClock,
  Clock,
  Contact,
  LayoutDashboard,
  Logs,
  PanelLeft,
  Upload,
  X,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { GrTransaction } from "react-icons/gr";
import { Link, useNavigate } from "react-router-dom";

const ICON_MAP = {
  DashboardIcon: LayoutDashboard,
  SubscriptionIcon: Calculator,
  UploadIcon: Upload,
  ReminderIcon: Clock,
  HistoryIcon: ClipboardClock,
  profileIcon: CircleUserRound,
  CustomerIcon: Contact,
  BookIcon: BookOpen,
  HelpIcon: BadgeQuestionMark,
  ClipboardClock: ClipboardClock,
  FaWhatsapp: FaWhatsapp,
  GrTransaction: GrTransaction,
  logs: Logs,
};

const SideBar = ({ ActivePage, handleCollapse, isCollapsed }) => {
  const [open, setOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const navigate = useNavigate();

  const handleIcons = (name, isActive) => {
    const Icon = ICON_MAP[name];
    if (!Icon) return null;
    return (
      <Icon
        className={`w-4 h-4 transition-colors duration-150 ${
          isActive === 0 ? "text-green-600" : "text-gray-500"
        }`}
      />
    );
  };

  const toggleMenu = (name) => {
    setOpenMenus((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  useEffect(() => {
    SidebarFeatures.forEach((f) => {
      if (f.children?.some((c) => c.path === ActivePage)) {
        setOpenMenus((p) => ({ ...p, [f.name]: true }));
      }
    });
  }, [ActivePage]);

  useEffect(() => {
    console.log(isCollapsed);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Mobile open button */}
      <MobileOpenButton setOpen={setOpen} open={open} />

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 z-45 left-0 h-screen
          bg-white border-r border-gray-100
          transition-[width,transform] duration-300 ease-in-out
          ${isCollapsed ? "w-14" : "w-64"}
          ${open ? "translate-x-0" : "-translate-x-full"}
          sm:translate-x-0
          shadow-[1px_0_8px_0_rgba(0,0,0,0.04)]
        `}
      >
        <div className="h-full px-3 py-5 flex flex-col">
          {/* ── Header row ── */}
          <div className="relative h-16 group flex items-center px-2 mb-6">
            <img
              src={
                isCollapsed
                  ? `https://res.cloudinary.com/dzdt11nsx/image/upload/v1770711210/logo_cropped_kop1bs.png`
                  : `https://res.cloudinary.com/dzdt11nsx/image/upload/v1770710830/logo_s59z23.png`
              }
              alt="Nodue Logo"
              className={`
                absolute left-0 top-1/2 -translate-y-1/2
                transition-all duration-300
                ${
                  isCollapsed
                    ? "opacity-100 group-hover:opacity-0 h-7 w-7"
                    : "opacity-100 h-18"
                }
              `}
            />

            {/* Mobile close */}
            <X
              onClick={() => setOpen(false)}
              className="
                md:hidden block
                absolute right-2 top-4
                w-7 h-7 text-gray-500
                p-1 rounded-md hover:bg-gray-100
                cursor-pointer transition-colors duration-150 z-50
              "
            />

            {/* Collapse toggle */}
            <PanelLeft
              onClick={handleCollapse}
              className={`
                hidden md:block
                h-8 w-8 p-1 text-gray-500
                hover:bg-green-50 hover:text-green-600
                rounded-md cursor-pointer
                transition-all duration-200
                absolute top-1/2 -translate-y-1/2
                ${
                  isCollapsed
                    ? "opacity-0 group-hover:opacity-100 left-0"
                    : "opacity-100 right-0"
                }
              `}
            />
          </div>

          {/* ── Nav items ── */}
          <ul className="space-y-0.5 font-medium flex-1">
            {SidebarFeatures.map((feature, index) => {
              const isActive = ActivePage === feature.path;
              const isParentActive = feature.children?.some(
                (c) => c.path === ActivePage,
              );
              const isOpen = openMenus[feature.name];

              return (
                <li
                  key={feature.name}
                  className="sidebar-item-animate"
                  style={{ animationDelay: `${index * 35}ms` }}
                >
                  {/* Parent row */}
                  <div
                    onClick={() => {
                      if (isCollapsed && feature.children) {
                        navigate(feature.children[0].path);
                        return;
                      }
                      if (feature.children) {
                        toggleMenu(feature.name);
                        return;
                      }
                      if (feature.path) navigate(feature.path);
                    }}
                    className={`
                      group relative flex items-center
                      ${isCollapsed ? "justify-center" : ""}
                      px-3 py-2.5 rounded-lg
                      cursor-pointer select-none
                      transition-colors duration-150 text-sm font-medium
                      ${
                        isActive || isParentActive
                          ? "bg-green-50 text-green-700 border-l-2 border-green-500 pl-[10px]"
                          : "text-gray-700 hover:bg-green-50 hover:text-green-700 border-l-2 border-transparent pl-[10px]"
                      }
                    `}
                  >
                    {/* Icon */}
                    <span className="shrink-0">
                      {handleIcons(
                        feature.icon,
                        isActive || isParentActive ? 0 : 1,
                      )}
                    </span>

                    {/* Label + chevron */}
                    {!isCollapsed && (
                      <>
                        <span className="ml-3 flex-1 truncate">
                          {feature.name}
                        </span>
                        {feature.children && (
                          <ChevronDown
                            className={`
                              w-4 h-4 text-gray-400 shrink-0
                              transform transition-transform duration-200 ease-out
                              ${isOpen ? "rotate-0" : "-rotate-90"}
                            `}
                          />
                        )}
                      </>
                    )}

                    {/* Collapsed tooltip */}
                    {isCollapsed && (
                      <span
                        className="
                          absolute left-full ml-2
                          opacity-0 group-hover:opacity-100
                          whitespace-nowrap
                          bg-gray-900/90 text-white text-xs px-2.5 py-1.5 rounded-md
                          transition-opacity duration-150
                          shadow-lg pointer-events-none z-50
                        "
                      >
                        {feature.name}
                      </span>
                    )}
                  </div>

                  {/* ── Animated submenu ── */}
                  {feature.children && !isCollapsed && (
                    <div
                      className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
                      style={{
                        maxHeight: isOpen
                          ? `${feature.children.length * 52}px`
                          : "0px",
                        opacity: isOpen ? 1 : 0,
                      }}
                    >
                      <ul className="ml-5 mt-1 space-y-0.5 text-sm border-l-2 border-gray-100 pl-2 pb-1">
                        {feature.children.map((child, childIndex) => (
                          <li key={child.path}>
                            <Link
                              to={child.path}
                              className={`
                                block px-3 py-2 rounded-md
                                transition-colors duration-150 text-sm
                                ${
                                  ActivePage === child.path
                                    ? "bg-green-100 text-green-700 font-medium"
                                    : "text-gray-600 hover:bg-green-50 hover:text-green-700"
                                }
                              `}
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* ── CTC Divider ── */}
          <ul className="pt-4 mt-2 space-y-0.5 font-medium border-t border-gray-100">
            {SideBarCTC.map((ctc, index) => {
              const isActive = ActivePage === ctc.path;
              return (
                <li
                  key={ctc.name}
                  className="sidebar-item-animate"
                  style={{
                    animationDelay: `${(SidebarFeatures.length + index) * 35}ms`,
                  }}
                >
                  <Link
                    to={ctc.path}
                    className={`
                      group relative flex items-center
                      ${isCollapsed ? "justify-center" : ""}
                      px-3 py-2.5 rounded-lg
                      transition-colors duration-150 text-sm font-medium
                      ${
                        isActive
                          ? "bg-green-50 text-green-700 border-l-2 border-green-500 pl-[10px]"
                          : "text-gray-700 hover:bg-green-50 hover:text-green-700 border-l-2 border-transparent pl-[10px]"
                      }
                    `}
                  >
                    <span className="shrink-0">
                      {handleIcons(ctc.icon, isActive ? 0 : 1)}
                    </span>

                    {!isCollapsed && (
                      <span className="ml-3 truncate">{ctc.name}</span>
                    )}

                    {isCollapsed && (
                      <span
                        className="
                          absolute left-full ml-2
                          opacity-0 group-hover:opacity-100
                          whitespace-nowrap
                          bg-gray-900/90 text-white text-xs px-2.5 py-1.5 rounded-md
                          transition-opacity duration-150
                          shadow-lg pointer-events-none z-50
                        "
                      >
                        {ctc.name}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* ── Footer ── */}
          {!isCollapsed && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center tracking-wide">
                by~ insansa techknowledge
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default SideBar;
