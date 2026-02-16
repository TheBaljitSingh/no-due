import React, { useEffect, useState } from "react";
import { X, MessageSquare, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { getAuditLogs } from "../../../utils/service/reminderService";
import { useRef } from "react";
// import { statusChip } from "../../utils/AfterAuthUtils/Helpers";

export default function AuditDrawer({ customer, onClose }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const bottomScrollRef = useRef(null);

    useEffect(() => {
        if (customer?.mobile) {
            loadLogs();
        }
    }, [customer]);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const res = await getAuditLogs(customer.mobile);
            if (res.success) {
                setLogs(res.data);
            }
        } catch (error) {
            console.error("Failed to load audit logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        bottomScrollRef.current?.scrollIntoView({ behavior: "smooth" });

    }, [logs])

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Communication Logs</h2>
                        <p className="text-sm text-gray-500 mt-1">{customer.name} • {customer.mobile}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 text-sm">
                            No communication history found
                        </div>
                    ) : (
                        [...logs].reverse().map((log) => (
                            <div
                                key={log._id}
                                className={`flex gap-3 max-w-[90%] ${log.direction === 'OUTBOUND' ? 'ml-auto flex-row-reverse' : ''}`}
                            >
                                

                                <div className={`flex flex-col ${log.direction === 'OUTBOUND' ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${log.direction === 'OUTBOUND'
                                        ? 'bg-green-600 text-white rounded-tr-none'
                                        : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none shadow-sm'
                                        }`}>
                                        {log.type === 'interactive' ? (
                                            <div className="space-y-2">
                                                <div className="whitespace-pre-wrap leading-relaxed">
                                                    {log.metadata?.body?.text || log.text}
                                                </div>
                                                {/* Render Options */}
                                                {log.metadata?.action && (
                                                    <div className={`mt-3 space-y-2 ${log.direction === 'OUTBOUND' ? 'items-end' : 'items-start'}`}>
                                                        {/* List Sections */}
                                                        {log.metadata.action.sections?.map((section, idx) => (
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
                                                                            className={`text-xs px-3 py-2 rounded-lg border backdrop-blur-sm transition-all
                                                                                ${log.direction === 'OUTBOUND'
                                                                                    ? 'bg-white/10 border-white/20 hover:bg-white/20'
                                                                                    : 'bg-black/5 border-black/10 hover:bg-black/10'
                                                                                }`}
                                                                        >
                                                                            {row.title}
                                                                            {row.description && <p className="text-[10px] opacity-70 mt-0.5">{row.description}</p>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Buttons */}
                                                        {log.metadata.action.buttons?.map((btn, idx) => (
                                                            <div
                                                                key={idx}
                                                                className={`text-xs px-3 py-2 rounded-lg border backdrop-blur-sm inline-block mr-2 mb-2
                                                                    ${log.direction === 'OUTBOUND'
                                                                        ? 'bg-white/10 border-white/20'
                                                                        : 'bg-black/5 border-black/10'
                                                                    }`}
                                                            >
                                                                {btn.reply?.title || btn.type}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : log.type === 'template' ? (
                                            <div className="space-y-1">
                                                <div className="text-[10px] uppercase tracking-wider opacity-75 font-medium">Template</div>
                                                <div>{log.templateName}</div>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="whitespace-pre-wrap leading-relaxed">{log.text}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mt-1 px-1">
                                        <span className="text-[10px] text-gray-400 capitalize bg-white/50 px-1.5 py-0.5 rounded-full border border-gray-100">
                                            {log.status}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(log.timestamp).toLocaleString("en-IN", {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                                <div ref={bottomScrollRef}></div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
