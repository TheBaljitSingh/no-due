import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Calendar, Clock, MessageCircle, Phone, Plus, Search, Send, Trash2, Pause, CheckCircle2, XCircle, Pencil, Copy, AlertCircle, Filter } from "lucide-react";
import { MOCK_REMINDERS, TEMPLATES } from "../../utils/constants";
import { currency2, IconBtn, statusChip, TabButton } from "../../utils/AfterAuthUtils/Helpers";
import StatCard from "../../Components/AfterAuthComponent/ReminderManagement/StatCard";
import EditDrawer from "../../Components/AfterAuthComponent/ReminderManagement/EditDrawer";
import { deleteReminder, getAllRemainders, scheduleReminder, sendReminderNow } from "../../utils/service/remainderService.js"
import ScheduleOrSendReminderModal from "../../Components/AfterAuthComponent/ReminderManagement/ScheduleOrSendReminderModal.jsx";
import { toast } from "react-toastify";


export default function ReminderManagement() {
  const [tab, setTab] = useState("pending");
  const [q, setQ] = useState("");
  const [bulk, setBulk] = useState(new Set());
  const [openNew, setOpenNew] = useState(false);
  const [drawer, setDrawer] = useState(null);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const fetchReminders = useCallback(async () => {
    try {
      const filters = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (tab !== 'all') {
        filters.status = tab;
      }

      const res = await getAllRemainders(filters);
      setData(res.data.data.data || []);
      setPagination(prev => ({ ...prev, ...res.data.data.meta }));

    } catch (error) {
      console.log(error);
      console.log("error while loading remainder data");
    }
  }, [pagination.page, pagination.limit, tab]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const normalizeData = useMemo(() => {
    return data.map((r) => ({
      id: r._id,
      customer: {
        name: r.customerId?.name || "-",
        mobile: r.customerId?.mobile || "-",
        company: "-", // not present yet
      },

      dueAmount: r.customerId.currentDue || 0,

      sendAt: r.scheduledFor,

      status: r.status === "pending" ? "scheduled" : r.status,

      template: r.whatsappTemplate?.name,

      channel: ["whatsapp"],

      raw: r,
    }));
  }, [data]);

  const filtered = useMemo(() => {
    return normalizeData.filter((r) => {
      
      const s = q.trim().toLowerCase();
      if (!s) return true;
      return (
        r.id.toLowerCase().includes(s) ||
        r.customer.name.toLowerCase().includes(s)
      );
    });
  }, [normalizeData, q]);

  const toggleBulk = (id) => {
    setBulk((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const stats = useMemo(() => ({
    scheduled: normalizeData.filter(r => r.status === "scheduled").length,
    sent: normalizeData.filter(r => r.status === "sent").length,
    failed: normalizeData.filter(r => r.status === "failed").length,
    responseRate: "41%"

  }), []);

  const handleSubmit = async (data) => {
    console.log("submitted", data);
    const { userId, templateName, mode, scheduleDate, transactionId, variables } = data;

    if (mode === 'schedule') {
      //call to schedule api
      const apiData = {};
      apiData.transactionId = transactionId;
      apiData.scheduledFor = scheduleDate;
      apiData.templateName = templateName;
      apiData.variables = variables;

      try {
        const response = await scheduleReminder(apiData);
        toast.success("remainder scheduled ");
        setOpenNew(false);

      } catch (error) {
        console.log(error);
        toast.error(error.response.data.errors[0] || error.message || "error while scheduling");

      }

    } else {
      //send now
      const apiData = {};
      apiData.transactionId = transactionId;
      apiData.templateName = templateName;
      apiData.variables = variables
      try {
        const response = await sendReminderNow(apiData);
        console.log(response);
        toast.success("remainder sent!");
        setOpenNew(false);

      } catch (error) {
        console.log(error);
        toast.error(error.response.data.errors[0] || error.message || "error while sending");
      }
    }

  }

  const handleDeleteReminder = async (rem) => {
    console.log("clicking the delete", rem)
    try {
      if (!rem?.id) {
        toast.error("Invalid reminder");
        return;
      }

      const res = await deleteReminder(rem.id);

      console.log(res);

      if (res?.success) {
        toast.success("Reminder deleted successfully");

        // OPTIONAL: update UI immediately
        setData(prev =>
          prev.filter(r => r._id !== rem.id)
        );
      } else {
        toast.error(res?.message || "Failed to delete reminder");
      }
    } catch (error) {
      console.error("Delete reminder error:", error);

      toast.error(
        error?.response?.data?.message || "Something went wrong"
      );
    }
  };

  const handleDrawerDeleteSuccess = (id) => {
    setData(prev => prev.filter(r => r._id !== id));
    setDrawer(null);
  };

  const handleDrawerRescheduleSuccess = () => {
    fetchReminders(); //instade of fetcing can i insert normally data here as i have to clicnet side, will work later
    setDrawer(null);
  };


  return (
    <div className="min-h-screen ">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Reminders</h1>
              <p className="text-sm text-gray-600 mt-1">Automate payment reminders across multiple channels</p>
            </div>
            <button
              onClick={() => setOpenNew(true)}
              className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Reminder
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Scheduled" value={stats.scheduled} icon={<Clock className="w-5 h-5 text-green-600" />} color="green" />
          <StatCard title="Sent Today" value={stats.sent} icon={<Send className="w-5 h-5 text-green-600" />} color="green" />
          <StatCard title="Failed" value={stats.failed} icon={<XCircle className="w-5 h-5 text-red-600" />} color="red" />
          <StatCard title="Response Rate" value={stats.responseRate} icon={<MessageCircle className="w-5 h-5 text-purple-600" />} color="purple" />
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Tabs */}
          <div className="border-b border-gray-200 px-6 py-2 pt-4">
            <div className="flex items-center gap-1 -mb-px">
              <TabButton active={tab === "pending"} onClick={() => setTab("pending")} icon={<Clock className="w-4 h-4" />}>
                pending
                <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  {data.filter(r => r.status === "pending").length}
                </span>
              </TabButton>
              <TabButton active={tab === "sent"} onClick={() => setTab("sent")} icon={<CheckCircle2 className="w-4 h-4" />}>
                Sent
                <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  {data.filter(r => r.status === "sent").length}
                </span>
              </TabButton>
              <TabButton active={tab === "failed"} onClick={() => setTab("failed")} icon={<XCircle className="w-4 h-4" />}>
                Failed
                <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  {data.filter(r => r.status === "failed").length}
                </span>
              </TabButton>
            </div>
          </div>

          {/* Search & Actions Bar */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by customer, company, or ID..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <button className="inline-flex items-center justify-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                <Filter className="w-4 h-4" /> Filters
              </button>
            </div>

            {/* Bulk Actions */}
            {bulk.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm font-medium text-green-900">{bulk.size} selected</span>
                <div className="flex flex-wrap items-center gap-2 ml-auto">
                  <button className="inline-flex items-center gap-1.5 bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-sm font-medium">
                    <Send className="w-3.5 h-3.5" /> Send Now
                  </button>
                  <button className="inline-flex items-center gap-1.5 bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-sm font-medium">
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </button>
                  <button
                    onClick={async () => {
                      const confirm = window.confirm(`Delete ${bulk.size} reminders?`);
                      if (!confirm) return;
                      for (let id of bulk) {
                        await deleteReminder(id);
                      }
                      setBulk(new Set());
                      window.location.reload();
                    }}
                    className="inline-flex items-center gap-1.5 bg-white border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 text-sm font-medium text-red-600">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 w-12">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      onChange={(e) => {
                        if (e.target.checked) setBulk(new Set(filtered.map((r) => r.id)));
                        else setBulk(new Set());
                      }}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ID & Template</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Channels</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Scheduled For</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        checked={bulk.has(r.id)}
                        onChange={() => toggleBulk(r.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      {/* <div className="font-medium text-gray-900 text-sm">{r.id}</div> */}
                      <div className="text-xs text-gray-500 mt-0.5">{TEMPLATES[r.template]?.label || r.template}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 text-sm">{r.customer.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{r.customer.company}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {r.channel.includes("whatsapp") && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                            <MessageCircle className="w-3 h-3" /> WhatsApp
                          </span>
                        )}
                        {r.channel.includes("voice") && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                            <Phone className="w-3 h-3" /> Voice
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-semibold text-sm">{currency2(r.dueAmount)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-700 text-sm">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs">{new Date(r.sendAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ring-1 ring-inset ${statusChip(r.status)}`}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-0.5">
                        <IconBtn title="Edit" onClick={() => setDrawer(r)}><Pencil className="w-4 h-4" /></IconBtn>
                        <IconBtn title="Delete" danger onClick={() => handleDeleteReminder(r)} ><Trash2 className="w-4 h-4" /></IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="px-6 py-16 text-center" colSpan={8}>
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                          <AlertCircle className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="text-base font-medium text-gray-900 mb-1">No reminders found</div>
                        <div className="text-sm text-gray-500">Try adjusting your search or filter criteria</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {filtered.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> reminders
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {openNew && <ScheduleOrSendReminderModal open={openNew} onClose={() => setOpenNew(false)} onSubmit={handleSubmit} />}
      {drawer && <EditDrawer reminder={drawer} onClose={() => setDrawer(null)} onDeleteSuccess={handleDrawerDeleteSuccess} onRescheduleSuccess={handleDrawerRescheduleSuccess} />}
    </div>
  );
}