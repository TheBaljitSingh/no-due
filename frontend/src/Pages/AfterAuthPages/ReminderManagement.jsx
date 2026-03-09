import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Clock,
  Phone,
  Plus,
  Search,
  Send,
  Trash2,
  Pause,
  XCircle,
  Pencil,
  AlertCircle,
  ClipboardClock,
  Bolt,
  AlarmClockCheck,
  CircleCheckBig,
  CircleX,
  Loader2,
  Users,
  Calendar,
  ChevronDown,
  ChevronRight,
  UserRound,
} from "lucide-react";

import { TEMPLATES } from "../../utils/constants";
import {
  currency2,
  formatDate,
  IconBtn,
  LoaderTwo,
  statusChip,
  TabButton,
} from "../../utils/AfterAuthUtils/Helpers";
import StatCard from "../../Components/AfterAuthComponent/ReminderManagement/StatCard";
import EditDrawer from "../../Components/AfterAuthComponent/ReminderManagement/EditDrawer";
import AuditDrawer from "../../Components/AfterAuthComponent/ReminderManagement/AuditDrawer";
import {
  deleteReminder,
  getAllReminders,
  scheduleReminder,
  sendReminderNow,
  bulkDeleteReminders,
  bulkPauseReminders,
  bulkRescheduleReminders,
  bulkSendReminders,
} from "../../utils/service/reminderService.js";
import ScheduleOrSendReminderModal from "../../Components/AfterAuthComponent/ReminderManagement/ScheduleOrSendReminderModal.jsx";
import toast from "react-hot-toast";
import ConfirmModal from "../../Components/AfterAuthComponent/CustomerMasterPage/ConfirmModal.jsx";
import BulkRescheduleModal from "../../Components/AfterAuthComponent/ReminderManagement/BulkRescheduleModal.jsx";
import { formatMobile } from "../../utils/constants";
import { FaWhatsapp } from "react-icons/fa";

