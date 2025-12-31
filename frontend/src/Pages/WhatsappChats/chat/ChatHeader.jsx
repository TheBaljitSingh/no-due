import { X, Minus, Expand } from "lucide-react";

export default function ChatHeader({
  customer,
  onClose,
  onMinimize,
  onExpand,
  isMinimized,
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-white rounded-t-xl">
      <div className="flex items-center gap-3">
        <img
          src={
            customer.customerId.gender === "male"
              ? "https://img.freepik.com/free-vector/smiling-man-with-glasses_1308-174409.jpg"
              : "https://img.freepik.com/free-vector/smiling-woman-with-long-brown-hair_1308-175662.jpg"
          }
          className="h-8 w-8 rounded-full"
        />
        <span className="font-medium truncate">{customer.customerId.name}</span>
      </div>

      <div className="flex items-center gap-2">
        {!isMinimized && (
          <button
            onClick={onMinimize}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Minus size={18} />
          </button>
        )}

        <button
          className="p-1 hover:bg-red-100 rounded text-red-500"
          onClick={onExpand}
          hidden={!isMinimized}
        >
          <Expand size={18} />
        </button>
        <button
          onClick={onClose}
          className="p-1 hover:bg-red-100 rounded text-red-500"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
