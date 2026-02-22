import React, { useEffect, useMemo, useState } from "react";
import { getCustomers } from "./../../../utils/service/customerService";
import { getDueTransactionsSummary } from "./../../../utils/service/userService";
import { formatDate, currency, StatusBadge } from "../../../utils/AfterAuthUtils/Helpers";
import { Loader2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import PageHeaders from "../../../utils/AfterAuthUtils/PageHeaders";
import TransactionHistoryModal from "./TransactionHistoryModal";

const TransactionHistoryDuePage = () => {
    const [loading, setLoading] = useState(true);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [groupedTransactions, setGroupedTransactions] = useState([]);
    const [expandedGroups, setExpandedGroups] = useState(new Set()); // Track expanded customers

    const [pagination, setPagination] = useState({
        totalGroups: 0,
        currentPage: 1,
        totalPages: 1,
        limit: 10
    });

    const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);

    useEffect(() => {
        fetchData(pagination.currentPage);
    }, [pagination.currentPage]);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const customersRes = await getCustomers({ limit: 1000 });
            setCustomers(customersRes?.data?.customers || []);
        } catch (err) {
            console.error("Failed to load customers", err);
        }
    };

    const fetchData = async (page) => {
        try {
            setLoading(true);
            const res = await getDueTransactionsSummary({ page, limit: 10 });
            console.log(res.data.transactions);
            if (res.success) {
                setGroupedTransactions(res.data.transactions);
                setPagination(res.data.pagination);
            }
        } catch (err) {
            console.error("Failed to load due summary", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, currentPage: newPage }));
        }
    };

    const toggleGroup = (groupId) => {
        const newSet = new Set(expandedGroups);
        if (newSet.has(groupId)) {
            newSet.delete(groupId);
        } else {
            newSet.add(groupId);
        }
        setExpandedGroups(newSet);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 mb-10">
            <PageHeaders
                header="Transaction History - Due Summary"
                subheader="Select a customer row to view their full transaction payment history."
                buttonName="Add Transaction"
                handleOnClick={() => setShowAddTransactionModal(true)}
            />


            <p className='text-xs component-subheader'>Only pending Due are shown here</p>

            {showAddTransactionModal && !showTransactionModal && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
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
                        {customers.map(c => (
                            <option key={c._id} value={c._id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {!showAddTransactionModal && (
                <div className="space-y-4">
                    <div className="block md:block rounded-lg border border-gray-200 bg-white shadow-sm  overflow-hidden overflow-x-auto md:overflow-x-visible">
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
                                    fetchData(pagination.currentPage);
                                }}
                            />
                        )}

                        <table className="min-w-wax w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="w-10"></th>
                                    <th className="px-3 py-3 text-xs font-medium text-gray-700 uppercase">Customer / Date</th>
                                    <th className="px-3 py-3 text-xs font-medium text-gray-700 uppercase text-center">Remaining Amount</th>
                                    <th className="px-3 py-3 text-xs font-medium text-gray-700 uppercase">Due Date</th>
                                    <th className="px-3 py-3 text-xs font-medium text-gray-700 uppercase">Note</th>
                                    <th className="px-3 py-3 text-xs font-medium text-gray-700 uppercase text-center">Status</th>
                                    <th className="px-3 py-3 text-xs font-medium text-gray-700 uppercase text-center">Overdue Days</th>
                                    <th className="px-3 py-3 text-xs font-medium text-gray-700 uppercase text-center bg-yellow-50">Total Due</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {groupedTransactions.map((group) => {
                                    const isExpanded = expandedGroups.has(group._id);
                                    return (
                                        <React.Fragment key={group._id}>
                                            {/* CUSTOMER HEADER ROW */}
                                            <tr
                                                onClick={() => toggleGroup(group._id)}
                                                className="cursor-pointer bg-gray-50/50 hover:bg-gray-100 transition-colors border-l-4 border-l-transparent hover:border-l-green-500"
                                            >
                                                <td className="px-3 py-4 text-center">
                                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </td>
                                                <td className="px-3 py-4 font-bold text-gray-900">
                                                    <div className="flex flex-col">
                                                        <span>{group.customerName}</span>
                                                        <span className="text-xs font-normal text-gray-500">{group.transactions.length} Pending Dues</span>
                                                    </div>
                                                </td>
                                                <td colSpan={5}></td>
                                                <td className="px-3 py-4 text-center font-bold text-gray-900 bg-yellow-50/50 text-base">
                                                    {currency(group.totalDue)}
                                                </td>
                                            </tr>

                                            {/* TRANSACTION SUB-ROWS */}
                                            {isExpanded && group.transactions.map((row) => (
                                                <tr key={row._id} className="bg-white border-l-4 border-l-transparent">
                                                    <td></td>
                                                    <td className="px-3 py-3 text-gray-600 pl-8 text-xs italic">
                                                        {formatDate(row.createdAt)}
                                                    </td>
                                                    <td className="px-3 py-3 text-center font-medium text-gray-700">
                                                        {currency(row.remainingDue)}
                                                    </td>
                                                    <td className="px-3 py-3 text-gray-600">
                                                        {formatDate(row.dueDate)}
                                                    </td>
                                                    <td className="px-3 py-3 text-gray-500 text-xs italic truncate max-w-[150px]" title={row.note}>
                                                        {row.note || "-"}
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <StatusBadge value={row.paymentStatus} />
                                                    </td>
                                                    <td className="px-3 py-3 text-center text-red-700 font-semibold">
                                                        {row.overdueByDay > 0 ? `${row.overdueByDay} days` : "-"}
                                                    </td>
                                                    <td className="bg-yellow-50/10"></td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}

                                {groupedTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-16 text-center text-gray-500">
                                            No pending dues found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <div className="flex flex-1 justify-between sm:hidden">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                <div>

                                    <p className="text-sm text-gray-700">
                                        Showing page <span className="font-medium">{pagination.currentPage}</span> of <span className="font-medium">{pagination.totalPages}</span> (Total <span className="font-medium">{pagination.totalGroups}</span> customers)
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage === 1}
                                        className="relative inline-flex items-center p-2 text-gray-400 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {[...Array(pagination.totalPages)].map((_, i) => {
                                            const pageNum = i + 1;
                                            if (
                                                pagination.totalPages <= 7 ||
                                                pageNum === 1 ||
                                                pageNum === pagination.totalPages ||
                                                (pageNum >= pagination.currentPage - 1 && pageNum <= pagination.currentPage + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${pagination.currentPage === pageNum
                                                            ? "bg-green-600 text-white"
                                                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-100"
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            } else if (
                                                pageNum === pagination.currentPage - 2 ||
                                                pageNum === pagination.currentPage + 2
                                            ) {
                                                return <span key={pageNum} className="text-gray-400">...</span>;
                                            }
                                            return null;
                                        })}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage === pagination.totalPages}
                                        className="relative inline-flex items-center p-2 text-gray-400 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TransactionHistoryDuePage;