import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Search,
  Trash2,
  FileSpreadsheet,
  Rows3,
  Columns3,
  CheckSquare,
} from "lucide-react";

export default function PreviewCustomerModal({
  data,
  setData,
  handleClose,
  setContinueFile,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState(new Set());

  const handleContinue = () => {
    if (selectedRows.size > 0) {
      const selectedData = data.filter((_, i) => selectedRows.has(i));
      setData(selectedData);
    }
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
        if (key.toLowerCase() === "lastreminder") {
          const val = newRow[key];
          if (
            val &&
            !isNaN(val) &&
            Number(val) > 30000 &&
            String(val).indexOf("-") === -1
          ) {
            try {
              const date = new Date(
                (Number(val) - 25569) * 86400 * 1000 + 43200000,
              );
              if (!isNaN(date.getTime())) {
                newRow[key] = date.toISOString().split("T")[0];
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
  }, [JSON.stringify(data)]);

  // Select all rows on mount
  useEffect(() => {
    if (data && data.length > 0) {
      setSelectedRows(new Set(data.map((_, i) => i)));
    }
  }, [data.length]);

  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  const filteredIndices = useMemo(() => {
    if (!searchQuery.trim()) return data.map((_, i) => i);
    const q = searchQuery.toLowerCase();
    return data.reduce((acc, row, i) => {
      const match = Object.values(row).some((v) =>
        String(v).toLowerCase().includes(q),
      );
      if (match) acc.push(i);
      return acc;
    }, []);
  }, [data, searchQuery]);

  const handleCellChange = (rowIndex, key, value) => {
    const updated = [...data];
    updated[rowIndex][key] = value;
    setData(updated);
  };

  const handleToggleRow = (index) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (filteredIndices.every((i) => selectedRows.has(i))) {
      setSelectedRows((prev) => {
        const next = new Set(prev);
        filteredIndices.forEach((i) => next.delete(i));
        return next;
      });
    } else {
      setSelectedRows((prev) => {
        const next = new Set(prev);
        filteredIndices.forEach((i) => next.add(i));
        return next;
      });
    }
  };

  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) return;
    const remaining = data.filter((_, i) => !selectedRows.has(i));
    setData(remaining);
    setSelectedRows(new Set());
  };

  const dropdownFields = {
    gender: ["male", "female", "other"],
    status: ["Due", "Overdue", "Pending"],
  };

  const allFilteredSelected =
    filteredIndices.length > 0 &&
    filteredIndices.every((i) => selectedRows.has(i));

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-start py-8 z-50 overflow-y-auto">
      <div className="bg-white w-[95%] max-w-6xl rounded-xl shadow-lg relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="component-header">Preview & Edit Imported Data</h2>
              <p className="component-subheader">
                Review, search, and edit your data before submitting.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="bg-white rounded-full p-2 shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] transition-all duration-200 text-gray-700 hover:text-black cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-5 mt-4">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Rows3 size={15} className="text-green-600" />
              <span className="font-medium text-gray-800">
                {data.length}
              </span>{" "}
              rows
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Columns3 size={15} className="text-green-600" />
              <span className="font-medium text-gray-800">
                {headers.length}
              </span>{" "}
              columns
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <CheckSquare size={15} className="text-green-600" />
              <span className="font-medium text-gray-800">
                {selectedRows.size}
              </span>{" "}
              selected
            </div>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search across all columns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border shadow-accertinity rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:border-gray-300 border-transparent transition-all duration-200"
              />
            </div>
            {selectedRows.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
              >
                <Trash2 size={15} />
                Delete {selectedRows.size} row{selectedRows.size > 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileSpreadsheet size={48} strokeWidth={1.2} />
            <p className="mt-3 text-sm font-medium">No data found</p>
            <p className="text-xs text-gray-400 mt-1">
              Upload a file with data to preview
            </p>
          </div>
        ) : (
          <div className="overflow-auto flex-1 px-2 pb-2">
            <table className="w-full text-left text-sm border-separate border-spacing-0">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50">
                  <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 rounded-tl-lg">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={handleToggleAll}
                      className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer accent-green-600"
                    />
                  </th>
                  <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    #
                  </th>
                  {headers.map((h, i) => (
                    <th
                      key={i}
                      className={`px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap ${i === headers.length - 1 ? "rounded-tr-lg" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredIndices.map((dataIndex, visualIndex) => {
                  const row = data[dataIndex];
                  const isSelected = selectedRows.has(dataIndex);
                  return (
                    <tr
                      key={dataIndex}
                      className={`transition-colors duration-100 ${isSelected ? "bg-green-50/60" : visualIndex % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-green-50/40`}
                    >
                      <td className="px-3 py-2 border-b border-gray-100">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(dataIndex)}
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer accent-green-600"
                        />
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100 text-xs text-gray-400 font-mono">
                        {dataIndex + 1}
                      </td>
                      {headers.map((key, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-2 py-1.5 border-b border-gray-100"
                        >
                          {dropdownFields[key.toLowerCase()] ? (
                            <select
                              value={row[key] || ""}
                              onChange={(e) =>
                                handleCellChange(dataIndex, key, e.target.value)
                              }
                              className="w-full min-w-[100px] border shadow-accertinity px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1 focus:border-gray-300 border-transparent transition-all duration-200"
                            >
                              <option value="">Select</option>
                              {dropdownFields[key.toLowerCase()].map(
                                (opt, idx) => (
                                  <option key={idx} value={opt}>
                                    {opt}
                                  </option>
                                ),
                              )}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={row[key] || ""}
                              onChange={(e) =>
                                handleCellChange(dataIndex, key, e.target.value)
                              }
                              className="w-full min-w-[100px] border shadow-accertinity px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1 focus:border-gray-300 border-transparent transition-all duration-200"
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {filteredIndices.length === 0 && searchQuery && (
                  <tr>
                    <td
                      colSpan={headers.length + 2}
                      className="text-center py-10 text-gray-400 text-sm"
                    >
                      No rows match "
                      <span className="font-medium text-gray-600">
                        {searchQuery}
                      </span>
                      "
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/80 rounded-b-xl">
          <p className="text-sm text-gray-500">
            {selectedRows.size > 0 ? (
              <>
                <span className="font-medium text-gray-700">
                  {selectedRows.size}
                </span>{" "}
                of {data.length} row{data.length !== 1 ? "s" : ""} selected
              </>
            ) : (
              <>
                {data.length} row{data.length !== 1 ? "s" : ""} total
              </>
            )}
          </p>
          <div className="flex gap-3">
            <button onClick={handleClose} className="component-button">
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={selectedRows.size === 0}
              className="component-button-green disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select & Continue ({selectedRows.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
