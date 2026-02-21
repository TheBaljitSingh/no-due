import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function PreviewCustomerModal({ data, setData, handleClose, setContinueFile }) {

  const handleContinue = () => {
    setContinueFile(true);
    handleClose();
  };

  useEffect(() => {
    if (!data || data.length === 0) return;

    let hasChanges = false;
    const updatedData = data.map((row) => {
      const newRow = { ...row };
      let rowChanged = false;

      Object.keys(newRow).forEach((key) => {
        if (key.toLowerCase() === 'lastreminder') {
          const val = newRow[key];
          // Check if value is potentially an Excel serial date (e.g. 46054)
          // Ensure it's not already formatted (doesn't contain '-')
          if (val && !isNaN(val) && Number(val) > 30000 && String(val).indexOf('-') === -1) {
            try {
              // Convert Excel serial date to JS Date
              // Excel base date: Dec 30 1899. JS base date: Jan 1 1970.
              // Difference is ~25569 days. A day is 86400000 ms.
              // We add 12 hours (43200000 ms) to avoid timezone/rounding issues landing heavily on previous day.
              const date = new Date((Number(val) - 25569) * 86400 * 1000 + 43200000);

              if (!isNaN(date.getTime())) {
                newRow[key] = date.toISOString().split('T')[0];
                rowChanged = true;
              }
            } catch (e) {
              console.error("Date conversion error", e);
            }
          }
        }
      });

      if (rowChanged) hasChanges = true;
      return newRow;
    });

    if (hasChanges) {
      setData(updatedData);
    }
  }, [JSON.stringify(data)]); // Ideally depend on data content, or run once if data is stable. using JSON.stringify to catch content changes.

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
    status: ["Due", "Overdue", "Pending"]
  };


  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-start py-12 z-50 overflow-y-auto ">

      <div className="bg-white w-[90%] max-w-4xl rounded-lg shadow-lg p-6 relative max-h-[85vh] flex flex-col">

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
        <div className="overflow-x-auto border rounded-lg flex-1">
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