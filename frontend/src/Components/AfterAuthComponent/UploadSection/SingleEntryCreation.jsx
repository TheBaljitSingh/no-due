import React, { use, useEffect, useState } from 'react'
import CustomerPicker from './CustomerPicker';
// import { CustomerDetailsMap, CustomerNames } from '../../../utils/constants';
import PageHeaders from '../../../utils/AfterAuthUtils/PageHeaders';
import { useNavigate } from 'react-router-dom';
import { addDueToCustomer, createCustomers, getCustomers } from '../../../utils/service/customerService';
import { toast } from 'react-toastify';
import CustomerCreation from '../CustomerCreation/CustomerCreation';
//in future we can delete this part as it is handled on teh main page now
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
    // await createCustomers(formData);
    // setSelectedCustomer(null)
    console.log("Creating entry with data:", formData);

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
      
        {/* <CustomerPicker
          items={customers} // passing entire customers
          selected={formData.customer}
          onSelect={(value) => {
            if (value === "add-new") navigate("../customer-creation");
            else{
               setSelectedCustomer(value.name);
               setFormData(prev=>({...prev, customer: value}));
            }
          }}
        /> */}
        <CustomerCreation/>

        
      </div>
    </div>
  )
}

export default SingleEntryCreation