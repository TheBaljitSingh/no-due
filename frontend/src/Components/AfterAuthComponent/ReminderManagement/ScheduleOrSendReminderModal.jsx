  import React, { useMemo, useState, useEffect } from "react";
  import { X, Search, Calendar, Send } from "lucide-react";
  import {getAllcustomers, getCustomers, getCustomerTransactions} from "../../../utils/service/customerService"
  import { formatDate } from '../../../utils/AfterAuthUtils/Helpers'

  export default function ScheduleOrSendReminderModal({
    open,
    onClose,
    onSubmit,
  }) {
    if (!open) return null;


      useEffect(()=>{

      async function fetchCus(){
        const res = await getCustomers();
        console.log(res?.data?.customers);
        setCustomers(res?.data?.customers);
      }

      fetchCus();

    },[]);


    const [query, setQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [mode, setMode] = useState("schedule"); // schedule | now
    const [scheduleDate, setScheduleDate] = useState("");
    const [template, setTemplate] = useState("");
    const [customers, setCustomers] = useState([]);

    const TEMPLATE_PREVIEWS = {
      nodue_remainder_1: // this is for the today template
        "Remainder! \n Hi {{customer_first_name}} 👋, \n Just a reminder that your payment of ₹{{amount}} is due today ({{due_date}}). \nKindly make the payment at your convenience.\n Thank you!",
      nodue_remainder_2:
        "Hello {{name}}, your outstanding balance of ₹{{amount}} is overdue. Kindly clear it to avoid inconvenience.",
    };

    
    useEffect(()=>{
      console.log(template);
    },[template])


    const filteredCustomers = useMemo(() => {
      if (!query) return [];
      return customers.filter((u) =>
        `${u.name} ${u.mobile}`.toLowerCase().includes(query.toLowerCase())
      );
    }, [query, customers]);

    const previewMessage = useMemo(() => {
      if (!template || !selectedUser) return "";

      return TEMPLATE_PREVIEWS[template]
        ?.replace("{{customer_first_name}}", selectedUser.name)
        ?.replace("{{amount}}", selectedUser.currentDue)
        ?.replace("{{due_date}}", selectedUser.lastDuePaymentDate)
    }, [template, selectedUser]);

    const handleSubmit = () => {
      if (!selectedUser || !template) return;

      onSubmit?.({
        userId: selectedUser._id,
        transactionId: selectedUser.lastTransaction,
        templateName: template,
        mode,
        variables:[selectedUser.name,selectedUser.currentDue, selectedUser.lastDuePaymentDate],
        scheduleDate: mode === "schedule" ? scheduleDate : null,
      });

    };



    const handleSelectUser = async (u)=>{

      //have to set current user with thair transactoin details
      // console.log(u);


      //have to fetch user tsx and append in user
      const response = await getCustomerTransactions(u._id);
      // console.log(response.data.transactions[0]);
      setSelectedUser({
        ...u,
        lastDuePaymentDate: formatDate(response?.data?.transactions[0].lastDuePaymentDate),
      });


    }


    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-lg font-semibold">Send / Schedule Reminder</h2>
            <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
            {/* Left: User Search */}
            <div className="rounded-xl border">
              <div className="flex items-center gap-2 border-b px-3 py-2">
                <Search size={16} className="text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search customer"
                  className="w-full text-sm outline-none"
                />
              </div>

              <div className="max-h-64 overflow-y-auto">
                {filteredCustomers.map((u) => (
                  <button
                    key={u._id}
                    onClick={()=>handleSelectUser(u)}
                    
                    className={`w-full border-b px-3 py-4 text-left text-sm hover:bg-gray-50  ${
                      selectedUser?._id === u._id ? "bg-green-50" : ""
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{u.name}</span>
                      <span className="text-red-600">₹{u.currentDue}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      mobile: {u.mobile || "—"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="space-y-4 rounded-xl border p-4">
              {selectedUser ? (
                <div className="rounded-lg bg-gray-50 p-3 text-sm">
                  <div className="font-medium">{selectedUser.name}</div>
                  <div className="text-gray-600">Mobile: {selectedUser.mobile}</div>
                  <div className="text-gray-600">Due: ₹{selectedUser.currentDue}</div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">Select a customer</div>
              )}

              {/* Mode toggle */}
              <div className="flex overflow-hidden rounded-lg border text-sm">
                <button
                  onClick={() => setMode("schedule")}
                  className={`flex-1 py-2 ${mode === "schedule" ? "bg-green-600 text-white" : ""}`}
                >
                  Schedule
                </button>
                <button
                  onClick={() => setMode("now")}
                  className={`flex-1 py-2 ${mode === "now" ? "bg-green-600 text-white" : ""}`}
                >
                  Send Now
                </button>
              </div>

              {/* Schedule date */}
              {mode === "schedule" && (
                <div>
                  <label className="text-xs text-gray-500">Schedule Date</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Template */}
              <div>
                <label className="text-xs text-gray-500">Template</label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">Select template</option>
                  <option value="nodue_remainder_1">Due Reminder 1</option>
                  <option value="nodue_remainder_2">Due Reminder 2</option>
                </select>
              </div>

              {/* PREVIEW PANEL */}
              {previewMessage && (
                <div className="rounded-lg border bg-gray-50 p-3 text-sm">
                  <div className="mb-1 text-xs font-medium text-gray-500">
                    Message Preview
                  </div>
                  <div className="text-gray-700 whitespace-pre-line">
                    {previewMessage}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t px-5 py-4">
            <button
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedUser || !template}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              <Send size={14} />
              {mode === "now" ? "Send Now" : "Schedule"}
            </button>
          </div>
        </div>
      </div>
    );
  }
