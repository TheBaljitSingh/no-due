import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { getCustomers } from "./../../../utils/service/customerService";
import { getDueTransactionsSummary } from "./../../../utils/service/userService";
import { formatDate, currency, StatusBadge } from "../../../utils/AfterAuthUtils/Helpers";
import {
    Loader2, ChevronLeft, ChevronRight, ChevronDown, Search,
    SlidersHorizontal, X, ArrowUpDown, ArrowUp, ArrowDown,
    AlertTriangle, Clock, CheckCircle2, Users, CalendarDays, Filter,
    IndianRupee
} from "lucide-react";
import PageHeaders from "../../../utils/AfterAuthUtils/PageHeaders";
import TransactionHistoryModal from "./TransactionHistoryModal";

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["PENDING", "PARTIAL", "PAID", "OVERDUE"];
const OVERDUE_OPTIONS = [
    { label: "Any", value: "any" },
    { label: "Not overdue", value: "none" },
    { label: "1-7 days", value: "1-7" },
    { label: "8-30 days", value: "8-30" },
    { label: "30+ days", value: "30+" },
];
const GROUP_BY_OPTIONS = [
    { label: "Customer", value: "customer" },
    { label: "Status", value: "status" },
    { label: "Overdue Severity", value: "overdue" },
];
const SORT_OPTIONS = [
    { label: "Latest Transaction", value: "latestTxAt" },
    { label: "Total Due (High→Low)", value: "totalDue_desc" },
    { label: "Total Due (Low→High)", value: "totalDue_asc" },
    { label: "Customer Name A→Z", value: "name_asc" },
    { label: "Customer Name Z→A", value: "name_desc" },
    { label: "Most Pending Dues", value: "count_desc" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const matchesSearch = (group, q) => {
    if (!q) return true;
    const lower = q.toLowerCase();
    if (group.customerName?.toLowerCase().includes(lower)) return true;
    if (group.customerPhone?.toLowerCase().includes(lower)) return true;
    if (String(group.totalDue).includes(lower)) return true;
    return group.transactions.some(tx =>
        tx.note?.toLowerCase().includes(lower) ||
        tx.paymentStatus?.toLowerCase().includes(lower) ||
        String(tx.amount).includes(lower) ||
        String(tx.remainingDue).includes(lower)
    );
};

const matchesStatus = (group, statuses) => {
    if (!statuses.length) return true;
    return group.transactions.some(tx => statuses.includes(tx.paymentStatus));
};

const matchesOverdue = (group, overdueFilter) => {
    if (overdueFilter === "any") return true;
    return group.transactions.some(tx => {
        const d = tx.overdueByDay ?? 0;
        if (overdueFilter === "none") return d === 0;
        if (overdueFilter === "1-7") return d >= 1 && d <= 7;
        if (overdueFilter === "8-30") return d >= 8 && d <= 30;
        if (overdueFilter === "30+") return d > 30;
        return true;
    });
};

const matchesDueDateRange = (group, from, to) => {
    if (!from && !to) return true;
    return group.transactions.some(tx => {
        if (!tx.dueDate) return false;
        const d = new Date(tx.dueDate);
        if (from && d < new Date(from)) return false;
        if (to && d > new Date(to)) return false;
        return true;
    });
};

const matchesAmountRange = (group, min, max) => {
    if (!min && !max) return true;
    const due = group.totalDue;
    if (min && due < Number(min)) return false;
    if (max && due > Number(max)) return false;
    return true;
};

const sortGroups = (groups, sortBy) => {
    const sorted = [...groups];
    switch (sortBy) {
        case "totalDue_desc": return sorted.sort((a, b) => b.totalDue - a.totalDue);
        case "totalDue_asc": return sorted.sort((a, b) => a.totalDue - b.totalDue);
        case "name_asc": return sorted.sort((a, b) => a.customerName?.localeCompare(b.customerName));
        case "name_desc": return sorted.sort((a, b) => b.customerName?.localeCompare(a.customerName));
        case "count_desc": return sorted.sort((a, b) => b.transactions.length - a.transactions.length);
        default: return sorted; // latestTxAt — server-sorted
    }
};

const groupByStatus = (groups) => {
    const map = {};
    groups.forEach(g => {
        const statuses = [...new Set(g.transactions.map(tx => tx.paymentStatus))];
        statuses.forEach(s => {
            if (!map[s]) map[s] = [];
            map[s].push(g);
        });
    });
    return Object.entries(map).map(([label, items]) => ({ label, items }));
};

const groupByOverdue = (groups) => {
    const buckets = { "Not Overdue": [], "1–7 Days": [], "8–30 Days": [], "30+ Days": [] };
    groups.forEach(g => {
        const maxDays = Math.max(...g.transactions.map(tx => tx.overdueByDay ?? 0));
        if (maxDays === 0) buckets["Not Overdue"].push(g);
        else if (maxDays <= 7) buckets["1–7 Days"].push(g);
        else if (maxDays <= 30) buckets["8–30 Days"].push(g);
        else buckets["30+ Days"].push(g);
    });
    return Object.entries(buckets).filter(([, v]) => v.length).map(([label, items]) => ({ label, items }));
};

const overdueColor = (days) => {
    if (days <= 0) return "text-gray-400";
    if (days <= 7) return "text-yellow-600";
    if (days <= 30) return "text-orange-600";
    return "text-red-700 font-bold";
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const ActiveFilterChip = ({ label, onRemove }) => (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        {label}
        <button onClick={onRemove} className="hover:text-red-500 transition-colors ml-0.5">
            <X className="w-3 h-3" />
        </button>
    </span>
);

const SummaryCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-4 h-4" />
        </div>
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm font-semibold text-gray-800">{value}</p>
        </div>
    </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const TransactionHistory = () => {
    // Remote state
    const [loading, setLoading] = useState(true);
    const [groupedTransactions, setGroupedTransactions] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [pagination, setPagination] = useState({ totalGroups: 0, currentPage: 1, totalPages: 1, limit: 10 });
    const [serverStats, setServerStats] = useState({
        totalOverallDue: 0,
        totalOverallTransactions: 0,
        totalOverdueCustomers: 0,
        totalGroups: 0
    });

    // Modal state
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);

    // Filter / Sort state
    const [q, setQ] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [overdueFilter, setOverdueFilter] = useState("any");

    // Range inputs - keep local versions for typing and debounced versions for API
    const [dueDateFrom, setDueDateFrom] = useState("");
    const [dueDateTo, setDueDateTo] = useState("");
    const [amountMin, setAmountMin] = useState("");
    const [amountMax, setAmountMax] = useState("");

    const [debouncedFilters, setDebouncedFilters] = useState({
        minAmt: "", maxAmt: "", from: "", to: ""
    });

    const [isDatePicking, setIsDatePicking] = useState(false);
    const [isAmountTyping, setIsAmountTyping] = useState(false);

    const [sortBy, setSortBy] = useState("latestTxAt");
    const [groupByMode, setGroupByMode] = useState("customer");

    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [isExpandedAll, setIsExpandedAll] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // ── Debounce Logic ──────────────────────────────────────────────────────
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedQ(q), 500);
        return () => clearTimeout(handler);
    }, [q]);

    useEffect(() => {
        // While user is actively picking a date or typing amount, don't trigger global filter update
        if (isDatePicking || isAmountTyping) return;

        const handler = setTimeout(() => {
            setDebouncedFilters({
                minAmt: amountMin,
                maxAmt: amountMax,
                from: dueDateFrom,
                to: dueDateTo
            });
        }, 600);
        return () => clearTimeout(handler);
    }, [amountMin, amountMax, dueDateFrom, dueDateTo, isDatePicking, isAmountTyping]);

    // Reset page on filter change
    useEffect(() => {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, [debouncedQ, selectedStatuses, overdueFilter, debouncedFilters]);

    // ── Fetch ────────────────────────────────────────────────────────────────
    const fetchCustomers = async () => {
        try {
            const res = await getCustomers({ limit: 1000 });
            setCustomers(res?.data?.customers || []);
        } catch (err) { console.error(err); }
    };

    const fetchData = useCallback(async () => {
        try {
            // Only show big loader on initial fetch
            if (groupedTransactions.length === 0) setLoading(true);
            const res = await getDueTransactionsSummary({
                page: pagination.currentPage,
                limit: pagination.limit,
                query: debouncedQ,
                statuses: selectedStatuses,
                overdue: overdueFilter,
                minAmt: debouncedFilters.minAmt,
                maxAmt: debouncedFilters.maxAmt,
                from: debouncedFilters.from,
                to: debouncedFilters.to
            });
            if (res.success) {
                setGroupedTransactions(res.data.transactions);
                setPagination(res.data.pagination);
                setServerStats(res.data.stats);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [pagination.currentPage, pagination.limit, debouncedQ, selectedStatuses, overdueFilter, debouncedFilters]);

    useEffect(() => { fetchCustomers(); }, []);
    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Sorting ─────────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        return sortGroups(groupedTransactions, sortBy);
    }, [groupedTransactions, sortBy]);

    // ── Grouping modes ───────────────────────────────────────────────────────

    const displayGroups = useMemo(() => {
        if (groupByMode === "status") return groupByStatus(filtered);
        if (groupByMode === "overdue") return groupByOverdue(filtered);
        return [{ label: null, items: filtered }];
    }, [filtered, groupByMode]);

    // ── Active filters list ──────────────────────────────────────────────────
    const activeFilters = useMemo(() => {
        const chips = [];
        if (selectedStatuses.length) chips.push({ label: `Status: ${selectedStatuses.join(", ")}`, clear: () => setSelectedStatuses([]) });
        if (overdueFilter !== "any") chips.push({ label: `Overdue: ${overdueFilter}`, clear: () => setOverdueFilter("any") });
        if (dueDateFrom) chips.push({ label: `Due from ${dueDateFrom}`, clear: () => setDueDateFrom("") });
        if (dueDateTo) chips.push({ label: `Due to ${dueDateTo}`, clear: () => setDueDateTo("") });
        if (amountMin) chips.push({ label: `Min ₹${amountMin}`, clear: () => setAmountMin("") });
        if (amountMax) chips.push({ label: `Max ₹${amountMax}`, clear: () => setAmountMax("") });
        return chips;
    }, [selectedStatuses, overdueFilter, dueDateFrom, dueDateTo, amountMin, amountMax]);

    const clearAllFilters = () => {
        setSelectedStatuses([]);
        setOverdueFilter("any");
        setDueDateFrom(""); setDueDateTo("");
        setAmountMin(""); setAmountMax("");
        setQ(""); setSortBy("latestTxAt");
    };

    // ── UI handlers ──────────────────────────────────────────────────────────
    const toggleGroup = (id) => {
        const s = new Set(expandedGroups);
        s.has(id) ? s.delete(id) : s.add(id);
        setExpandedGroups(s);
    };
    const handleExpandAll = () => { setExpandedGroups(new Set(filtered.map(g => g._id))); setIsExpandedAll(true); };
    const handleCollapseAll = () => { setExpandedGroups(new Set()); setIsExpandedAll(false); };
    const handlePageChange = (p) => {
        if (p >= 1 && p <= pagination.totalPages) setPagination(prev => ({ ...prev, currentPage: p }));
    };
    const toggleStatus = (s) => setSelectedStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

    // ── Status badge colors ───────────────────────────────────────────────────
    const statusBg = { PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200", PARTIAL: "bg-blue-50 text-blue-700 border-blue-200", PAID: "bg-green-50 text-green-700 border-green-200", OVERDUE: "bg-red-50 text-red-700 border-red-200" };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
        </div>
    );

    return (
        <div className="space-y-5 mb-10">
            <PageHeaders
                header="Due Summafry - Transaction History"
                subheader="View, filter and group all pending dues across customers."
                buttonName="Add Transaction"
                handleOnClick={() => setShowAddTransactionModal(true)}
            />

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SummaryCard icon={Users} label="Customers" value={serverStats.totalGroups} color="bg-blue-50 text-blue-600" />
                <SummaryCard icon={IndianRupee} label="Total Due" value={currency(serverStats.totalOverallDue)} color="bg-yellow-50 text-yellow-600" />
                <SummaryCard icon={Clock} label="Pending Dues" value={serverStats.totalOverallTransactions} color="bg-purple-50 text-purple-600" />
                <SummaryCard icon={AlertTriangle} label="Overdue Customers" value={serverStats.totalOverdueCustomers} color="bg-red-50 text-red-600" />
            </div>


            {/* ── Search + Controls Row ── */}
            <div className="flex flex-col sm:flex-row gap-2">
                {/* Search */}
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="w-full pl-8 border shadow-accertinity inline px-2 py-1.5 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 
                         focus:border-gray-300 focus:bg-gray-100 border-transparent 
                         transition-all duration-200 outline-none"
                        placeholder="Search name, phone, amount, note, status…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    {q && (
                        <button onClick={() => setQ("")} className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Sort */}
                <div className="relative">
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm   focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 
                         focus:border-gray-300 focus:bg-gray-100 border-transparent 
                         transition-all duration-200 outline-none bg-white shadow-sm pr-8 appearance-none cursor-pointer"
                    >
                        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>

                {/* Group By */}
                <div className="relative">
                    <select
                        value={groupByMode}
                        onChange={e => setGroupByMode(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm   focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 
                         focus:border-gray-300 focus:bg-gray-100 border-transparent 
                         transition-all duration-200 outline-none pr-8 appearance-none cursor-pointer"
                    >
                        {GROUP_BY_OPTIONS.map(o => <option key={o.value} value={o.value}>Group: {o.label}</option>)}
                    </select>
                    <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>

                {/* Filter Toggle */}
                <button
                    onClick={() => setShowFilters(v => !v)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border shadow-accertinity transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1
                    ${showFilters || activeFilters.length
                            ? "bg-gray-600 text-white border-gray-600"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                        }`}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                    {activeFilters.length > 0 && (
                        <span className="bg-white text-green-700 rounded-full text-xs font-bold w-5 h-5 flex items-center justify-center">
                            {activeFilters.length}
                        </span>
                    )}
                </button>
            </div>

            {/* ── Filter Panel ── */}
            {showFilters && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Status */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Payment Status</label>
                            <div className="flex flex-wrap gap-2">
                                {STATUS_OPTIONS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => toggleStatus(s)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${selectedStatuses.includes(s) ? statusBg[s] + " border" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Overdue */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Overdue Range</label>
                            <div className="flex flex-wrap gap-2">
                                {OVERDUE_OPTIONS.map(o => (
                                    <button
                                        key={o.value}
                                        onClick={() => setOverdueFilter(o.value)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${overdueFilter === o.value ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"}`}
                                    >
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Total Due Amount */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Total Due Range (₹)</label>
                            <div className="flex gap-2">
                                <input type="number" placeholder="Min" value={amountMin}
                                    onChange={e => setAmountMin(e.target.value)}
                                    onFocus={() => setIsAmountTyping(true)}
                                    onBlur={() => setIsAmountTyping(false)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400" />
                                <input type="number" placeholder="Max" value={amountMax}
                                    onChange={e => setAmountMax(e.target.value)}
                                    onFocus={() => setIsAmountTyping(true)}
                                    onBlur={() => setIsAmountTyping(false)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400" />
                            </div>
                        </div>

                        {/* Due Date Range */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Due Date Range</label>
                            <div className="flex gap-2">
                                <input type="date" value={dueDateFrom}
                                    onChange={e => setDueDateFrom(e.target.value)}
                                    onFocus={() => setIsDatePicking(true)}
                                    onBlur={() => setIsDatePicking(false)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400" />
                                <input type="date" value={dueDateTo}
                                    onChange={e => setDueDateTo(e.target.value)}
                                    onFocus={() => setIsDatePicking(true)}
                                    onBlur={() => setIsDatePicking(false)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400" />
                            </div>
                        </div>
                    </div>

                    {activeFilters.length > 0 && (
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-end">
                            <button onClick={clearAllFilters} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                                <X className="w-3 h-3" /> Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Active Filter Chips ── */}
            {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-gray-400 font-medium">Active:</span>
                    {activeFilters.map((f, i) => (
                        <ActiveFilterChip key={i} label={f.label} onRemove={f.clear} />
                    ))}
                </div>
            )}

            {/* ── Expand/Collapse + Result Count ── */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                    <button onClick={handleExpandAll} className={`text-[11px] uppercase tracking-wider font-bold transition-colors hover:text-green-600 ${isExpandedAll ? "text-green-600" : "text-gray-400"}`}>
                        Expand All
                    </button>
                    <span className="text-gray-300 text-xs">|</span>
                    <button onClick={handleCollapseAll} className={`text-[11px] uppercase tracking-wider font-bold transition-colors hover:text-green-600 ${!isExpandedAll ? "text-green-600" : "text-gray-400"}`}>
                        Collapse All
                    </button>
                </div>
                <span className="text-xs text-gray-400">
                    {filtered.length} of {groupedTransactions.length} customers shown
                </span>
            </div>

            {/* ── Add Transaction Customer Select ── */}
            {showAddTransactionModal && !showTransactionModal && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Select Customer</p>
                    <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        onChange={(e) => {
                            const selected = customers.find(c => c._id === e.target.value);
                            setCurrentCustomer(selected);
                            setTransactions([]);
                            setShowTransactionModal(true);
                            setShowAddTransactionModal(false);
                        }}
                        defaultValue=""
                    >
                        <option value="" disabled>Select a customer</option>
                        {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                </div>
            )}

            {/* ── Main Table Area ── */}
            {!showAddTransactionModal && (
                <div className="space-y-4">
                    {showTransactionModal && currentCustomer && (
                        <TransactionHistoryModal
                            customer={currentCustomer}
                            setCurrentCustomer={setCurrentCustomer}
                            setCustomers={setCustomers}
                            transactions={transactions}
                            setTransactions={setTransactions}
                            handleClose={() => {
                                setShowTransactionModal(false);
                                setCurrentCustomer(null);
                                fetchData();
                            }}
                        />
                    )}

                    {/* Grouped Sections */}
                    {displayGroups.map(({ label, items }) => (
                        <div key={label ?? "default"} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden overflow-x-auto">
                            {/* Section header for non-customer grouping */}
                            {label && (
                                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</span>
                                    <span className="text-xs text-gray-400">{items.length} customers · {currency(items.reduce((s, g) => s + g.totalDue, 0))} total</span>
                                </div>
                            )}

                            <table className="min-w-max w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="w-10"></th>
                                        <th className="px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Customer / Date</th>
                                        <th className="px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide text-center">Remaining</th>
                                        <th className="px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Due Date</th>
                                        <th className="px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Note</th>
                                        <th className="px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide text-center">Status</th>
                                        <th className="px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide text-center">Overdue</th>
                                        <th className="px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide text-center bg-yellow-50">Total Due</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.map((group) => {
                                        const isExpanded = expandedGroups.has(group._id);
                                        const maxOverdue = Math.max(...group.transactions.map(t => t.overdueByDay ?? 0));

                                        // Filter sub-transactions client-side too
                                        const visibleTxs = group.transactions.filter(tx => {
                                            if (selectedStatuses.length && !selectedStatuses.includes(tx.paymentStatus)) return false;
                                            if (overdueFilter !== "any") {
                                                const d = tx.overdueByDay ?? 0;
                                                if (overdueFilter === "none" && d !== 0) return false;
                                                if (overdueFilter === "1-7" && !(d >= 1 && d <= 7)) return false;
                                                if (overdueFilter === "8-30" && !(d >= 8 && d <= 30)) return false;
                                                if (overdueFilter === "30+" && d <= 30) return false;
                                            }
                                            if (dueDateFrom || dueDateTo) {
                                                if (!tx.dueDate) return false;
                                                const d = new Date(tx.dueDate);
                                                if (dueDateFrom && d < new Date(dueDateFrom)) return false;
                                                if (dueDateTo && d > new Date(dueDateTo)) return false;
                                            }
                                            if (debouncedQ) {
                                                const q = debouncedQ.toLowerCase();
                                                if (!tx.note?.toLowerCase().includes(q) &&
                                                    !tx.paymentStatus?.toLowerCase().includes(q) &&
                                                    !String(tx.amount).includes(q) &&
                                                    !String(tx.remainingDue).includes(q)) {
                                                    // keep it if parent matched on name/phone
                                                }
                                            }
                                            return true;
                                        });

                                        return (
                                            <React.Fragment key={group._id}>
                                                {/* CUSTOMER HEADER ROW */}
                                                <tr
                                                    onClick={() => toggleGroup(group._id)}
                                                    className="cursor-pointer bg-gray-50/60 hover:bg-gray-100 transition-colors border-l-4 border-l-transparent hover:border-l-green-500 group"
                                                >
                                                    <td className="px-3 py-3.5 text-center">
                                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                                    </td>
                                                    <td className="px-3 py-3.5 font-semibold text-gray-900">
                                                        <div className="flex flex-col">
                                                            <span className="group-hover:text-green-700 transition-colors">{group.customerName}</span>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-xs font-normal text-gray-400">{group.transactions.length} due{group.transactions.length > 1 ? "s" : ""}</span>
                                                                {maxOverdue > 0 && (
                                                                    <span className="text-xs text-red-500 font-medium flex items-center gap-0.5">
                                                                        <AlertTriangle className="w-3 h-3" /> {maxOverdue}d overdue
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td colSpan={5}></td>
                                                    <td className="px-3 py-3.5 text-center font-bold text-gray-900 bg-yellow-50/80 text-base">
                                                        {currency(group.totalDue)}
                                                    </td>
                                                </tr>

                                                {/* TRANSACTION SUB-ROWS */}
                                                {isExpanded && visibleTxs.map((row, idx) => (
                                                    <tr key={row._id} className={`border-l-4 border-l-transparent hover:bg-green-50/20 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                                                        <td></td>
                                                        <td className="px-3 py-2.5 text-gray-500 pl-8 text-xs italic">
                                                            {formatDate(row.createdAt)}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center font-medium text-gray-700 text-sm">
                                                            {currency(row.remainingDue)}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-gray-500 text-xs">
                                                            {row.dueDate ? formatDate(row.dueDate) : <span className="text-gray-300">—</span>}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-gray-400 text-xs italic truncate max-w-[140px]" title={row.note}>
                                                            {row.note || <span className="text-gray-200">—</span>}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <StatusBadge value={row.paymentStatus} />
                                                        </td>
                                                        <td className={`px-3 py-2.5 text-center text-xs font-semibold ${overdueColor(row.overdueByDay)}`}>
                                                            {row.overdueByDay > 0 ? `${row.overdueByDay}d` : <span className="text-gray-300">—</span>}
                                                        </td>
                                                        <td className="bg-yellow-50/10 px-3 py-2.5 text-center text-xs text-gray-400">
                                                            {currency(row.amount)}
                                                            <span className="text-gray-300 mx-1">·</span>
                                                            <span className="text-green-600">{currency(row.paidAmount)} paid</span>
                                                        </td>
                                                    </tr>
                                                ))}

                                                {/* Empty state when filters hide all sub-rows */}
                                                {isExpanded && visibleTxs.length === 0 && (
                                                    <tr>
                                                        <td colSpan={8} className="pl-10 py-2.5 text-xs text-gray-400 italic">
                                                            No transactions match current filters for this customer.
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}

                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-14 text-center text-gray-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <CheckCircle2 className="w-8 h-8 text-gray-200" />
                                                    <span>No pending dues match your filters</span>
                                                    {activeFilters.length > 0 && (
                                                        <button onClick={clearAllFilters} className="text-xs text-green-600 underline">Clear filters</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ))}

                    {/* ── Pagination ── */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                            <p className="text-sm text-gray-500 hidden sm:block">
                                Page <span className="font-semibold text-gray-800">{pagination.currentPage}</span> of <span className="font-semibold text-gray-800">{pagination.totalPages}</span>
                                <span className="text-gray-400 ml-1">({pagination.totalGroups} customers total)</span>
                            </p>
                            <div className="flex gap-2 items-center">
                                <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}
                                    className="p-2 text-gray-400 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="flex gap-1">
                                    {[...Array(pagination.totalPages)].map((_, i) => {
                                        const p = i + 1;
                                        if (pagination.totalPages <= 7 || p === 1 || p === pagination.totalPages || (p >= pagination.currentPage - 1 && p <= pagination.currentPage + 1)) {
                                            return (
                                                <button key={p} onClick={() => handlePageChange(p)}
                                                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${pagination.currentPage === p ? "bg-green-600 text-white" : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"}`}>
                                                    {p}
                                                </button>
                                            );
                                        } else if (p === pagination.currentPage - 2 || p === pagination.currentPage + 2) {
                                            return <span key={p} className="px-1 text-gray-300 self-center">…</span>;
                                        }
                                        return null;
                                    })}
                                </div>
                                <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages}
                                    className="p-2 text-gray-400 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TransactionHistory;