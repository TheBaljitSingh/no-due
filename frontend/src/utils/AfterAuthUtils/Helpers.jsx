/* helpers */

import { Pencil, Trash2 } from "lucide-react";

export const ActionBadge = ({onEdit, onDelete})=>{

  return (
 <div className="flex items-center px-6 py-4 gap-3">
  {/* <button
    onClick={onEdit}
    disabled
    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 
               transition-all shadow-sm hover:shadow-md hover:cursor-pointer"
  >
    <Pencil size={16} className="text-gray-700" />
  </button> */}

  <button
    onClick={onDelete}
    className="p-2 rounded-lg bg-red-100 hover:bg-red-200 
               transition-all shadow-sm hover:shadow-md hover:cursor-pointer"
  >
    <Trash2 size={16} className="text-red-600" />
  </button>
</div>

  )
}
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
