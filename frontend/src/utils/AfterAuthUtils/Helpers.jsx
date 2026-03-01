/* helpers */

import { IndianRupee, Pencil, Trash2 } from "lucide-react";

export const ActionBadge = ({ onEdit, onDelete, onTransaction }) => {
  return (
    <div className="flex items-center gap-1 px-3 py-4">
      {/* Edit */}
      <div className="relative group/tip">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <Pencil size={14} />
        </button>
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-[100] whitespace-nowrap rounded bg-gray-900 px-1.5 py-px text-[9px] font-medium text-white opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150">
          Edit
        </span>
      </div>

      {/* Delete */}
      <div className="relative group/tip">
        <button
          onClick={onDelete}
          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-[100] whitespace-nowrap rounded bg-gray-900 px-1.5 py-px text-[9px] font-medium text-white opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150">
          Delete
        </span>
      </div>

      {/* Transactions */}
      <div className="relative group/tip">
        <button
          onClick={onTransaction}
          className="p-1.5 rounded-md text-gray-400 hover:text-green-700 hover:bg-green-50 transition-colors cursor-pointer"
        >
          <IndianRupee size={14} />
        </button>
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-[100] whitespace-nowrap rounded bg-gray-900 px-1.5 py-px text-[9px] font-medium text-white opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150">
          Transactions
        </span>
      </div>
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
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

export const StatusBadge = ({ value }) => {
  const styles = {
    Paid: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20",
    Overdue: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
    Pending:
      "bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${styles[value] || "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20"}`}
    >
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
