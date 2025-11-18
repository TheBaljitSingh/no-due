import React from 'react'
import { currency, formatDate, StatusBadge } from '../../../utils/AfterAuthUtils/Helpers'
import { Download, FileText } from 'lucide-react'

const CustomerTable = ({TableHeaders , seedCustomers}) => {
  return (
     <div className="hidden md:block rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {TableHeaders.map((h, i) => (
                      <th key={i} className="px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
    
                <tbody className="divide-y divide-gray-200 bg-white">
                  {seedCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{c.id}</td>
                      <td className="px-6 py-4 text-gray-700">{c.name}</td>
                      <td className="px-6 py-4 text-gray-700">{c.company}</td>
                      {/* <td className="px-6 py-4">
                        <a href={`mailto:${c.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                          {c.email}
                        </a>
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{c.mobile}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{currency(c.due)}</td>
                      <td className="px-6 py-4 font-medium text-red-600">{currency(c.overdue)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{formatDate(c.lastReminder)}</td>
                      <td className="px-6 py-4 max-w-xs">
                        <span className="line-clamp-2 text-gray-700" title={c.feedback}>
                          {c.feedback || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge value={c.status} />
                      </td>
                    </tr>
                  ))}
    
                  {seedCustomers.length === 0 && (
                    <tr>
                      <td colSpan={TableHeaders.length} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <img 
                            className="w-48 h-48 object-contain opacity-60 mb-4" 
                            src="https://img.freepik.com/premium-vector/no-data-concept-missing-files-no-search-results-found-system-data-available-illustration_939213-1763.jpg" 
                            alt="No customers found" 
                          />
                          <p className="text-gray-500 text-sm">No customers found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
    
            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3 text-sm text-gray-700 gap-3">
              <span>Total: <strong className="font-semibold text-gray-900">{seedCustomers.length}</strong> customers</span>
              <div className="flex gap-2">
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200">
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200">
                  <FileText className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </div>
          </div>
  )
}

export default CustomerTable