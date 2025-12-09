/* helpers */

import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export const ActionBadge = ({ onEdit, onDelete }) => {
  const [actionOptions, setActionOptions] = useState(false);
  const menuRef = useRef(null);
  const verticalIconRef = useRef(null);

  // close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if(verticalIconRef.current && verticalIconRef.current.contains(event.target)){
        return;
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActionOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative px-6 py-4 " 
 >
      {/* Three dot button */}
      <button
      ref={verticalIconRef}
        // disabled={actionOptions}
        onClick={() => setActionOptions((prev) => !prev)}
        className="p-2 rounded-lg hover:bg-gray-200 transition-all outline-none"
      >
        <EllipsisVertical size={18} className="text-gray-700 hover:cursor-pointer" />
      </button>

      {/* Dropdown menu */}
      {actionOptions && (
        <div className="absolute right-1 mt-2 w-32 rounded-lg shadow-lg bg-white border border-gray-200 z-100" ref={menuRef}>
          <button
            onClick={() => {
              setActionOptions(false);
              // onEdit();
              alert("comming soon")
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
          >
            <Pencil size={16} className="text-gray-600" />
            Edit
          </button>

          <button
            onClick={() => {
              setActionOptions(false);
              onDelete();
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
          >
            <Trash2 size={16} className="text-gray-600" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};
export const currency = (n) =>
    Number(n || 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
});
  
export const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
  
export const StatusBadge = ({ value }) => {
    const styles = {
      Paid: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20",
      Overdue: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
      Pending: "bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20",
    };
    return (
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${styles[value] || "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20"}`}>
        {value}
      </span>
    );
};

export const statusChip = (s) => {
  const map = {
    scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    sent: "bg-green-50 text-green-700 border-green-200",
    failed: "bg-red-50 text-red-700 border-red-200",
    paused: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return map[s] || "bg-gray-50 text-gray-700 border-gray-200";
};

export function TabButton({ active, onClick, children, icon }) {
  return (
    <button 
      onClick={onClick} 
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? "bg-green-50 text-green-700 border border-green-200" 
          : "text-gray-600 hover:bg-gray-50 border border-transparent"
      }`}
    >
      {icon} {children}
    </button>
  );
}

export function IconBtn({ children, title, onClick, danger }) {
  return (
    <button 
      title={title} 
      onClick={onClick} 
      className={`p-2 rounded-lg transition-colors ${
        danger 
          ? "text-red-600 hover:bg-red-50" 
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

export const currency2 = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
