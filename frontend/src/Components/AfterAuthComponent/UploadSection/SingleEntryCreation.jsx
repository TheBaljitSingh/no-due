import React, { use, useEffect, useState } from 'react'
import CustomerPicker from './CustomerPicker';
// import { CustomerDetailsMap, CustomerNames } from '../../../utils/constants';
import PageHeaders from '../../../utils/AfterAuthUtils/PageHeaders';
import { useNavigate } from 'react-router-dom';
import { createCustomers, getCustomers } from '../../../utils/service/customerService';

const SingleEntryCreation = () => {

    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer , setSelectedCustomer] = useState(null); //it will store name only
    const [formData, setFormData] = useState({ dueAmount: "", dueDate: "", customerId: "",});
    

const CustomerNames = customers.map(customer => ({
      id: customer._id,
      name: customer.name,
      gender: customer.gender
    }));
      
const CustomerDetailsMap  = (name) =>  {
  return customers.find(customer => customer.name === name);
}


  useEffect(()=>{
    const fetchCustomers = async()=>{
      const data = await getCustomers();
      setCustomers(data.data.customers);
    }

    fetchCustomers();

  },[]);


  const handleCreateEntry = async()=>{
    await createCustomers(formData);
    setSelectedCustomer(null)

  }

  return (
    <div className='min-w-0 w-full'>
      {/* Page Header */}
      <PageHeaders
        header="Create New Entry"
        subheader="Add customer dues and manage payment schedules"
      />

      {/* Main Content */}
      <div className="flex flex-col gap-6 mt-6">
        {/* Customer Picker */}
        <CustomerPicker
          items={customers} // passing entire customers
          onSelect={(value) => {
            if (value === "add-new") navigate("../customer-creation");
            else{
               setSelectedCustomer(value);
               setFormData(prev=>({...prev, customerId: value}));
            }
          }}
        />

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900">Entry Details</h3>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Due Amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Due Amount
              </label>
              <input
                type="text"
                value={formData?.dueAmount}
                onChange={(e)=>setFormData(prev=>({...prev, dueAmount: e.target.value}))}
                placeholder="₹ 0.00"
                className="border border-gray-300 text-gray-900 rounded-lg py-2.5 px-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
              />
            </div>

            {/* Due Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Due Date
              </label>
              <input
                type="date"
                value={formData?.dueDate}
                onChange={(e)=>setFormData(prev=>({...prev, dueDate: e.target.value}))}
                className="border border-gray-300 text-gray-900 rounded-lg py-2.5 px-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
              />
            </div>

            {/* Customer Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Customer Name
              </label>
              <input
                type="text"
                className="border border-gray-300 text-gray-600 rounded-lg py-2.5 px-3.5 bg-gray-50 cursor-not-allowed"
                value={selectedCustomer || "No customer selected"}
                disabled
              />
            </div>

            {/* Company Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Company Name
              </label>
              <input
                type="text"
                className="border border-gray-300 text-gray-600 rounded-lg py-2.5 px-3.5 bg-gray-50 cursor-not-allowed"
                value={
                  CustomerDetailsMap(selectedCustomer)?.company ||
                  "No customer selected"
                }
                disabled
              />
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="text"
                className="border border-gray-300 text-gray-600 rounded-lg py-2.5 px-3.5 bg-gray-50 cursor-not-allowed"
                value={
                  CustomerDetailsMap(selectedCustomer)?.mobile ||
                  "No customer selected"
                }
                disabled
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button 
            onClick={() => setSelectedCustomer(null)} 
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            Reset
          </button>
          <button 
            onClick={handleCreateEntry} 
            className="px-5 py-2.5 text-sm font-medium text-white component-button-green transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Entry
          </button>
        </div>
      </div>
    </div>
  )
}

export default SingleEntryCreation