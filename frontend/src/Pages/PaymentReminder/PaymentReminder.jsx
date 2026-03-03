import React, { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import PaymentReminderTemplateCreationModel from "../../Components/AfterAuthComponent/PaymentReminder/PaymentReminderTemplateCreationModel";
import {
  createPaymentTerms,
  deletePaymentTerms,
  getUserPaymentTerms,
  updatePaymentTerms,
} from "../../utils/service/paymentTermService";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import ConfirmModal from "../../Components/AfterAuthComponent/CustomerMasterPage/ConfirmModal";

export default function PaymentReminder() {
  const [globalTerms, setGlobalTerms] = useState([]);
  const [customTerms, setCustomTerms] = useState([]);
  const { user } = useAuth();
  const [editingTerm, setEditingTerm] = useState();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toBeDeletedId, setToBeDeletedId] = useState(null);

  const [showTemplateCreationModal, setShowTemplateCreationModal] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);
  const templateCreationRef = useRef();

  useEffect(() => {
    async function fetchUserTemplate() {
      try {
        //api should be protected by auth middleware that only user can fetch thair template and default provided by nodue
        const res = await getUserPaymentTerms();
        let templates = res.data.paymentTerms;

        setGlobalTerms(templates.filter((t) => t.owner === null)); //have to verify
        setCustomTerms(templates.filter((t) => t.owner === user._id));
      } catch (error) {
        console.log(error);
      }
    }

    fetchUserTemplate();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        templateCreationRef.current &&
        !templateCreationRef.current.contains(e.target)
      ) {
        setShowTemplateCreationModal(false);
        setEditingTerm(null);
      }
    }

    if (showTemplateCreationModal) {
      window.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTemplateCreationModal]);

  const handleCreationSubmit = async (payload) => {
    console.log("payload", payload);

    const action = editingTerm
      ? updatePaymentTerms(editingTerm._id, payload)
      : createPaymentTerms(payload);

    setSubmitting(true);
    try {
      const res = await toast.promise(action, {
        loading: editingTerm ? "Updating..." : "Creating...",
        success: editingTerm ? "Payment term updated" : "Payment term created",
        error: (err) => err?.response?.data?.message || "Operation failed",
      });

      if (editingTerm) {
        setCustomTerms((prev) =>
          prev.map((t) =>
            t._id === editingTerm._id ? res.data.paymentTerm : t,
          ),
        );
      } else {
        setCustomTerms((prev) => [...prev, res.data.paymentTerm]);
      }

      setEditingTerm(null);
      setShowTemplateCreationModal(false);
    } catch (error) {
      console.log(error);
      // toast.promise already showed the error, dialog stays open
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id) => {
    setToBeDeletedId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await toast.promise(deletePaymentTerms(toBeDeletedId), {
        loading: "Deleting...",
        success: "Payment term deleted",
        error: (err) => err?.response?.data?.message || "Failed to delete",
      });

      setCustomTerms((prev) => prev.filter((t) => t._id !== toBeDeletedId));
    } catch (error) {
      console.error(error);
    } finally {
      setConfirmOpen(false);
      setToBeDeletedId(null);
    }
  };

  const handleEdit = (term) => {
    setEditingTerm(term);
    setShowTemplateCreationModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <h2 className="text-xl font-semibold text-gray-800">Payment Terms</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global / Default Terms */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Global / Default Terms
          </h3>

          <div className="space-y-3">
            {globalTerms.map((term) => (
              <div
                key={term._id}
                className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 hover:shadow-sm transition"
              >
                <div className="font-medium text-gray-800">{term.name}</div>

                <div className="text-sm text-gray-500 mt-1">
                  Credit Days: {term.creditDays}
                </div>

                <div className="text-sm text-gray-500">
                  Reminders: {term.reminderOffsets.join(", ")} days before
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Payment Terms */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Custom Payment Terms
            </h3>

            <button
              onClick={() => setShowTemplateCreationModal(true)}
              className="flex items-center gap-1 text-sm bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-900 transition"
            >
              <Plus size={16} />
              Add Custom Term
            </button>
          </div>

          {customTerms.length === 0 ? (
            <p className="text-sm text-gray-400">
              No custom payment terms created yet.
            </p>
          ) : (
            <div className="space-y-3">
              {customTerms.map((term) => (
                <div
                  key={term._id}
                  className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-800">{term.name}</div>
                    <div className="text-sm text-gray-500">
                      Reminders:{" "}
                      {term.reminderOffsets.map(
                        (d, index) =>
                          `${d}${term.reminderOffsets.length - 1 == index ? "" : ","}`,
                      )}{" "}
                      days before
                    </div>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <button
                      onClick={() => handleEdit(term)}
                      className="text-black hover:underline hover:text-blue-500"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDeleteClick(term._id)}
                      className="text-black hover:underline hover:text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showTemplateCreationModal && (
        <div ref={templateCreationRef}>
          <PaymentReminderTemplateCreationModel
            editingTerm={editingTerm}
            handleClose={() => {
              (setShowTemplateCreationModal(false), setEditingTerm(null));
            }}
            handleSubmit={handleCreationSubmit}
            loading={submitting}
          />
        </div>
      )}
      {confirmOpen && (
        <ConfirmModal
          open={confirmOpen}
          onClose={() => { setConfirmOpen(false); setToBeDeletedId(null); }}
          onConfirm={handleDeleteConfirm}
          message="Are you sure you want to delete this payment term?"
        />
      )}
    </div>
  );
}
