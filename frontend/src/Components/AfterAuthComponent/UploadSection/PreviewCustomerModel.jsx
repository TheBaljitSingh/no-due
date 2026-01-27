import React from "react";
import { X } from "lucide-react";
import { useState } from "react";

export default function PreviewCustomerModal({ data, setData, handleClose, setContinueFile }) {

const handleContinue = () => {
  setContinueFile(true);
  handleClose();
};
  // Extract dynamic table headers from first row
  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  // Handle cell updates
  const handleCellChange = (rowIndex, key, value) => {
    const updated = [...data];
    updated[rowIndex][key] = value;
    setData(updated);
  };

  const dropdownFields = {
    gender: ["male", "female", "other"],
    status: ["Paid", "Due", "Overdue", "Pending"]
  };


  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-start py-12 z-50">

      <div className="bg-white w-[90%] max-w-4xl rounded-lg shadow-lg p-6 relative">

        {/* Close Button */}
        <button onClick={handleClose} className="absolute top-3 right-3 bg-white rounded-2xl shadow-[0_8px_10px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_12px_rgba(0,0,0,0.4)] text-gray-600 hover:text-gray-800 flex items-center justify-center cursor-pointer">
          <X size={22} />
        </button>



        {/* Header */}
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Preview & Edit Imported Data
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Review and edit CSV data before submitting.
        </p>

        {/* Dynamic Editable Table */}
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-left text-sm">

            {/* Table Header */}
            <thead className="bg-gray-50 border-b">
              <tr>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y">
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {headers.map((key, colIndex) => (
                    <td key={colIndex} className="px-4 py-2">

                      {dropdownFields[key.toLowerCase()] ? (
                        <select
                          value={row[key] || ""}
                          onChange={(e) => handleCellChange(rowIndex, key, e.target.value)}
                          className="w-[90px] border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Select</option>
                          {dropdownFields[key.toLowerCase()].map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={row[key] || ""}
                          onChange={(e) => handleCellChange(rowIndex, key, e.target.value)}
                          className="w-[90px] border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      )}

                    </td>

                  ))}
                </tr>
              ))}
            </tbody>

          </table>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end gap-3">

          {/* Cancel */}
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>

          {/* Submit */}
          <button
            onClick={handleContinue}
            className="px-4 py-2 text-white component-button-green rounded-lg shadow-sm hover:opacity-90 transition"
          >
            Select & Continue
          </button>
        </div>

      </div>
    </div>
  );
}