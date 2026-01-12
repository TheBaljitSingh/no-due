import { X } from "lucide-react";
import React, { useState, useEffect } from "react";
import {
  addDueToCustomer,
  addPaymentForCustomer,
} from "../../../utils/service/customerService";

export default function TransactionHistoryModal({
  customer,
  setCurrentCustomer,
   transactions,
  setTransactions,
  handleClose,
}) {
  if (!customer) return null;

  console.log("customer",customer,"\n");
  console.log("transaction",transactions,"\n");
  
  const [activeTab, setActiveTab] = useState("VIEW");
  const [form, setForm] = useState({ amount: "", note: "", lastDuePaymentDate: "" });
  const [selectedDue, setSelectedDue] = useState(null); // selected due for PAY tab

  const getActionBadge = (type) => {
    const base = "px-2 py-0.5 rounded-full text-xs font-medium";
    switch (type) {
      case "DUE_ADDED":
        return <span className={`${base} bg-blue-100 text-blue-700`}>Due Added</span>;
      case "PAYMENT":
        return <span className={`${base} bg-green-100 text-green-700`}>Payment</span>;
      case "DUE_EDITED":
        return <span className={`${base} bg-yellow-100 text-yellow-700`}>Due Edited</span>;
      default:
        return <span className={`${base} bg-gray-100 text-gray-700`}>{type}</span>;
    }
  };

  // ADD_DUE handler
  const handleAddDue = async () => {
    try {
      const data = await addDueToCustomer(customer._id, {
        amount: Number(form.amount),
        note: form.note,
      });
      console.log("data afte adding due", data);
      setTransactions((prev) => [data.data.transaction, ...prev]);
      //i have to add remaining due after accumulating all dues amoung
      setCurrentCustomer((c) => ({ ...c, currentDue: c.currentDue + Number(form.amount) }));
      setForm({ amount: "", note: "", lastDuePaymentDate: "" });
      setActiveTab("VIEW");
    } catch (err) {
      console.error(err);
    }
  };

  // PAY handler
  const handlePayment = async () => {
    if (!selectedDue) return alert("Select a due to pay.");
    try {
      const data = await addPaymentForCustomer(customer._id, {
        amount: Number(form.amount),
        note: form.note,
        dueTransactionId: selectedDue._id,
      });

      // Update due in state
      setTransactions((prev) =>
        prev.map((d) =>
          d._id === selectedDue._id
            ? {
              ...d,
              remainingDue: data.data.due.remainingDue, // this is total remainingDue
              payments: [
                data.data?.payment || data.payment,
                ...(Array.isArray(d.payments) ? d.payments : [])
              ]
            }
            : d
        )
      );

      // Update customer's total due
      setCurrentCustomer((c) => ({
        ...c,
        currentDue: c.currentDue - Number(form.amount),
      }));

      setForm({ amount: "", note: "", lastDuePaymentDate: "" });
      setActiveTab("VIEW");
    } catch (err) {
      console.error(err);
    }
  };

  // Render content for each tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "VIEW":
        if (transactions.length === 0)
          return <p className="text-center py-6 text-gray-500">No dues found.</p>;

        return (
          <div className="max-h-90 overflow-y-auto scroll-smooth space-y-4">
            {transactions.map((due) => {
              let runningRemaining = due.amount;

              return (
                <div key={due._id} className="border rounded-lg p-4">
                  {/* Due Summary */}
                  <div className="mb-3">
                    <p className="font-semibold">Due Amount: ₹{due.amount}</p>
                    <p className="text-sm text-gray-600">
                      Remaining: ₹{due.remainingDue}
                    </p>
                    <p className="text-sm">
                      Due Date: {new Date(due.dueDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm">Status: {due.paymentStatus}</p>
                  </div>

                  {/* Ledger Table */}
                  {due.payments?.length > 0 && (
                    <table className="w-full text-sm mt-2 border-t">
                      <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                        <tr>
                          <th className="p-2 text-left">Type</th>
                          <th className="p-2 text-right">Due Before</th>
                          <th className="p-2 text-right">Paid</th>
                          <th className="p-2 text-right">Remaining</th>
                          <th className="p-2 text-left">Note</th>
                          <th className="p-2 text-left">Date</th>
                        </tr>
                      </thead>

                      <tbody>
                        {(() => {
                          let runningRemaining = due.amount;

                          // Step 1: build ledger rows in correct order
                          const rows = due.payments.map((tx) => {
                            const dueBeforePayment = runningRemaining;
                            runningRemaining -= tx.amount;

                            return {
                              tx,
                              dueBeforePayment,
                              remainingAfter: runningRemaining,
                            };
                          });

                          // Step 2: reverse for UI (latest on top)
                          return rows.reverse().map(({ tx, dueBeforePayment, remainingAfter }) => (
                            <tr
                              key={tx._id}
                              className="border-b hover:bg-gray-50 transition"
                            >
                              <td className="p-2">{getActionBadge(tx.type)}</td>

                              <td className="p-2 text-right font-medium">
                                ₹{dueBeforePayment}
                              </td>

                              <td className="p-2 text-right text-green-700 font-semibold">
                                ₹{tx.amount}
                              </td>

                              <td className="p-2 text-right font-semibold">
                                ₹{remainingAfter}
                              </td>

                              <td className="p-2">
                                {tx?.metadata?.note || "-"}
                              </td>

                              <td className="p-2">
                                {new Date(tx.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}

          </div>
        );

      case "ADD_DUE":
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddDue();
            }}
            className="space-y-3"
          >
            <input
              type="number"
              placeholder="Amount"
              className="w-full border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />

            <textarea
              placeholder="Note"
              className="w-full border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg w-full">Add Due</button>
          </form>
        );

      case "PAY":
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePayment();
            }}
            className="space-y-3"
          >
            <select
              className="w-full border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300"
              value={selectedDue?._id || ""}
              onChange={(e) => setSelectedDue(transactions.find((d) => d._id === e.target.value))}
            >
              <option value="">Select a due</option>
              {transactions
                .filter((d) => d.remainingDue > 0)
                .map((due) => (
                  <option key={due._id} value={due._id}>
                    ₹{due.remainingDue} - Due on {new Date(due.dueDate).toLocaleDateString()}
                  </option>
                ))}
            </select>

            <input
              type="number"
              placeholder="Payment Amount"
              className="w-full border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />

            <textarea
              placeholder="Note"
              className="w-full border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />

            <button className="bg-green-600 text-white px-4 py-2 rounded-lg w-full">Pay Due</button>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-start py-12 z-50">
      <div className="w-11/12 md:w-3/4 lg:w-1/2 bg-white rounded-xl shadow-xl relative animate-fadeIn max-h-[80vh] overflow-hidden">
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 bg-white rounded-full p-2 shadow hover:shadow-md transition"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <h2 className="text-xl font-semibold">Transaction History • {customer.name}</h2>
          <p className="text-lg font-bold text-gray-700 mt-1">
            Current Due: ₹{customer.currentDue || 0}
          </p>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab("VIEW")}
              className={`px-3 py-1 rounded-lg ${activeTab === "VIEW" ? "bg-gray-600 text-white" : "bg-gray-100"
                }`}
            >
              View
            </button>
            <button
              onClick={() => setActiveTab("ADD_DUE")}
              className={`px-3 py-1 rounded-lg ${activeTab === "ADD_DUE" ? "bg-green-600 text-white" : "bg-green-100"
                }`}
            >
              Add Due
            </button>
            <button
              onClick={() => setActiveTab("PAY")}
              className={`px-3 py-1 rounded-lg ml-auto ${activeTab === "PAY" ? "bg-green-600 text-white" : "bg-green-100"
                }`}
            >
              Pay
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] px-6 py-4">{renderTabContent()}</div>
      </div>
    </div>
  );
}