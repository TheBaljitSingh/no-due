import React, { useState } from "react";
import { toast } from "react-toastify";
import { createCustomers } from "../../../utils/service/customerService";

const CustomerCreation = () => {

  const formConfig = [
    {
      name: "name",
      label: "Customer Name",
      type: "text",
      placeholder: "Enter customer name",
      required: true,
    },
    {
      name: "mobile",
      label: "Mobile Number",
      type: "number",
      placeholder: "Enter mobile number",
      required: true,
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      placeholder: "Enter email",
    },
    {
      name: "currentDue",
      label: "Current Due Amount",
      type: "number",
      placeholder: "₹ 0.00",
    },
    {
      name: "gender",
      label: "Gender",
      type: "select",
      options: [
        { label: "Select gender", value: "" },
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
      ],
      required: true,
    },
  ];

  const initialFormData = formConfig.reduce((acc, field) => {
    acc[field.name] = "";//making empty
    return acc;
  }, {});

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await createCustomers({
        ...formData,
        currentDue: Number(formData.currentDue),
      });

      console.log("Submitting:", formData);

      toast.success("Customer created successfully");
      setFormData(initialFormData); // reset form
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message ||  error?.message || "Failed to create customer");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ UI ------------------ */
  return (
    <div className="min-w-0 w-full">
      {/* Header */}


      {/* Form Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {formConfig.map((field) => (
              <div key={field.name} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>

                {field.type === "select" ? (
                  <select
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className="w-full border shadow-accertinity inline px-4 py-3 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 
                         focus:border-gray-300 focus:bg-gray-100 border-transparent 
                         transition-all duration-200 outline-none"
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="w-full border shadow-accertinity inline px-4 py-3 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 
                         focus:border-gray-300 focus:bg-gray-100 border-transparent 
                         transition-all duration-200 outline-none"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setFormData(initialFormData)}
              className="px-5 py-2.5 text-sm font-medium text-gray-700
                         border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-white
                         component-button-green disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerCreation;
