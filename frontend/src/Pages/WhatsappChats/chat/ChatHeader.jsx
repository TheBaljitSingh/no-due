function ChatHeader({ customer }) {
  return (
    <div className="border-b px-4 py-3 flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-green-600 text-white flex items-center justify-center">
        {customer.name?.[0] || "C"}
      </div>
      <div>
        <div className="font-medium">{customer.name}</div>
        <div className="text-xs text-gray-500">{customer.phone}</div>
      </div>
    </div>
  );
}

export default ChatHeader;
