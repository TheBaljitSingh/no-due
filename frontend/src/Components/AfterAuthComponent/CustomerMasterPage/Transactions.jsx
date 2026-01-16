import React, { useEffect, useMemo, useState } from "react";
import { getCustomers, getCustomerTransactions } from "./../../../utils/service/customerService";
import { formatDate, currency, StatusBadge } from "../../../utils/AfterAuthUtils/Helpers";
import { Loader2 } from "lucide-react";
import PageHeaders from "../../../utils/AfterAuthUtils/PageHeaders";
import TransactionHistoryModal from "./TransactionHistoryModal";

const TransactionHistoryDuePage = () => {
    const [loading, setLoading] = useState(true);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [transactionsByCustomer, setTransactionsByCustomer] = useState({});
    const [transactions, setTransactions] = useState([]);

    const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const rows = useMemo(() => {
        const allRows = [];
        Object.entries(transactionsByCustomer).forEach(([customerId, dues]) => {
            dues.forEach(due => {
                if (due.type === "DUE_ADDED" && due.remainingDue > 0 && due.dueDate) {
                    const overdueByDays = Math.max(
                        0,
                        Math.ceil((new Date() - new Date(due.dueDate)) / (1000 * 60 * 60 * 24))
                    );
                    allRows.push({
                        id: due._id,
                        customerId,
                        partyName: customers.find(c => c._id === customerId)?.name || "",
                        date: due.createdAt,
                        dueOn: due.dueDate,
                        pendingAmount: due.remainingDue,
                        status: due.paymentStatus,
                        overdueByDays
                    });
                }
            });
        });
        return allRows;
    }, [transactionsByCustomer, customers]);



    const fetchData = async () => {
        try {
            setLoading(true);

            const customersRes = await getCustomers();
            const customers = customersRes?.data?.customers || [];
            setCustomers(customers);

            const allRows = [];

            for (const customer of customers) {
                const txRes = await getCustomerTransactions(customer._id);
                console.log("Transactions for customer", customer.name, txRes);
                const dues = txRes?.data?.dues || [];
                setTransactionsByCustomer(prev => ({
                    ...prev,
                    [customer._id]: txRes?.data?.dues || []
                }));

                dues.forEach((due) => {
                    if (due.type === "DUE_ADDED" && due.remainingDue > 0 && due.dueDate) {
                        const dueDate = new Date(due.dueDate);
                        const today = new Date();

                        const overdueByDays = Math.max(
                            0,
                            Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24))
                        );

                        allRows.push({
                            id: due._id,
                            customerId: customer._id,
                            partyName: customer.name,
                            date: due.createdAt,
                            dueOn: due.dueDate,
                            pendingAmount: due.remainingDue,
                            status: due.paymentStatus,
                            overdueByDays
                        });
                    }
                });
            }

        } catch (err) {
            console.error("Failed to load due summary", err);
        } finally {
            setLoading(false);
        }
    };

    /** Group by customer */
    const groupedData = useMemo(() => {
        const map = {};

        rows.forEach((row) => {
            if (!map[row.customerId]) {
                map[row.customerId] = {
                    partyName: row.partyName,
                    rows: [],
                    totalDue: 0
                };
            }

            map[row.customerId].rows.push(row);
            map[row.customerId].totalDue += row.pendingAmount;
        });

        return map;
    }, [rows]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
            </div>
        );
    }

    return (
        <div>
            <PageHeaders
                header="Transaction History - Due Summary"
                subheader="All pending dues across customers, grouped by customer."
                buttonName="Add Transaction"
                handleOnClick={() => setShowAddTransactionModal(true)}
            />


            {showAddTransactionModal && !showTransactionModal && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                        Select Customer
                    </p>

                    <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        onChange={(e) => {
                            const selected = customers.find(c => c._id === e.target.value);

                            setCurrentCustomer(selected);
                            setTransactions(transactionsByCustomer[selected._id] || []);
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

                <div className="hidden md:block rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                    {showTransactionModal && currentCustomer && (
                        <div>
                            <TransactionHistoryModal
                                customer={currentCustomer}
                                setCurrentCustomer={setCurrentCustomer}
                                setCustomers={setCustomers}
                                transactions={transactions}
                                setTransactions={setTransactions}
                                handleClose={() => {
                                    setTransactionsByCustomer(prev => ({
                                        ...prev,
                                        [currentCustomer._id]: transactions // updated transactions
                                    }));
                                    setShowTransactionModal(false);
                                    setCurrentCustomer(null);
                                }}
                            />
                        </div>
                    )}

                    <div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-2 py-3 text-xs font-medium text-gray-700 uppercase">Date</th>
                                    <th className="px-2 py-3 text-xs font-medium text-gray-700 uppercase">Customer</th>
                                    <th className="px-2 py-3 text-xs font-medium text-gray-700 uppercase text-right">Remaining</th>
                                    <th className="px-2 py-3 text-xs font-medium text-gray-700 uppercase">Due Date</th>
                                    <th className="px-2 py-3 text-xs font-medium text-gray-700 uppercase text-right">Overdue</th>
                                    <th className="px-2 py-3 text-xs font-medium text-gray-700 uppercase">Status</th>
                                    <th className="px-2 py-3 text-xs font-medium text-gray-700 uppercase text-center bg-yellow-50">Total Due</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {Object.values(groupedData).map((group) => (
                                    <React.Fragment key={group.partyName}>
                                        {group.rows.map((row, index) => (
                                            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-2 py-4 text-gray-700 align-middle whitespace-nowrap">
                                                    {formatDate(row.date)}
                                                </td>

                                                <td className="px-2 py-4 font-medium text-gray-900 align-middle whitespace-nowrap">
                                                    {row.partyName}
                                                </td>

                                                <td className="px-2 py-4 text-right font-medium text-gray-900 align-middle">
                                                    {currency(row.pendingAmount)}
                                                </td>

                                                <td className="px-2 py-4 text-gray-700 align-middle whitespace-nowrap">
                                                    {formatDate(row.dueOn)}
                                                </td>

                                                <td className="px-2 py-4 text-right font-medium text-red-600 align-middle">
                                                    {row.overdueByDays}
                                                </td>

                                                <td className="px-2 py-4 align-middle">
                                                    <StatusBadge value={row.status} />
                                                </td>

                                                {index === 0 && (
                                                    <td
                                                        rowSpan={group.rows.length}
                                                        className="px-2 py-4 text-center align-middle font-semibold bg-yellow-50 text-gray-900"
                                                    >
                                                        {currency(group.totalDue)}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}

                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center text-gray-500">
                                            No dues found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionHistoryDuePage;