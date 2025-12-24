import React, { useState } from "react";
import { X } from "lucide-react";

const inputClass =
  "w-full border shadow-accertinity inline px-4 py-3 rounded-xl \
   focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 \
   focus:border-gray-300 focus:bg-gray-100 border-transparent \
   transition-all duration-200 outline-none";

export default function PaymentTermCreationModal({ editingTerm, handleClose, handleSubmit }) {

  const [form, setForm] = useState({
    name: editingTerm?.name || "",
    creditDays: editingTerm?.creditDays || "",
    reminderOffsets: editingTerm?.reminderOffsets || "",
    isDefault: editingTerm?.isDefault || false,
    isActive: editingTerm?.isActive || true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      creditDays: Number(form.creditDays),
      reminderOffsets: form.reminderOffsets
        .split(",")
        .map((d) => Number(d.trim()))
        .filter((d) => !isNaN(d)),
      isDefault: form.isDefault,
      isActive: form.isActive,
    };

    console.log("Payment Term Payload:", payload);

    handleSubmit?.(payload);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 relative">
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          Create Payment Term
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Define credit period and reminder rules
        </p>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Term Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter Term name"
              value={form.name}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          {/* Credit Days */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Credit Days
            </label>
            <input
              type="number"
              name="creditDays"
              min="0"
              placeholder="e.g. 30"
              value={form.creditDays}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          {/* Reminder Offsets */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Reminder Offsets (days before due)
            </label>
            <input
              type="text"
              name="reminderOffsets"
              placeholder="e.g. 5, 2, 0"
              value={form.reminderOffsets}
              onChange={handleChange}
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">
              Comma separated values. Example: <code>5, 2, 0</code>
            </p>
          </div>

          {/* Toggles */}
       

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm bg-green-600 text-white hover:bg-green-900 transition"
            >
              Save Term
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
