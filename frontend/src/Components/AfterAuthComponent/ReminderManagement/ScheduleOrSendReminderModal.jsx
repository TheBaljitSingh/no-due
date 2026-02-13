import React, { useMemo, useState, useEffect } from "react";
import { X, Search, Calendar, Send, User, CreditCard, MessageSquare } from "lucide-react";
import { getCustomers, getCustomerTransactions } from "../../../utils/service/customerService";
import { formatDate } from '../../../utils/AfterAuthUtils/Helpers';

export default function ScheduleOrSendReminderModal({
  open,
  onClose,
  onSubmit,
}) {
  // ----------------------------------
  // STATE: Data & Selection
  // ----------------------------------
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // ----------------------------------
  // STATE: Form / Actions
  // ----------------------------------
  const [mode, setMode] = useState("schedule"); // 'schedule' | 'now'
  const [scheduleDate, setScheduleDate] = useState("");
  const [template, setTemplate] = useState(""); // Will be auto-selected based on due date

  // User's configured template names
  const [configuredTemplates, setConfiguredTemplates] = useState({
    beforeDue: '',
    dueToday: '',
    overdue: ''
  });

  // ----------------------------------
  // CONSTANTS: 3 Default Templates
  // ----------------------------------
  const TEMPLATE_OPTIONS = {
    nodue_before_due_1: {
      label: "Before Due Reminder",
      value: "nodue_before_due_1",
      preview: "Hi {{1}} 👋,\n\nThis is a reminder that ₹{{2}} is due on {{3}}.\n\nPlease make the payment at your convenience.\n\nThank you!"
    },
    nodue_due_today_1: {
      label: "Due Today Reminder",
      value: "nodue_due_today_1",
      preview: "Hi {{1}} 👋,\n\nThis is a reminder that ₹{{2}} is due TODAY ({{3}}).\n\nKindly make the payment at your earliest convenience.\n\nThank you!\n{{4}}"
    },
    nodue_overdue_1: {
      label: "Overdue Reminder",
      value: "nodue_overdue_1",
      preview: "Hi {{1}} 👋,\n\nThis is a follow-up regarding ₹{{2}}, which was due on {{3}} and is currently pending.\n\nPlease make the payment at your earliest convenience.\n\nThank you!\n{{4}}"
    }
    ,
    interactive_before_due1: {
      label: "Interactive Before",
      value: "interactive_before_due1",
      preview: "Dear {{name}} 👋, \n This is a reminder that ₹{{amount}} is due on {{duedate}}. Please let us know your payment plan by selecting an option below. If payment has already been made, please ignore this message. \n Thanks, From {{companyname}} team"
    },
    interactive_due_today: {
      label: "Interactive Today",
      value: "interactive_due_today",
      preview: "Dear {{name}},\n This is a reminder that ₹{{amount}} is due today ({{duedate}}).\n Kindly update the payment status by selecting an option below. \n If payment has already been made, please ignore this message. \n Thanks,\n From {{companyname}} team"

    },
    interactive_overdue: {
      label: "Interactive overdue",
      value: "interactive_overdue",
      preview: "Dear {{name}},\n This is a follow-up regarding ₹{{amount}}, which was due on {{duedate}} and is currently pending. \n Please select an option below to update the payment status. \n If payment has already been made, please ignore this message. \n Thanks, n From {{companyname}} team"
    }
  };

  // ----------------------------------
  // EFFECTS: Fetch user's configured templates
  // ----------------------------------
  useEffect(() => {
    const fetchConfiguredTemplates = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/whatsapp/template-config`, {
          credentials: 'include'
        });
        const data = await res.json();
        console.log("called the config template api")
        if (data.success && data.data) {
          console.log("template data.data", data.data);
          setConfiguredTemplates(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch configured templates", error);
      }
    };
    fetchConfiguredTemplates();
  }, []);

  // ----------------------------------
  // EFFECTS: Auto-select template based on due date
  // ----------------------------------
  useEffect(() => {

    console.log("configuredTemplates", configuredTemplates);

    if (selectedTransaction && configuredTemplates) {
      const dueDate = new Date(selectedTransaction.dueDate);
      const today = new Date();

      // Normalize dates to compare only date part (not time)
      dueDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      let autoTemplate;
      if (dueDate > today) {
        // Due date is in the future - use configured beforeDue template
        autoTemplate = configuredTemplates.beforeDue || "nodue_before_due_1";
      } else if (dueDate.getTime() === today.getTime()) {
        // Due date is today - use configured dueToday template
        autoTemplate = configuredTemplates.dueToday || "nodue_due_today_1";
      } else {
        // Due date has passed (overdue) - use configured overdue template
        autoTemplate = configuredTemplates.overdue || "nodue_overdue_1";
      }

      setTemplate(autoTemplate);
    }
  }, [selectedTransaction, configuredTemplates]);

  // ----------------------------------
  // EFFECTS: Fetch Data
  // ----------------------------------
  useEffect(() => {
    if (open) {
      // Reset states when opening
      setQuery("");
      setSelectedUser(null);
      setTransactions([]);
      setSelectedTransaction(null);
      setMode("schedule");
      setScheduleDate("");
      setTemplate("");

      async function fetchCus() {
        try {
          const res = await getCustomers();
          setCustomers(res?.data?.customers || []);
        } catch (err) {
          console.error("Failed to fetch customers", err);
        }
      }
      fetchCus();
    }
  }, [open]);

  // ----------------------------------
  // HANDLERS
  // ----------------------------------
  const handleSelectUser = async (u) => {
    setSelectedUser(u);
    setSelectedTransaction(null); // Reset transaction when user changes
    setTransactions([]); // Clear old txns while loading

    try {
      const res = await getCustomerTransactions(u._id);
      // Assuming backend returns object with { dues: [...] }
      setTransactions(res.data.dues || []);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    }
  };

  const handleSelectTransaction = (tx) => {
    console.log('clicked on select transaction', tx)
    setSelectedTransaction(tx);
  }

  const handleSubmit = () => {
    if (!selectedTransaction || !template) return;

    // Prepare template variables based on selected template
    const variables = [
      selectedUser.name,
      selectedTransaction.remainingDue.toString(),
      formatDate(selectedTransaction.dueDate)
    ];

    // Add company name for due_today and overdue templates
    if (template === "nodue_due_today_1" || template === "nodue_overdue_1") {
      variables.push("No Due"); // You can make this dynamic from user settings
    }

    onSubmit?.({
      transactionId: selectedTransaction._id,
      // mode,
      // scheduleDate: mode === "schedule" ? scheduleDate : null,
      // templateName: template,
      // variables: variables
      // i can send custom template language en or en_US
    });
  };

  // ----------------------------------
  // COMPUTED
  // ----------------------------------
  const filteredCustomers = useMemo(() => {
    if (!query) return customers;
    return customers.filter((u) =>
      `${u.name} ${u.mobile}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, customers]);

  const previewMessage = useMemo(() => {
    if (!template || !selectedTransaction || !selectedUser) return "";

    const templateData = TEMPLATE_OPTIONS[template];
    if (!templateData) return "";

    let preview = templateData.preview;
    preview = preview.replace("{{name}}", selectedUser.name);
    preview = preview.replace("{{amount}}", selectedTransaction.remainingDue);
    preview = preview.replace("{{duedate}}", formatDate(selectedTransaction.dueDate));
    preview = preview.replace("{{companyname}}", "No Due"); // Company name

    return preview;
  }, [template, selectedTransaction, selectedUser]);


  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Main Modal Container - Wider for 3 columns */}
      <div className="flex h-[90vh] w-full max-w-[95vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl md:max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Reminder Management</h2>
            <p className="text-xs text-gray-500">Select a customer, choose a transaction, and schedule a reminder.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Body: 3-Column Layout */}
        <div className="flex-1 overflow-hidden">
          <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-12 divide-x divide-gray-200">

            {/* -------------------------------------------------------------
                COLUMN 1: Customer List (Span 3)
               ------------------------------------------------------------- */}
            <div className="col-span-1 md:col-span-3 flex flex-col bg-gray-50/50 min-h-0">
              <div className="p-4 border-b bg-white">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name or mobile..."
                    className="w-full rounded-lg border bg-gray-50 pl-9 pr-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredCustomers.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => handleSelectUser(u)}
                    className={`group w-full rounded-lg border px-4 py-3 text-left transition-all hover:border-green-200 hover:bg-white hover:shadow-sm
                      ${selectedUser?._id === u._id
                        ? "border-green-500 bg-green-50 ring-1 ring-green-500"
                        : "border-transparent"}
                    `}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-semibold ${selectedUser?._id === u._id ? 'text-green-800' : 'text-gray-700'}`}>
                        {u.name}
                      </span>
                      {u.currentDue > 0 && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          ₹{u.currentDue}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <User size={12} />
                      {u.mobile || "No mobile"}
                    </div>
                  </button>
                ))}

                {filteredCustomers.length === 0 && (
                  <div className="py-10 text-center text-sm text-gray-400">
                    No customers found.
                  </div>
                )}
              </div>
            </div>


            {/* -------------------------------------------------------------
                COLUMN 2: Transaction List (Span 4)
               ------------------------------------------------------------- */}
            <div className="col-span-1 md:col-span-4 flex flex-col bg-white min-h-0">
              <div className="border-b px-6 py-4 flex items-center gap-2">
                <CreditCard size={18} className="text-gray-400" />
                <h3 className="font-semibold text-gray-700">Transactions</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {!selectedUser ? (
                  <div className="flex h-full flex-col items-center justify-center text-gray-400 gap-2">
                    <User size={48} className="opacity-20" />
                    <p className="text-sm">Select a customer to view transactions</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-gray-400 gap-2">
                    <div className="rounded-full bg-green-50 p-3">
                      <CreditCard size={24} className="text-green-600 opacity-50" />
                    </div>
                    <p className="text-sm">No pending transactions found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      tx.remainingDue > 0 && (
                        //only showing if remaining due is greater than 0
                      <div
                        key={tx._id}
                        onClick={() => handleSelectTransaction(tx)}
                        className={`cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md 
                                      ${selectedTransaction?._id === tx._id
                            ? "border-green-500 bg-green-50 ring-1 ring-green-500"
                            : "border-gray-200 hover:border-green-200"
                          }
                                  `}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="text-lg font-bold text-gray-800">₹{tx?.remainingDue}</span>
                            {/* You can add more badges here if tx logic requires it */}
                          </div>
                          <div className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {formatDate(tx.createdAt)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={14} />
                          <span>Due: {formatDate(tx.dueDate)}</span>
                        </div>
                      </div>)
                    ))}
                  </div>
                )}
              </div>
            </div>


            {/* -------------------------------------------------------------
                COLUMN 3: Actions & Preview (Span 5)
               ------------------------------------------------------------- */}


           <div className="col-span-1 md:col-span-5 flex flex-col bg-gray-50/30 h-full min-h-0">

  {/* ================= HEADER ================= */}
  <div className="border-b px-6 py-4 flex items-center gap-2 shrink-0">
    <h3 className="font-semibold text-gray-700">Preview & Send</h3>
  </div>


  {/* ================= SCROLLABLE AREA ================= */}
  <div className="flex-1 overflow-y-auto p-6 min-h-0">

    {!selectedTransaction ? (
      <div className="flex h-full flex-col items-center justify-center text-gray-400 gap-3">
        <Send size={48} className="opacity-20" />
        <p className="text-sm">Select a transaction to proceed</p>
      </div>
    ) : (
      <div className="space-y-6">

        {/* Mode Selection */}
        <div className="rounded-xl border bg-white p-1 shadow-sm">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setMode("schedule")}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all
                ${mode === "schedule"
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
                }`}
            >
              <Calendar size={16} /> Schedule
            </button>

            <button
              onClick={() => setMode("now")}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all
                ${mode === "now"
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
                }`}
            >
              <Send size={16} /> Send Now
            </button>
          </div>
        </div>

        {mode === "schedule" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wider">
              Schedule Date
            </label>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>
        )}

        {/* Template */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wider">
            Template
          </label>

          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          >
            <option value="">Select a template...</option>
            {Object.values(TEMPLATE_OPTIONS).map((tmpl) => (
              <option key={tmpl.value} value={tmpl.value}>
                {tmpl.label}
              </option>
            ))}
          </select>
        </div>

        {/* Preview */}
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-500 uppercase tracking-wider">
            Message Preview
          </label>

          <div className="relative rounded-xl border border-gray-200 bg-white max-h-48">
            <div className="absolute top-0 left-0 h-1 w-full bg-green-500"></div>
            <div className="p-4 max-h-40 overflow-y-auto">
              <div className="whitespace-pre-line text-sm text-gray-700 leading-relaxed">
                {previewMessage}
              </div>
            </div>
            <div className="bg-gray-50 p-2 text-center text-[10px] text-gray-400 uppercase tracking-widest border-t">
              WhatsApp Preview
            </div>
          </div>
        </div>

      </div>
    )}
  </div>


  {/* ================= FIXED FOOTER ================= */}
  {selectedTransaction && (
    <div className="border-t bg-white p-4 shrink-0">
      <button
        onClick={handleSubmit}
        disabled={!selectedTransaction || (mode === "schedule" && !scheduleDate)}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white shadow-lg shadow-green-200 transition-all hover:scale-[1.02] hover:bg-green-700 disabled:opacity-50"
      >
        <Send size={18} />
        {mode === "now" ? "Send Reminder Now" : "Schedule Reminder"}
      </button>
    </div>
  )}

</div>



          </div>
        </div>

      </div>
    </div>
  );
}
