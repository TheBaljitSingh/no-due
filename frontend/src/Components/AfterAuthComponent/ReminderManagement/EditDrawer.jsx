import React, { useState } from 'react'
import { MessageCircle, Phone, Trash2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { currency2, statusChip } from '../../../utils/AfterAuthUtils/Helpers';
import { TEMPLATES } from '../../../utils/constants';
import { deleteReminder, rescheduleReminder } from '../../../utils/service/reminderService';
import { toast } from 'react-toastify';


const EditDrawer = ({ reminder, onClose, onDeleteSuccess, onRescheduleSuccess }) => {
  const [scheduleDate, setScheduleDate] = useState(reminder.sendAt || "");

  const handleDelete = async () => {
    try {
      await deleteReminder(reminder.id);
      toast.success("Reminder deleted successfully");
      if (onDeleteSuccess) onDeleteSuccess(reminder.id);
      else onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete reminder");
    }
  };

  const handleReschedule = async () => {
    if (!scheduleDate) {
      toast.error("Please select a date to reschedule");
      return;
    }
    try {
      const res = await rescheduleReminder(reminder.id, scheduleDate);
      toast.success("Reminder rescheduled successfully");
      if (onRescheduleSuccess) onRescheduleSuccess();
      else onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reschedule reminder");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl">
              <div className="px-6 py-4 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Edit Reminder</h2>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reminder ID</label>
                    <div className="text-lg font-semibold text-gray-900">{reminder.id}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Details</label>
                    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                      <div className="font-medium text-gray-900">{reminder.customer.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{reminder?.customer?.email}</div>
                      <div className="text-xs text-gray-500 mt-1">Mobile: {reminder.customer.mobile}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Channels</label>
                    <div className="flex items-center gap-2">
                      {reminder.channel.includes("whatsapp") && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </span>
                      )}
                      {reminder.channel.includes("voice") && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <Phone className="w-3.5 h-3.5" /> Voice
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Amount</label>
                    <div className="text-xl font-semibold text-gray-900">{currency2(reminder.dueAmount)}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
                    <div className="space-y-2">
                      <input
                        type="datetime-local"
                        value={scheduleDate.slice(0, 16)}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleReschedule}
                        className="w-full inline-flex items-center justify-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                        <RefreshCw className="w-4 h-4" /> Reschedule
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusChip(reminder.status)}`}>
                        {reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1)}
                      </span>
                      
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                    <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                      <div className="text-sm font-medium text-gray-900">{TEMPLATES[reminder.template]?.label || reminder.template}</div>
                    </div>
                  </div>

                  {reminder.lastResult && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Result</label>
                      <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          {reminder.lastResult.delivered ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-sm font-medium text-gray-700">
                            {reminder.lastResult.delivered ? "Delivered" : "Failed"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">{reminder.lastResult.response || "No response"}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors inline-flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                  <button
                    onClick={handleReschedule}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default EditDrawer
