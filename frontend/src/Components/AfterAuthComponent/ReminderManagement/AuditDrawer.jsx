import React, { useEffect, useRef, useState } from "react";
import { X, MessageSquare, Phone, Mail, Loader2, Inbox, ChartArea, MessagesSquare } from "lucide-react";
import { getAuditLogs } from "../../../utils/service/reminderService";

const EXIT_DURATION = 240; // must match audit-drawer-out duration in ms

const STATUS_COLORS = {
  delivered: "bg-green-100 text-green-700",
  sent: "bg-gray-100 text-gray-500",
  read: "bg-blue-100 text-blue-600",
  failed: "bg-red-100 text-red-600",
  pending: "bg-yellow-100 text-yellow-600",
};

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AuditDrawer({ customer, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const bottomScrollRef = useRef(null);

  useEffect(() => {
    if (customer?.mobile) loadLogs();
  }, [customer]);

  useEffect(() => {
    bottomScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await getAuditLogs(customer.mobile);
      if (res.success) setLogs(res.data);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, EXIT_DURATION);
  };

  const drawerClass = isClosing ? "audit-drawer-exit" : "audit-drawer-enter";
  const overlayClass = isClosing ? "audit-overlay-exit" : "audit-overlay-enter";

  const reversedLogs = [...logs].reverse();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/25 backdrop-blur-sm ${overlayClass}`}
        onClick={handleClose}
      />

      {/* Drawer panel */}
      <div
        className={`relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col ${drawerClass}`}
      >
        {/* Teal accent bar */}
        <div className="h-1 bg-green-300 shrink-0" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-4 bg-white shrink-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-sm">
            {getInitials(customer?.name)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 truncate leading-tight">
              {customer?.name || "Unknown"}
            </h2>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {customer?.mobile && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Phone className="w-3 h-3" />
                  {customer.mobile}
                </span>
              )}
              {customer?.email && (
                <span className="flex items-center gap-1 text-xs text-gray-500 truncate max-w-[160px]">
                  <Mail className="w-3 h-3" />
                  {customer.email}
                </span>
              )}
            </div>
          </div>

          {/* Close */}
          <button
            onClick={handleClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section label */}
        <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <MessagesSquare className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Communication Logs
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-teal-500" />
              <p className="text-xs text-gray-400">Loading messages…</p>
            </div>
          ) : reversedLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Inbox className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  No messages yet
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Communication history will appear here
                </p>
              </div>
            </div>
          ) : (
            reversedLogs.map((log, i) => {
              const isOut = log.direction === "OUTBOUND";
              const statusClass =
                STATUS_COLORS[log.status?.toLowerCase()] ??
                "bg-gray-100 text-gray-500";

              return (
                <div
                  key={log._id}
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                  className={`flex gap-2 bubble-enter ${isOut ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex flex-col gap-1 max-w-[82%] ${isOut ? "items-end" : "items-start"}`}
                  >
                    {/* Bubble */}
                    <div
                      className={`px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        isOut
                          ? "bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-2xl rounded-tr-sm"
                          : "bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm"
                      }`}
                    >
                      {log.type === "interactive" ? (
                        <div className="space-y-2">
                          <p className="whitespace-pre-wrap">
                            {log.metadata?.body?.text || log.text}
                          </p>
                          {log.metadata?.action && (
                            <div className="mt-3 space-y-2">
                              {/* List Sections */}
                              {log.metadata.action.sections?.map(
                                (section, idx) => (
                                  <div key={idx} className="space-y-1.5">
                                    {section.title && (
                                      <p className="text-[10px] uppercase tracking-wider opacity-70 font-medium px-1">
                                        {section.title}
                                      </p>
                                    )}
                                    <div className="flex flex-col gap-1.5">
                                      {section.rows?.map((row) => (
                                        <div
                                          key={row.id}
                                          className={`text-xs px-3 py-2 rounded-xl border transition-colors ${
                                            isOut
                                              ? "bg-white/15 border-white/25 hover:bg-white/25"
                                              : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                          }`}
                                        >
                                          <p className="font-medium">
                                            {row.title}
                                          </p>
                                          {row.description && (
                                            <p className="text-[10px] opacity-70 mt-0.5">
                                              {row.description}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ),
                              )}

                              {/* Buttons */}
                              {log.metadata.action.buttons && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {log.metadata.action.buttons.map(
                                    (btn, idx) => (
                                      <div
                                        key={idx}
                                        className={`text-xs px-3 py-1.5 rounded-full border ${
                                          isOut
                                            ? "bg-white/15 border-white/25"
                                            : "bg-gray-50 border-gray-200"
                                        }`}
                                      >
                                        {btn.reply?.title || btn.type}
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : log.type === "template" ? (
                        <div className="space-y-0.5">
                          <p
                            className={`text-[10px] uppercase tracking-wider font-semibold ${isOut ? "text-white/70" : "text-gray-400"}`}
                          >
                            Template
                          </p>
                          <p>{log.templateName}</p>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{log.text}</p>
                      )}
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-2 px-1">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${statusClass}`}
                      >
                        {log.status}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(log.timestamp).toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomScrollRef} />
        </div>
      </div>
    </div>
  );
}
