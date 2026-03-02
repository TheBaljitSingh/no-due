import React, { useState } from "react";
import { X, Calendar, Clock } from "lucide-react";

export default function BulkRescheduleModal({ open, onClose, onConfirm, count }) {
    const [scheduledFor, setScheduledFor] = useState("");

    if (!open) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!scheduledFor) return;
        onConfirm(scheduledFor);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h3 className="text-lg font-bold text-gray-900">Reschedule Reminders</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-blue-900">Rescheduling {count} reminders</p>
                            <p className="text-xs text-blue-700">All selected reminders will be updated to the new time.</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">New Date & Time</label>
                        <div className="relative">
                            <input
                                type="datetime-local"
                                required
                                value={scheduledFor}
                                onChange={(e) => setScheduledFor(e.target.value)}
                                className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
                                min={new Date().toISOString().slice(0, 16)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 font-semibold italic">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm  text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!scheduledFor}
                            className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                            Update All
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
