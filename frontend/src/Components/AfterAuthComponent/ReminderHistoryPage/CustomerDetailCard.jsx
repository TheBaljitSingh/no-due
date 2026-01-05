import React, { memo } from 'react'
import { Mail, Hash, Phone } from 'lucide-react'

const CustomerDetailCard = memo(({ CustomerNames, imgFor, openDetails }) => {
  return (
    <div className="hidden md:grid lg:grid-cols-3 xl:grid-cols-5 md:grid-cols-2 gap-4 mt-6">
      {CustomerNames.map((customer, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col items-center"
        >
          <div className="relative w-20 h-20 mb-4">
            <img
              src={imgFor(customer)}
              alt={customer.name}
              className="w-full h-full rounded-full object-cover ring-2 ring-gray-100"
            />
          </div>

          <h3 className="text-base font-semibold text-gray-900 mb-0.5 text-center">
            {customer.name}
          </h3>
          <p className="text-xs text-gray-500 mb-4 capitalize">{customer.gender}</p>

          <div className="w-full space-y-2 mb-4">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate">{customer.mobile || 'mobile-1234'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate">{customer.email || 'not available'}</span>
            </div>
          </div>

          <button
            onClick={() => openDetails(customer)}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            View Details
          </button>
        </div>
      ))}
    </div>
  )
});

export default CustomerDetailCard