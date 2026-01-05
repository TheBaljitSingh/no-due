import React, { memo } from 'react'
import { ChevronRight, X, Mail, Hash, Calendar, MessageSquare } from 'lucide-react'
import { formatDate } from "../../../utils/AfterAuthUtils/Helpers"

const MobileCustomerDetailCard = memo(({ CustomerNames, imgFor, openDetails, setDetailedView, setSelectedCustomer, selectedCustomer, detailedView }) => {
  return (
    <div className="md:hidden block h-full">
      {!detailedView ? (
        <div className="grid grid-cols-1 gap-3">
          {CustomerNames.map((c, idx) => (
            <button
              key={c._id || idx}
              onClick={() => openDetails(c)}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 transition-colors active:scale-[0.98]"
            >
              <img
                src={imgFor(c)}
                alt={c.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{c.name}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span className="capitalize">{c.gender}</span>
                  <span>•</span>
                  <span className="truncate">Mobile: {c.mobile || 'mobile-1234'}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h4 className="font-semibold text-gray-900">Customer Details</h4>
            <button
              onClick={() => {
                setDetailedView(false);
                setSelectedCustomer(null);
              }}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              aria-label="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedCustomer ? (
            <div className="p-4">
              <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                <img
                  src={imgFor(selectedCustomer)}
                  alt={selectedCustomer.name}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-semibold text-gray-900 mb-1">{selectedCustomer.name}</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="capitalize text-xs">{selectedCustomer.gender}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Hash className="w-3.5 h-3.5 text-gray-400" />
                      <span>{selectedCustomer.mobile || 'CUST-1234'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{selectedCustomer.email || 'not available'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  Recent Reminders
                </div>
                <ul className="space-y-2">
                  {selectedCustomer?.history?.map((r) => (
                    <li
                      key={r._id}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-medium">{formatDate(r.createdAt)}</span>
                        </div>
                        <span className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded border border-gray-200">{r.channel || 'WhatsApp'}</span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${r.status === 'Delivered'
                          ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                          : r.status === 'Seen'
                            ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
                            : r.status === 'Answered'
                              ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20'
                              : 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'
                          }`}
                      >
                        {r.status}
                      </span>
                    </li>
                  ))}
                  {(!selectedCustomer?.history || selectedCustomer.history.length === 0) && (
                    <li className="text-center py-4 text-gray-500 text-sm">No reminder history available</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm">No customer selected</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
});

export default MobileCustomerDetailCard