import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { addDueToCustomer, addPaymentForCustomer, editCustomerDue, getCustomerById, getCustomerTransactions } from "../utils/service/customerService";

export default function CustomerDetail() {
  const { id } = useParams(); // expects route like /customers/:id
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal states
  const [showAddBill, setShowAddBill] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [form, setForm] = useState({ amount: "", note: "" });

  useEffect(() => {
    async function load() {
      try {
        // Load customer basic info from your existing endpoint
        const custData = await getCustomerById(id);
        setCustomer(custData.data.customer || custData.data);

        // load transactions
        const tx = await getCustomerTransactions(id);
        setTransactions(tx.data?.transactions || tx.transactions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleAddBill = async (e) => {
    e.preventDefault();
    try {
      const data = await addDueToCustomer(id, { amount: Number(form.amount), note: form.note });
      setCustomer(c => ({ ...c, currentDue: data.data?.currentDue || data.currentDue }));
      setTransactions(t => [data.data?.transaction || data.transaction, ...t]);
      setShowAddBill(false);
      setForm({ amount: "", note: "" });
    } catch (err) {
      alert(err.message || "Error");
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      const data = await addPaymentForCustomer(id, { amount: Number(form.amount), note: form.note });
      setCustomer(c => ({ ...c, currentDue: data.data?.currentDue || data.currentDue }));
      setTransactions(t => [data.data?.transaction || data.transaction, ...t]);
      setShowPay(false);
      setForm({ amount: "", note: "" });
    } catch (err) {
      alert(err.message || "Error");
    }
  };

  const handleEditDue = async (e) => {
    e.preventDefault();
    try {
      const data = await editCustomerDue(id, { correctedDue: Number(form.amount), note: form.note });
      setCustomer(c => ({ ...c, currentDue: data.data?.currentDue || data.currentDue }));
      setTransactions(t => [data.data?.transaction || data.transaction, ...t]);
      setShowEdit(false);
      setForm({ amount: "", note: "" });
    } catch (err) {
      alert(err.message || "Error");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!customer) return <div>No customer found</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold">{customer.name || customer.fullName || "Customer"}</h2>
      <p className="text-sm text-gray-600">{customer.email}</p>
      <div className="mt-4">
        <div className="text-lg">
          Current Due: <strong>₹{Number(customer.currentDue || 0).toFixed(2)}</strong>
        </div>

        <div className="mt-3 space-x-2">
          <button onClick={() => setShowAddBill(true)} className="px-3 py-1 bg-blue-600 text-white rounded">Add Bill</button>
          <button onClick={() => setShowPay(true)} className="px-3 py-1 bg-green-600 text-white rounded">Record Payment</button>
          <button onClick={() => setShowEdit(true)} className="px-3 py-1 bg-yellow-500 text-white rounded">Edit Due</button>
        </div>
      </div>

      <section className="mt-6">
        <h3 className="text-lg font-medium mb-2">Transactions</h3>
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="text-left">
              <th className="p-2">Type</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Prev Due</th>
              <th className="p-2">New Due</th>
              <th className="p-2">Date</th>
              <th className="p-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx._id} className="border-t">
                <td className="p-2">{tx.type}</td>
                <td className="p-2">₹{Number(tx.amount).toFixed(2)}</td>
                <td className="p-2">₹{Number(tx.previousDue).toFixed(2)}</td>
                <td className="p-2">₹{Number(tx.newDue).toFixed(2)}</td>
                <td className="p-2">{new Date(tx.createdAt).toLocaleString()}</td>
                <td className="p-2">{(tx.metadata && tx.metadata.note) || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Add Bill Modal */}
      {showAddBill && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <form className="bg-white p-6 rounded shadow" onSubmit={handleAddBill}>
            <h4 className="text-lg mb-2">Add Bill (Increase Due)</h4>
            <input className="border p-2 w-full mb-2" placeholder="Amount" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
            <textarea className="border p-2 w-full mb-2" placeholder="Note" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowAddBill(false)} className="px-3 py-1">Cancel</button>
              <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Add</button>
            </div>
          </form>
        </div>
      )}

      {/* Payment Modal */}
      {showPay && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <form className="bg-white p-6 rounded shadow" onSubmit={handlePayment}>
            <h4 className="text-lg mb-2">Record Payment</h4>
            <input className="border p-2 w-full mb-2" placeholder="Amount" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
            <textarea className="border p-2 w-full mb-2" placeholder="Note" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowPay(false)} className="px-3 py-1">Cancel</button>
              <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded">Pay</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Due Modal */}
      {showEdit && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <form className="bg-white p-6 rounded shadow" onSubmit={handleEditDue}>
            <h4 className="text-lg mb-2">Edit Due (Correction)</h4>
            <input className="border p-2 w-full mb-2" placeholder="Corrected Due" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
            <textarea className="border p-2 w-full mb-2" placeholder="Note" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowEdit(false)} className="px-3 py-1">Cancel</button>
              <button type="submit" className="px-3 py-1 bg-yellow-500 text-white rounded">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}