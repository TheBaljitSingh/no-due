import React, { useState, useEffect } from 'react'
import { currency, formatDate, StatusBadge, ActionBadge } from '../../../utils/AfterAuthUtils/Helpers'
import { Download, FileText, Pencil, Trash2 } from 'lucide-react'

import {deleteCustomerById, getCustomers} from "../../../utils/service/customerService";
import { toast } from 'react-toastify';

const CustomerTable = ({TableHeaders }) => {

  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState();
  const [totalCustomers, setTotalCustomers] = useState();
  const [deletingId, setDeletingId] = useState(null);



  console.log(customers);

  useEffect(()=>{
    const fetchCustomers = async () => {
      try {
        const data = await getCustomers({page, limit});
        console.log(data.data);
        setCustomers(data.data.customers);
        setTotalPages(data.data.totalPages)
        console.log(data.data.total);
        setTotalCustomers(data.data.total);
      } catch (error) {
        console.log(error);
      }
    };

    fetchCustomers();

  },[page]); 


  const handleEdit = (customer)=>{
    console.log("edit called",customer);

  }

  const handleDelete = async(id)=>{
    console.log("delete called",id);
    //call the api
    const res = await deleteCustomerById(id);
    console.log(res);
    if(res.success){
      setDeletingId(id);
      setTimeout(()=>{
        const updatedCustomers = customers.filter(c=>c._id!==id);
        setCustomers(updatedCustomers);
        setTotalCustomers(prev=>prev-1);
        setDeletingId(null);
        // console.log(updatedCustomers);

      },300)
    }else{
      toast.error(res?.error || "error while deleting");
    }
  }


  return (
          <div className="hidden md:block rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {TableHeaders.map((h, i) => (
                      <th key={i} className="px-2 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap align-middle">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
    
                <tbody className="divide-y divide-gray-200 bg-white">
                  {customers.map((c) => (
                    
                    <tr key={c._id} className={`transition-all duration-300 overflow-hidden hover:bg-gray-50 ${deletingId === c._id ? "opacity-0 h-0" : "opacity-100 h-auto"}`}>
                      <td className="px-2 py-4 font-medium text-gray-900 align-middle">{c._id}</td>
                      <td className="px-2 py-4 text-gray-700 align-middle">{c.name}</td>
                      <td className="px-2 py-4 text-gray-700 align-middle">{c.company}</td>
                      {/* <td className="px-6 py-4">
                        <a href={`mailto:${c.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                          {c.email}
                        </a>
                      </td> */}
                      <td className="px-2 py-4 whitespace-nowrap text-gray-700 align-middle">{c.mobile}</td>
                      <td className="px-2 py-4 font-medium text-gray-900">{currency(c.due)}</td>
                      <td className="px-2 py-4 font-medium text-red-600">{currency(c.overdue)}</td>
                      <td className="px-2 py-4 whitespace-nowrap text-gray-700">{formatDate(c.lastReminder)}</td>
                      {/* <td className="px-6 py-4 max-w-xs">
                        <span className="line-clamp-2 text-gray-700" title={c.feedback}>
                          {c.feedback || "-"}
                        </span>
                      </td> */}
                      <td className="px-6 py-4 align-middle">
                        <StatusBadge value={c.status} />
                      </td>
                      <td >
                       <ActionBadge onEdit={()=>handleEdit(c)} onDelete={()=>handleDelete(c._id)} />
                      </td>
                    </tr>
                  ))}
    
                  {customers.length === 0 && (
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
            <div className="md:flex inline-flex md:flex-wrap items-center justify-between border-gray-200 bg-gray-50 px-2 md:px-2 py-3 text-sm text-gray-700 gap-3">

              <span>Total: <strong className="font-semibold text-gray-900">{totalCustomers}</strong> customers</span>          


                <div className="md:flex items-center md:justify-center justify-end gap-3 p-4   bg-gray-50">

              {/* Pagination */}
              {/* Previous Button */}
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className={`px-4 py-2 rounded-lg border ${
                  page === 1 ? "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200" : "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                }`}
              >
                Previous
              </button>

              {/* Page Numbers */}
              <span className="text-gray-700 text-sm">
                Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong>
              </span>

              {/* Next Button */}
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className={`px-4 py-2 rounded-lg border ${
                  page === totalPages ? "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200" : "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                }`}
              >
                Next
              </button>

            </div>
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