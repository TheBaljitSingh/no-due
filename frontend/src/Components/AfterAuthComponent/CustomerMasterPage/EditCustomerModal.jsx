import React from "react";
import { X } from "lucide-react";

export default function EditCustomerModal({  customer,  setEditCustomer,  handleClose,  handleEditSubmit}) {
  if (!customer) return null;

  console.log(customer);

  const handleChange = (e) => {
    const key = e.target.name;
    const value = e.target.value;

    setEditCustomer((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-start py-12 z-50">
      <div className="bg-white w-[90%] max-w-3xl rounded-xl shadow-lg p-8 relative">

        {/* Enhanced Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 bg-white rounded-full p-2 
                     shadow-[0_4px_14px_rgba(0,0,0,0.15)]
                     hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] 
                     transition-all duration-200 text-gray-700 
                     hover:text-black cursor-pointer"
        >
          <X size={22} />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-semibold mb-3 text-gray-800">
          Edit Customer Details
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Update the fields below and save your changes.
        </p>

        {/* Multi-column Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Name */}
          <div>
            <label className="text-sm text-gray-700 after:content-['*'] after:ml-1 after:text-red-500">Name</label>
            <input
              name="name"
              value={customer.name || ""}
              onChange={handleChange}
              className="w-full border shadow-accertinity inline px-4 py-3 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 
                         focus:border-gray-300 focus:bg-gray-100 border-transparent 
                         transition-all duration-200 outline-none"
              placeholder="Enter name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm text-gray-700 after:content-['*'] after:ml-1 after:text-red-500">Email</label>
            <input
              name="email"
              value={customer.email || ""}
              onChange={handleChange}
              className="w-full border shadow-accertinity inline px-4 py-3 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 
                         focus:border-gray-300 focus:bg-gray-100 border-transparent 
                         transition-all duration-200 outline-none"
              placeholder="Email"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm text-gray-700">Mobile</label>
            <input
              name="mobile"
              value={customer.mobile || ""}
              onChange={handleChange}
              className="w-full border shadow-accertinity inline px-4 py-3 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 
                         focus:border-gray-300 focus:bg-gray-100 border-transparent 
                         transition-all duration-200 outline-none"
              placeholder="Phone number"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="text-sm text-gray-700">Gender</label>
            <select
              name="gender"
              value={customer?.gender}
              onChange={handleChange}
              className="w-full border shadow-accertinity inline px-4 py-3 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 
                         focus:border-gray-300 focus:bg-gray-100 border-transparent 
                         transition-all duration-200 outline-none"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Due */}
          <div>
            <label className="text-sm text-gray-700 after:content-['*'] after:ml-1 after:text-red-500">Due</label>
            <input
              name="due"
              value={customer.due || ""}
              onChange={handleChange}
              className="w-full border shadow-accertinity inline px-4 py-3 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 
                         focus:border-gray-300 focus:bg-gray-100 border-transparent 
                         transition-all duration-200 outline-none"
              placeholder="Due amount"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm text-gray-700 after:content-['*'] after:ml-1 after:text-red-500">Status</label>
            <select
              name="status"
              value={customer?.status}
              onChange={handleChange}
              className="w-full border shadow-accertinity inline px-4 py-3 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 
                         focus:border-gray-300 focus:bg-gray-100 border-transparent 
                         transition-all duration-200 outline-none"
            >
              <option value="Overdue">Overdue</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Due">Due</option>
            </select>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-lg border border-gray-300 bg-white 
                       text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleEditSubmit}
            className="px-5 py-2 text-white component-button-green rounded-lg shadow-md 
                       hover:opacity-90 transition"
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
