import React, { memo } from 'react'
import { X, Send, Mail, Hash, Phone } from 'lucide-react'
import { formatDate } from "../../../../utils/AfterAuthUtils/Helpers"
import { useNavigate } from 'react-router-dom';

const RightSide = memo(({ setDetailedView, setSelectedCustomer, imgFor, selectedCustomer }) => {
  const navigate = useNavigate();

  const handleSendReminder = () => {
    navigate('/nodue/reminder-management');
  };

  return (
    <div className="relative h-full flex flex-col">
      <div className="absolute right-4 top-4 z-10">
        <button
          onClick={() => {
            setDetailedView(false);
            setSelectedCustomer(null);
          }}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {selectedCustomer ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col h-full overflow-hidden">
          <div className="flex items-start gap-4 pr-8 flex-shrink-0">
            <img
              src={imgFor(selectedCustomer)}
              alt={selectedCustomer.name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-100"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedCustomer.name}
              </h3>
              <p className="text-sm text-gray-500 capitalize mt-0.5">
                {selectedCustomer.gender}
              </p>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{selectedCustomer.mobile || 'mobile-1234'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{selectedCustomer.email || 'not available'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6 flex-shrink-0">
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
              <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total</div>
              <div className="text-2xl font-semibold text-blue-900 mt-1">{selectedCustomer?.summary?.totalReminders || 0}</div>
            </div>
            <div className="rounded-lg bg-green-50 border border-green-100 p-3">
              <div className="text-xs font-medium text-green-600 uppercase tracking-wide">Pending</div>
              <div className="text-2xl font-semibold text-green-900 mt-1">{selectedCustomer?.summary?.totalPending || 0}</div>
            </div>
            <div className="rounded-lg bg-purple-50 border border-purple-100 p-3">
              <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Sent</div>
              <div className="text-2xl font-semibold text-purple-900 mt-1">{selectedCustomer?.summary?.stotalSent || 0}</div>
            </div>
            {/* <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
              <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Last Active</div>
              <div className="text-sm font-semibold text-gray-900 mt-1">Oct 14, 2025</div>
            </div> */}
          </div>

          {/* Timeline / table */}
          <div className="mt-6 flex-1 min-h-0 flex flex-col">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex-shrink-0">Reminder Timeline</h4>
            <div className="overflow-hidden rounded-lg border border-gray-200 flex-1 overflow-y-auto">
              <table className="min-w-full bg-white text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Channel</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Due Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedCustomer?.history?.map((r) => (
                    <tr key={r?._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(r?.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-700">{r?.channel || 'WhatsApp'} </td>
                      <td className="px-4 py-3 text-gray-700">₹{r?.dueAmount || '0'} </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${r.status === 'Delivered'
                            ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                            : r.status === 'Seen'
                              ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
                              : r.status === 'Answered'
                                ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20'
                                : 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'
                            }`}
                        >
                          {r?.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex-shrink-0">
            <button
              onClick={handleSendReminder}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <Send className="w-4 h-4" />
              Send Reminder Now
            </button>
          </div>
        </div>
      ) : (
        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Mail className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">Select a customer from the list</p>
          <p className="text-gray-400 text-xs mt-1">to view reminder history and details</p>
        </div>
      )}
    </div>
  )
});

export default RightSide