import React, { useState, useEffect } from 'react'
import { currency, formatDate, StatusBadge } from '../../../utils/AfterAuthUtils/Helpers'
import { getCustomers } from '../../../utils/service/customerService';

const CustomerMobileCard = () => {


  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  useEffect(()=>{
      const fetchCustomers = async () => {
        try {
          const customers = await getCustomers({page, limit});
          console.log(customers);
          setCustomers(customers);
        } catch (error) {
          console.log(error);
        }
      };
  
      fetchCustomers();
  
  },[page, limit]);

  return (
    <div className="md:hidden space-y-4">
           {customers.map((c) => (
             <div key={c._id} className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
               <div className="p-4 space-y-3">
                 <div className="flex items-start justify-between">
                   <div className="flex-1 min-w-0">
                     <h3 className="text-base font-semibold text-gray-900 truncate">{c.name}</h3>
                     <p className="text-sm text-gray-600 truncate">{c.company}</p>
                   </div>
                   <StatusBadge value={c.status} />
                 </div>
                 
                 <div className="space-y-2 text-sm">
                   <div className="flex justify-between">
                     <span className="text-gray-600">ID:</span>
                     <span className="font-medium text-gray-900">{c._id}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-gray-600">Due:</span>
                     <span className="font-semibold text-gray-900">{currency(c.due)}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-gray-600">Overdue:</span>
                     <span className="font-semibold text-red-600">{currency(c.overdue)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-gray-600">Email:</span>
                     <a href={`mailto:${c.email}`} className="text-green-600 hover:text-green-800 truncate max-w-[60%] text-right">
                       {c.email}
                     </a>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-gray-600">Mobile:</span>
                     <span className="text-gray-900">{c.mobile}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-gray-600">Last Reminder:</span>
                     <span className="text-gray-900">{formatDate(c.lastReminder)}</span>
                   </div>
                   {c.feedback && (
                     <div className="pt-2 border-t border-gray-100">
                       <span className="text-gray-600 text-xs">Feedback:</span>
                       <p className="text-gray-700 mt-1 line-clamp-2">{c.feedback}</p>
                     </div>
                   )}
                 </div>
               </div>
             </div>
           ))}
   
           {customers.length === 0 && (
             <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-12 text-center text-gray-500">
               No customers found.
               <img className="mx-auto" src="https://img.freepik.com/premium-vector/file-folder-mascot-character-design-vector_166742-4371.jpg" alt="" />
   
             </div>
           )}
   
           {/* Mobile Footer */}
           <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
             <div className="flex flex-col gap-3">
               <div className="text-sm text-gray-700">
                 Total: <strong className="font-semibold text-gray-900">{customers.length}</strong> customers
               </div>
               <div className="flex gap-2">
                 <button className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Export CSV</button>
                 <button className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Export PDF</button>
               </div>
             </div>
           </div>
         </div>
  )
}

export default CustomerMobileCard
