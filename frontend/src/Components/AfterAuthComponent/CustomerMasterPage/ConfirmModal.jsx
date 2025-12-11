export default function ConfirmModal({ open, onClose, onConfirm, message }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex justify-center items-center z-50">
      <div className="bg-white rounded-xl p-6 w-[90%] max-w-md shadow-lg relative">

        <h3 className="text-lg font-semibold text-gray-800 mb-3">Confirm Action</h3>
        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-200 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-red-200 text-gray-700 hover:bg-red-100"
          >
            Delete
          </button>
        </div>

      </div>
    </div>
  );
}