export default function ReminderManagement() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("all");
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = searchParams.get("query") || "";
  const [query, setQuery] = useState(urlQuery); //global

  // URL sync: update local q and query from URL initial setup
  const [q, setQ] = useState(urlQuery); //for local

  // Reset page to 1 whenever tab or query changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [tab, query]);

  // Debounce search update: q updates query and URL
  useEffect(() => {
    // Show loading immediately as user starts typing
    if (q !== query) setLoading(true);

    const handler = setTimeout(() => {
      setQuery(q);
      const params = new URLSearchParams(searchParams);
      if (q) params.set("query", q);
      else params.delete("query");
      setSearchParams(params, { replace: true });
    }, 500);

    return () => clearTimeout(handler);
  }, [q]);

  // Handle direct URL updates (external navigation)
  useEffect(() => {
    const currentUrlQuery = searchParams.get("query") || "";
    if (currentUrlQuery !== query) {
      setQ(currentUrlQuery);
      // console.log("currentUrlQuery",currentUrlQuery);
      setQuery(currentUrlQuery);
    }
  }, [searchParams]);

  const [bulk, setBulk] = useState(new Set());
  const [openNew, setOpenNew] = useState(false);
  const [drawer, setDrawer] = useState(null);
  const [auditCustomer, setAuditCustomer] = useState(null);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  //this is not used for now{previously it was for card}
  const [stats, setStats] = useState({
    scheduled: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    total: 0,
    rescheduled: 0,
    responseRate: "0%", // hardcoded for now or fetch if API supports
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toBedeletedReminder, setToBeDeletedReminder] = useState();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState("client");
  const [showOnly7Days, setShowOnly7Days] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [isExpandedAll, setIsExpandedAll] = useState(true);

  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (tab !== "all") {
        // if other then all then aply filter or not
        filters.status = tab; // either it will be ["pending", "sent", "failed", "cancelled", 'rescheduled','paused'],
      }

      filters.query = query;

      const res = await getAllReminders(filters);
      // console.log("res", res.data.data.data);
      const output = res.data.data;

      console.log("this is data", output.data);
      // console.log("output.data", output.data);
      setData(output.data || []);
      // Only update aggregate metadata to avoid infinite loops with page/limit Fighting
      setPagination((prev) => ({
        ...prev,
        total: output.meta?.total || prev.total,
        totalPages: output.meta?.totalPages || prev.totalPages,
      }));

      if (output.stats) {
        setStats((prev) => ({
          ...prev,
          ...output.stats,
          scheduled: output?.stats?.pending,
        }));
      }
    } catch (error) {
      console.log(error);
      console.log("error while loading reminder data");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, tab, query]);

  useEffect(() => {
    async function run() {
      try {
        await fetchReminders();
      } catch (error) {
        console.log(error);
      } finally {
        setInitialLoading(false);
      }
    }

    run();
  }, [fetchReminders]);

  const normalizeData = useMemo(() => {
    return data.map((r) => ({
      id: r._id,
      customer: {
        name: r.customerId?.name || "-",
        mobile: r.customerId?.mobile || "-",
        company: "-", // not present yet
      },

      dueAmount: r.templateVariables?.[1] || r?.transactionId?.amount || 0,

      scheduledFor: r.scheduledFor,

      status: r.status === "pending" ? "scheduled" : r.status,

      template: r.whatsappTemplate?.name,

      channel: ["whatsapp"],

      raw: r,
    }));
  }, [data]);

  const finalFiltered = useMemo(() => {
    let result = normalizeData.filter((r) => {
      const s = q.trim().toLowerCase();
      if (!s) return true;
      return (
        r.id.toLowerCase().includes(s) || // including id also
        r.customer.name.toLowerCase().includes(s) || //including name also
        r.customer.mobile.toLowerCase().includes(s) //including mobile also
      );
    });
    if (showOnly7Days) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const next7Days = new Date();
      next7Days.setDate(now.getDate() + 7);
      next7Days.setHours(23, 59, 59, 999);

      result = result.filter((r) => {
        const sched = new Date(r.scheduledFor);
        return sched >= now && sched <= next7Days;
      });
    }
    return result;
  }, [normalizeData, q, showOnly7Days]);

  const clientGroups = useMemo(() => {
    const groups = {};
    finalFiltered.forEach((r) => {
      const cId = r.raw.customerId?._id || r.customer.mobile;
      if (!groups[cId]) {
        groups[cId] = {
          customer: r.customer,
          reminders: [],
        };
      }
      groups[cId].reminders.push(r);
    });
    return Object.values(groups).map((g) => ({
      ...g,
      reminders: g.reminders.sort(
        (a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor),
      ),
    }));
  }, [finalFiltered]);

  const toggleGroup = (cId) => {
    setExpandedGroups((prev) => {
      const n = new Set(prev);
      n.has(cId) ? n.delete(cId) : n.add(cId);
      return n;
    });
  };

  const handleExpandAll = () => {
    const allKeys = clientGroups.map((g) => g.customer.mobile);
    setExpandedGroups(new Set(allKeys));
    setIsExpandedAll(true);
  };

  const handleCollapseAll = () => {
    setExpandedGroups(new Set());
    setIsExpandedAll(false);
  };

  // Sync expanded groups when data arrives
  useEffect(() => {
    if (isExpandedAll && clientGroups.length > 0) {
      const allKeys = clientGroups.map((g) => g.customer.mobile);
      setExpandedGroups(new Set(allKeys));
    }
  }, [clientGroups, isExpandedAll]);

  console.log("finalFiltered", finalFiltered);

  const toggleBulk = (id) => {
    setBulk((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleSubmit = async (data) => {
    // console.log("submitted", data);
    const {
      userId,
      templateName,
      mode,
      scheduleDate,
      transactionId,
      variables,
    } = data;

    if (mode === "schedule") {
      const apiData = {
        transactionId,
        scheduledFor: scheduleDate,
        templateName,
        variables,
      };

      try {
        await toast.promise(scheduleReminder(apiData), {
          loading: "Scheduling...",
          success: "Reminder scheduled!",
          error: (err) =>
            err?.response?.data?.errors?.[0] ||
            err?.message ||
            "Error while scheduling",
        });
        setOpenNew(false);
      } catch (error) {
        console.log(error);
      }
    } else {
      const apiData = { transactionId, templateName, variables };

      try {
        await toast.promise(sendReminderNow(apiData), {
          loading: "Sending...",
          success: "Reminder sent!",
          error: (err) =>
            err?.response?.data?.errors?.[0] ||
            err?.message ||
            "Error while sending",
        });
        setOpenNew(false);
        //have to increase count
        setStats((prev) => ({
          ...prev,
          sent: prev?.sent + 1,
        }));
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleBulkSend = async () => {
    try {
      setBulkActionLoading(true);
      const ids = Array.from(bulk); //it makes array of ids
      await toast.promise(bulkSendReminders(ids), {
        loading: "Sending reminders...",
        success: "Reminders triggered successfully",
        error: "Failed to send some reminders",
      });
      setBulk(new Set());
      fetchReminders();
    } catch (err) {
      console.error(err);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkPause = async () => {
    try {
      setBulkActionLoading(true);
      const ids = Array.from(bulk);
      await toast.promise(bulkPauseReminders(ids), {
        loading: "Pausing reminders...",
        success: "Reminders paused successfully",
        error: "Failed to pause reminders",
      });
      setBulk(new Set());
      fetchReminders();
    } catch (err) {
      console.error(err);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = () => {
    setBulkDeleteConfirmOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    setBulkDeleteConfirmOpen(false);
    try {
      setBulkActionLoading(true);
      const ids = Array.from(bulk);
      await toast.promise(bulkDeleteReminders(ids), {
        loading: "Deleting reminders...",
        success: "Reminders deleted successfully",
        error: "Failed to delete reminders",
      });
      setBulk(new Set());
      fetchReminders();
    } catch (err) {
      console.error(err);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkReschedule = async (newDate) => {
    try {
      setBulkActionLoading(true);
      const ids = Array.from(bulk);
      await toast.promise(bulkRescheduleReminders(ids, newDate), {
        loading: "Rescheduling reminders...",
        success: (res) => {
          const count = res?.data?.updatedCount || 0;
          return `Successfully rescheduled ${count} reminder${count !== 1 ? "s" : ""}`;
        },
        error: (err) =>
          err?.response?.data?.errors?.[0] ||
          err?.message ||
          "Failed to reschedule reminders",
        duration: 5000,
      });
      setBulk(new Set());
      setRescheduleOpen(false);
      fetchReminders();
    } catch (err) {
      console.error(err);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      if (!id) {
        toast.error("Invalid reminder");
        return;
      }
      const res = await toast.promise(deleteReminder(id), {
        loading: "Deleting...",
        success: "Reminder Deleted",
        error: (err) => err?.message || "Failed to delete Reminder",
      });

      if (res?.success) {
        setData((prev) => prev.filter((r) => r._id !== id));
        setBulk((prev) => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        });
      } else {
        console.log(res?.message);
      }
    } catch (error) {
      console.error("Delete reminder error:", error);
    }
    setConfirmOpen(false);
    setToBeDeletedReminder(null);
  };

  const handleDrawerDeleteSuccess = (id) => {
    setData((prev) => prev.filter((r) => r._id !== id));
    setBulk((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
    setDrawer(null);
  };

  const handleDrawerRescheduleSuccess = () => {
    fetchReminders(); //instade of fetcing can i insert normally data here as i have to clicnet side, will work later
    setDrawer(null);
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Reminders
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Automate payment reminders across multiple channels
              </p>
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

      {/* <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"> */}
      {/* Stats Cards */}
      {/* commented the card UI for now, because filter is added with count data */}
      {/* <div className="hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Scheduled" value={stats.scheduled} icon={<Clock className="w-5 h-5 text-green-600" />} color="green" />
          <StatCard title="Sent Today" value={stats.sent} icon={<Send className="w-5 h-5 text-green-600" />} color="green" />
          <StatCard title="Failed" value={stats.failed} icon={<XCircle className="w-5 h-5 text-red-600" />} color="red" />
          <StatCard title="Response Rate" value={stats.responseRate} icon={<MessageCircle className="w-5 h-5 text-purple-600" />} color="purple" />
        </div> */}

      {/* Main Content Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Tabs */}
        <div className="border-b border-gray-200 px-6 py-2 pt-4">
          <div className="flex items-center gap-1 -mb-px overflow-x-auto">
            <TabButton
              active={tab === "all"}
              onClick={() => setTab("all")}
              icon={<Bolt className="w-4 h-4" />}
            >
              All
              <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {stats.total}
              </span>
            </TabButton>
            <TabButton
              active={tab === "pending"}
              onClick={() => setTab("pending")}
              icon={<Clock className="w-4 h-4" />}
            >
              Scheduled
              <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {stats.scheduled}
              </span>
            </TabButton>
            <TabButton
              active={tab === "rescheduled"}
              onClick={() => setTab("rescheduled")}
              icon={<AlarmClockCheck className="w-4 h-4" />}
            >
              Re-Scheduled
              <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {stats.rescheduled || 0}
              </span>
            </TabButton>
            <TabButton
              active={tab === "sent"}
              onClick={() => setTab("sent")}
              icon={<CircleCheckBig className="w-4 h-4" />}
            >
              Sent
              <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {stats.sent}
              </span>
            </TabButton>
            <TabButton
              active={tab === "paused"}
              onClick={() => setTab("paused")}
              icon={<Pause className="w-4 h-4" />}
            >
              Paused
              <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {stats.paused || 0}
              </span>
            </TabButton>
            <TabButton
              active={tab === "cancelled"}
              onClick={() => setTab("cancelled")}
              icon={<CircleX className="w-4 h-4" />}
            >
              Cancelled
              <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {stats.cancelled}
              </span>
            </TabButton>
            <TabButton
              active={tab === "failed"}
              onClick={() => setTab("failed")}
              icon={<XCircle className="w-4 h-4" />}
            >
              Failed
              <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {stats.failed}
              </span>
            </TabButton>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by customer, company, or ID..."
                  className="w-full pl-8 border shadow-accertinity inline px-2 py-1.5 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 
                         focus:border-gray-300 focus:bg-gray-100 border-transparent 
                         transition-all duration-200 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 border border-gray-200 p-1 rounded-xl bg-gray-50/50">
              <button
                onClick={() => setViewMode("individual")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:cursor-pointer transition-all ${viewMode === "individual" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Clock className="w-3.5 h-3.5" />
                Individual
              </button>
              <button
                onClick={() => setViewMode("client")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:cursor-pointer transition-all ${viewMode === "client" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Users className="w-3.5 h-3.5" />
                By Client
              </button>
            </div>

            <button
              onClick={() => setShowOnly7Days(!showOnly7Days)}
              className={`inline-flex items-center gap-2 border px-4 py-2 rounded-xl transition-all text-xs font-medium shadow-sm ${showOnly7Days ? "bg-green-600 border-green-600 text-white" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              <Calendar className="w-4 h-4" />
              Next 7 Days
            </button>
          </div>

          {viewMode === "client" && (
            <div className="flex justify-start items-center gap-3 pt-1 px-1">
              <button
                onClick={handleExpandAll}
                className={`text-[11px] uppercase tracking-wider ${isExpandedAll ? "text-green-600" : "text-gray-300"} hover:cursor-pointer hover:text-green-600/70 font-bold transition-colors`}
              >
                Expand All
              </button>
              <span className="text-gray-300 text-xs">|</span>
              <button
                onClick={handleCollapseAll}
                className={`text-[11px] uppercase tracking-wider ${!isExpandedAll ? "text-green-600" : "text-gray-300"}  hover:cursor-pointer hover:text-green-600/70 font-bold transition-colors`}
              >
                Collapse All
              </button>
            </div>
          )}

          {/* Bulk Actions */}
          {bulk.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-sm font-medium text-green-900">
                {bulk.size} reminders selected
              </span>
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <button
                  disabled={bulkActionLoading}
                  onClick={handleBulkSend}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:cursor-pointer hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> Send Now
                </button>
                <button
                  disabled={bulkActionLoading}
                  onClick={handleBulkPause}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:cursor-pointer hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause
                </button>
                <button
                  disabled={bulkActionLoading}
                  onClick={() => setRescheduleOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:cursor-pointer hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                >
                  <ClipboardClock className="w-3.5 h-3.5" /> ReSchedule
                </button>
                <button
                  disabled={bulkActionLoading}
                  onClick={handleBulkDelete}
                  className="inline-flex items-center gap-1.5 bg-white border border-red-300 px-3 py-1.5 rounded-lg hover:cursor-pointer hover:bg-red-50 text-sm font-medium text-red-600 disabled:opacity-50"
                >
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
                    checked={
                      finalFiltered.length > 0 &&
                      finalFiltered.every((r) => bulk.has(r.id))
                    }
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBulk((prev) => {
                          const n = new Set(prev);
                          finalFiltered.forEach((r) => n.add(r.id));
                          return n;
                        });
                      } else {
                        setBulk((prev) => {
                          const n = new Set(prev);
                          finalFiltered.forEach((r) => n.delete(r.id));
                          return n;
                        });
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  ID & Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Channels
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Due Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Scheduled For
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td className="px-6 py-24 text-center" colSpan={8}>
                    <LoaderTwo text="Filtering Reminders..." />
                  </td>
                </tr>
              ) : finalFiltered.length > 0 ? (
                viewMode === "individual" ? (
                  finalFiltered.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          checked={bulk.has(r.id)}
                          onChange={() => toggleBulk(r.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-500 mt-0.5">
                          {TEMPLATES[r.template]?.label || r.template}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 text-sm">
                          {r.customer.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {r.customer.company}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {r.channel.includes("whatsapp") && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium  text-green-700 ring-1 ring-inset ring-green-600/20">
                              <FaWhatsapp className="w-3 h-3" /> WhatsApp
                            </span>
                          )}
                          {r.channel.includes("voice") && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                              <Phone className="w-3 h-3" /> Voice
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-semibold text-sm">
                        {currency2(r.dueAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-700 text-sm">
                          <span className="text-xs">
                            {new Date(r.scheduledFor).toLocaleString("en-US", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ring-1 ring-inset ${statusChip(r.status)}`}
                        >
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-0.5">
                          <IconBtn
                            title="Whatsapp History"
                            onClick={() => setAuditCustomer(r.customer)}
                          >
                            {" "}
                            <FaWhatsapp className="w-5 h-5" />{" "}
                          </IconBtn>
                          <IconBtn title="Edit" onClick={() => setDrawer(r)}>
                            <Pencil className="w-5 h-5" />
                          </IconBtn>
                          <IconBtn
                            title="Delete"
                            danger
                            onClick={() => {
                              setConfirmOpen(true);
                              setToBeDeletedReminder(r.id);
                            }}
                          >
                            <Trash2 className="w-5 h-5" />
                          </IconBtn>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  clientGroups.map((group) => {
                    const groupKey = group.customer.mobile;
                    const isExpanded = expandedGroups.has(groupKey);
                    return (
                      <React.Fragment key={groupKey}>
                        <tr
                          onClick={() => toggleGroup(groupKey)}
                          className="bg-green-50/30 cursor-pointer hover:bg-green-100/40 transition-colors"
                        >
                          <td
                            colSpan={8}
                            className="px-6 py-3 border-y border-green-100"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                  <UserRound className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-gray-900">
                                      {group.customer.name}
                                    </h3>
                                    <ChevronDown
                                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                    />
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {formatMobile(group.customer.mobile)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-xs text-gray-500 uppercase font-medium">
                                    Total Dues
                                  </p>
                                  <p className="text-sm font-bold text-gray-900">
                                    {currency2(
                                      group.reminders.reduce(
                                        (acc, r) => acc + Number(r.dueAmount),
                                        0,
                                      ),
                                    )}
                                  </p>
                                </div>
                                <span className="bg-white border border-green-200 text-green-700 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">
                                  {group.reminders.length} Reminders
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                        {isExpanded &&
                          group.reminders.map((r) => (
                            <tr
                              key={r.id}
                              className="hover:bg-gray-50 transition-colors border-l-4 border-l-transparent hover:border-l-green-500"
                            >
                              <td className="px-6 py-4">
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                  checked={bulk.has(r.id)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    toggleBulk(r.id);
                                  }}
                                />
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {TEMPLATES[r.template]?.label || r.template}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-900 text-sm">
                                  {r.customer.name}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1.5">
                                  {r.channel.includes("whatsapp") && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                      <FaWhatsapp className="w-3 h-3" />{" "}
                                      WhatsApp
                                    </span>
                                  )}
                                  {r.channel.includes("voice") && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                                      <Phone className="w-3 h-3" /> Voice
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-900 font-semibold text-sm">
                                {currency2(r.dueAmount)}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5 text-gray-700 text-sm">
                                  <span className="text-xs">
                                    {new Date(r.scheduledFor).toLocaleString(
                                      "en-US",
                                      {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      },
                                    )}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ring-1 ring-inset ${statusChip(r.status)}`}
                                >
                                  {r.status.charAt(0).toUpperCase() +
                                    r.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div
                                  className="inline-flex items-center gap-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <IconBtn
                                    title="Whatsapp History"
                                    onClick={() => setAuditCustomer(r.customer)}
                                  >
                                    {" "}
                                    <FaWhatsapp className="w-5 h-5" />{" "}
                                  </IconBtn>
                                  <IconBtn
                                    title="Edit"
                                    onClick={() => setDrawer(r)}
                                  >
                                    <Pencil className="w-5 h-5" />
                                  </IconBtn>
                                  <IconBtn
                                    title="Delete"
                                    danger
                                    onClick={() => {
                                      setConfirmOpen(true);
                                      setToBeDeletedReminder(r.id);
                                    }}
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </IconBtn>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })
                )
              ) : (
                <tr>
                  <td className="px-6 py-16 text-center" colSpan={8}>
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="text-base font-medium text-gray-900 mb-1">
                        No {tab !== "all" ? `${tab}` : ""} reminders found{" "}
                      </div>
                      <div className="text-sm text-gray-500">
                        Try adjusting your search or filter criteria
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {finalFiltered.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              of <span className="font-medium">{pagination.total}</span> total
              reminders
              {showOnly7Days && (
                <span className="ml-1 text-green-600 font-medium">
                  (Filtered for next 7 days: {finalFiltered.length} showing)
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      {/* </div> */}

      {openNew && (
        <ScheduleOrSendReminderModal
          open={openNew}
          onClose={() => setOpenNew(false)}
          onSubmit={handleSubmit}
        />
      )}
      {drawer && (
        <EditDrawer
          reminder={drawer}
          onClose={() => setDrawer(null)}
          onDeleteSuccess={handleDrawerDeleteSuccess}
          onRescheduleSuccess={handleDrawerRescheduleSuccess}
        />
      )}
      {auditCustomer && (
        <AuditDrawer
          customer={auditCustomer}
          onClose={() => setAuditCustomer(null)}
        />
      )}
      {confirmOpen && (
        <ConfirmModal
          open={confirmOpen}
          onClose={() => {
            setConfirmOpen(false);
            setToBeDeletedReminder(null);
          }}
          onConfirm={() => handleDeleteReminder(toBedeletedReminder)}
          message="Are you sure you want to delete this reminder?"
        />
      )}
      {bulkDeleteConfirmOpen && (
        <ConfirmModal
          open={bulkDeleteConfirmOpen}
          onClose={() => setBulkDeleteConfirmOpen(false)}
          onConfirm={handleBulkDeleteConfirm}
          message={`Are you sure you want to delete ${bulk.size} reminder${bulk.size > 1 ? "s" : ""}?`}
        />
      )}
      {rescheduleOpen && (
        <BulkRescheduleModal
          open={rescheduleOpen}
          onClose={() => setRescheduleOpen(false)}
          onConfirm={handleBulkReschedule}
          count={bulk.size}
        />
      )}
    </div>
  );
}
