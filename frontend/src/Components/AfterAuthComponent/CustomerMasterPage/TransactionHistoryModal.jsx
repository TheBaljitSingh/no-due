import { X } from "lucide-react";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { addDueToCustomer, addPaymentForCustomer, editCustomerDue, getCustomerById, getCustomerTransactions } from "../../../utils/service/customerService";


export default function TransactionHistoryModal({
  customer,
  setCurrentCustomer, //setter for customers
  handleClose,
  transactions, setTransactions
 
}) {
  if (!customer) return null;

  console.log(transactions);

  const [activeTab, setActiveTab] = useState("VIEW");
  const [form, setForm] = useState({ amount: "", note: "" , lastDuePaymentDate : ""});

  // Badge style function
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


  //this will be the function that handle requirement or call apis
    const handleAddBill = async () => {
      
      try {
        const data = await addDueToCustomer(customer._id, { amount: Number(form.amount), note: form.note,lastDuePaymentDate : form.lastDuePaymentDate });
        setCurrentCustomer(c => ({ ...c, currentDue: data.data?.currentDue || data.currentDue }));
        setTransactions(t => [data.data?.transaction || data.transaction, ...t]);
        // setShowAddBill(false);
        setForm({ amount: "", note: "" });
        setActiveTab("VIEW");

      } catch (err) {
        console.log(err.message || "Error");
      }
    };
  
    const handlePayment = async () => {
      
      try {
        const data = await addPaymentForCustomer(customer._id, { amount: Number(form.amount), note: form.note });
        setCurrentCustomer(c => ({ ...c, currentDue: data.data?.currentDue || data.currentDue }));
        setTransactions(t => [data.data?.transaction || data.transaction, ...t]);
        // setShowPay(false);
        setForm({ amount: "", note: "" });
        setActiveTab("VIEW");
      } catch (err) {
        console.log(err.message || "Error");
      }
    };
  
    const handleEditDue = async () => {
      
      try {
        const data = await editCustomerDue(customer._id, { correctedDue: Number(form.amount), note: form.note });
        setCurrentCustomer(c => ({ ...c, currentDue: data.data?.currentDue || data.currentDue }));
        setTransactions(t => [data.data?.transaction || data.transaction, ...t]);
        // setShowEdit(false);
        setForm({ amount: "", note: "" });
        setActiveTab("VIEW");
      } catch (err) {
        console.log(err.message || "Error");
      }
    };

  // Render dynamic content based on tab
  const renderTabContent = () => {
    switch (activeTab) {

      case "VIEW":
        return (
          <div className="max-h-90 overflow-y-auto scroll-smooth">   {/* <-- add height */}
          {/* <table className="w-full rounded-lg text-sm outline-none"> */}
          <table className="w-full rounded-lg text-sm outline-none">

            <thead className="bg-gray-50 text-gray-600 text-xs uppercase  sticky top-0 z-10">
              <tr>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-right">Amount</th>
                <th className="p-2 text-right">Prev Due</th>
                <th className="p-2 text-right">New Due</th>
                 <th className="p-2 text-left">Last Payment Date</th>
                <th className="p-2 text-left">Created At</th>
                <th className="p-2 text-left">Note</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-2 w-24 justify-start items-center ">{getActionBadge(tx.type)}</td>
                  <td className="p-2 text-right font-medium">₹{tx.amount}</td>
                  <td className="p-2 text-right">₹{tx.previousDue}</td>
                  <td className="p-2 text-right font-semibold">₹{tx.newDue}</td>
                   <td className="p-2 whitespace-nowrap">
                    {tx.lastDuePaymentDate ? new Date(tx.lastDuePaymentDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                  <td className="p-2">{tx?.metadata?.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

  {transactions.length === 0 && (
    <p className="text-center py-6 text-gray-500">No transactions found.</p>
  )}
</div>

        );

      case "ADD_DUE":
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddBill(form);
              setForm({ amount: "", note: "" });
            }}
            className="space-y-3"
          >
            <input
              type="number"
              placeholder="Amount"
              className="w-full border shadow-accertinity inline px-4 py-3 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 
                         focus:border-gray-300 focus:bg-gray-100 border-transparent 
                         transition-all duration-200 outline-none"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />

            <textarea
              placeholder="Note"
              className="w-full border shadow-accertinity inline px-4 py-3 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 
                         focus:border-gray-300 focus:bg-gray-100 border-transparent 
                         transition-all duration-200 outline-none"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />

            <input
              type="date"
              placeholder="Last Due Payment Date"
              className="w-full border shadow-accertinity inline px-4 py-3 rounded-xl
                          focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2
                          focus:border-gray-300 focus:bg-gray-100 border-transparent
                          transition-all duration-200 outline-none"
              value={form.lastDuePaymentDate}
              onChange={(e) => setForm({ ...form, lastDuePaymentDate: e.target.value })}
            />

            <button className="bg-green-600 text-white px-4 py-2 rounded-lg w-full border-none">
              Add Due
            </button>
          </form>
        );

     
      case "PAY":
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePayment(form);
              setForm({ amount: "", note: "" });
            }}
            className="space-y-3"
          >
            <input
              type="number"
              placeholder="Payment Amount"
              className="w-full border shadow-accertinity inline px-4 py-3 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 
                         focus:border-gray-300 focus:bg-gray-100 border-transparent 
                         transition-all duration-200 outline-none"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />

            <textarea
              placeholder="Note"
              className="w-full border shadow-accertinity inline px-4 py-3 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 
                         focus:border-gray-300 focus:bg-gray-100 border-transparent 
                         transition-all duration-200 outline-none"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />

            <button  className="bg-green-600 text-white px-4 py-2 rounded-lg w-full border-none">
              Record Payment
            </button>
          </form>
        );

      default:
        return null;
    }

  };


  // if(loading) return <div>Loading...</div>

  // return;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-start py-12 z-50">
      
      <div className="w-11/12 md:w-3/4 lg:w-1/2 bg-white rounded-xl shadow-xl relative animate-fadeIn max-h-[80vh] overflow-hidden">

        {/* Close */}
        <button
          onClick={()=>{
            //before closing i want to set the customerData for particular id
              
            handleClose()
          }}
          className="absolute top-4 right-4 bg-white rounded-full p-2 shadow hover:shadow-md transition"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <h2 className="text-xl font-semibold">
            Transaction History • {customer.name}
          </h2>

          {/* CURRENT DUE */}
          <p className="text-lg font-bold text-gray-700 mt-1">
            Current Due: ₹{customer.currentDue || 0}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 ">
            <button
              onClick={() => setActiveTab("VIEW")}
              className={`px-3 py-1 rounded-lg border-none hover:cursor-pointer ${
                activeTab === "VIEW" ? "bg-gray-600 text-white" : "bg-gray-100"
              }`}
            >
              View
            </button>

            <button
              onClick={() => setActiveTab("ADD_DUE")}
              className={`px-3 py-1 rounded-lg border-none hover:cursor-pointer ${
                activeTab === "ADD_DUE" ? "bg-green-600 text-white" : "bg-green-100"
              }`}
            >
              Add Due
            </button>


            <button
              onClick={() => setActiveTab("PAY")}
              className={`px-3 py-1 rounded-lg border-none  ml-auto mr-4 hover:cursor-pointer ${
                activeTab === "PAY" ? "bg-green-600 text-white" : "bg-green-100"
              }`}
            >
              Receive Payment
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="overflow-y-auto max-h-[60vh] px-6 py-4">
          {renderTabContent()}
        </div>

      </div>
    </div>
  );
}
