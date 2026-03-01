import React, { useState, useEffect, useRef } from "react";
import {
  currency,
  formatDate,
  StatusBadge,
  ActionBadge,
} from "../../../utils/AfterAuthUtils/Helpers";
import { Download, FileText, Loader2, Pencil, Trash2 } from "lucide-react";
import { TableHeaders } from "../../../utils/constants.js";
import {
  deleteCustomerById,
  getAllcustomers,
  getCustomers,
  getCustomerTransactions,
  updatecustomer,
} from "../../../utils/service/customerService";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import EditCustomerModal from "./EditCustomerModal.jsx";
import ConfirmModal from "./ConfirmModal.jsx";
import TransactionHistoryModal from "./TransactionHistoryModal.jsx";
import { useNavigate } from "react-router-dom";
import { socket } from "../../../socket/index.js";
import CustomerTableSkeleton from "./CustomerTableSkeleton.jsx";

// ── Skeleton shimmer row ──────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="animate-pulse">
    {Array.from({ length: TableHeaders.length }).map((_, i) => (
      <td key={i} className="px-3 py-4">
        <div
          className="h-3.5 bg-gray-100 rounded-full"
          style={{ width: `${50 + (i % 3) * 20}%` }}
        />
      </td>
    ))}
  </tr>
);

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = () => (
  <tr>
    <td colSpan={TableHeaders.length} className="px-6 py-16 text-center">
      <div className="flex flex-col items-center justify-center gap-3">
        <svg
          className="w-24 h-24 text-gray-200"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="30"
            y="50"
            width="140"
            height="100"
            rx="8"
            fill="currentColor"
          />
          <rect
            x="50"
            y="70"
            width="60"
            height="8"
            rx="4"
            fill="white"
            fillOpacity="0.7"
          />
          <rect
            x="50"
            y="90"
            width="100"
            height="6"
            rx="3"
            fill="white"
            fillOpacity="0.5"
          />
          <rect
            x="50"
            y="106"
            width="80"
            height="6"
            rx="3"
            fill="white"
            fillOpacity="0.5"
          />
          <rect
            x="50"
            y="122"
            width="90"
            height="6"
            rx="3"
            fill="white"
            fillOpacity="0.5"
          />
          <circle cx="155" cy="55" r="22" fill="#86efac" />
          <path
            d="M146 55l6 6 10-12"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div>
          <p className="text-gray-600 font-medium text-sm">
            No customers found
          </p>
          <p className="text-gray-400 text-xs mt-0.5">
            Try adjusting your search
          </p>
        </div>
      </div>
    </td>
  </tr>
);

const CustomerTable = ({ search = "", onStatsReady }) => {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [debounceQuery, setDebounceQuery] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [showEditMOdal, setShowEditModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletedCustomerId, setDeletedCustomerId] = useState();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const editRef = useRef();
  const transactionRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const handleMouseClick = (e) => {
      if (!showEditMOdal || !showTransactionModal) return;
      if (
        (editRef !== undefined && editRef.current?.contains(e.target)) ||
        (transactionRef !== undefined &&
          transactionRef.current?.contains(e.target))
      )
        return;
      setShowEditModal(false);
      setShowTransactionModal(false);
    };
    document.addEventListener("mousedown", handleMouseClick);
    return () => document.removeEventListener("mousedown", handleMouseClick);
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebounceQuery(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 on new search
  useEffect(() => {
    setPage(1);
  }, [debounceQuery]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await getCustomers({ page, limit, search: debounceQuery });
      const list = data.data.customers;
      setCustomers(list);
      setTotalPages(data.data.totalPages);
      setTotalCustomers(data.data.total);

      // Bubble stats up to parent
      if (onStatsReady) {
        const highDue = list.filter((c) => (c.currentDue || 0) > 0).length;
        onStatsReady({
          total: data.data.total,
          highDue,
          lastUpdated: new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, debounceQuery]);

  // Socket updates
  useEffect(() => {
    if (!socket.connected) socket.connect();
    socket.on("feedback_updated", (data) => {
      setCustomers((prev) =>
        prev.map((c) =>
          c.mobile === data.mobile ? { ...c, feedback: data?.feedback } : c,
        ),
      );
    });
  }, []);

  const handleEditCustomer = (customer) => {
    setCurrentCustomer(
      Object.fromEntries(
        Object.entries(customer).filter(
          ([key]) => !["__v", "createdAt", "updatedAt"].includes(key),
        ),
      ),
    );
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    const response = await updatecustomer(currentCustomer._id, currentCustomer);
    if (response.status === 200) {
      toast.success("Customer updated");
      setCustomers((prev) =>
        prev.map((c) => (c._id === currentCustomer._id ? response.data : c)),
      );
      setShowEditModal(false);
    } else {
      toast.error("Error while updating");
    }
  };

  const handleDeleteCustomer = (id) => {
    setDeletingId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    const res = await deleteCustomerById(deletingId);
    if (res.success) {
      setDeletedCustomerId(deletingId);
      setTimeout(() => {
        const updatedCustomers = customers.filter((c) => c._id !== deletingId);
        const newTotalCount = totalCustomers - 1;
        setTotalCustomers(newTotalCount);

        if (updatedCustomers.length === 0 && newTotalCount > 0) {
          // If the page is now empty but there are more customers
          if (page > 1) {
            setPage((prev) => prev - 1);
          } else {
            // On page 1, manually refetch to bring items from next page
            fetchCustomers();
          }
        } else {
          setCustomers(updatedCustomers);
        }
        setDeletingId(null);
      }, 300);
      toast.success("Customer deleted");
    } else {
      toast.error(res?.error || "Error while deleting");
    }
    setConfirmOpen(false);
  };

  const handleAllTransactions = (c) => {
    setCurrentCustomer(c);
    async function loadTxn() {
      try {
        const tsx = await getCustomerTransactions(c._id);
        setTransactions(tsx.data?.dues || tsx.dues || []);
      } catch (error) {
        console.error(error);
      }
    }
    loadTxn();
    setShowTransactionModal(true);
  };

  const handleCloseTransaction = () => {
    //assuing it will only called when comming from transaction view modal

    console.log("printing the customer txn: ", transactions[0]);
    //update the totalDUE in UI
    // if(transaction type is due added then add in current due, else it is payment then show the as it is )
    setCustomers((prev) =>
      prev.map((c) =>
        c._id === currentCustomer._id
          ? { ...c, currentDue: transactions[0]?.remainingDue }
          : c,
      ),
    );
    setShowTransactionModal(false);
  };

  const handleDownloadCsv = async () => {
    try {
      const response = await getAllcustomers();
      const data = response.data.customers;
      let initialKeys = Object.keys(data[0]);
      if (!initialKeys.includes("feedback")) {
        initialKeys.push("feedback");
      }
      const headers = initialKeys.filter(
        (row) =>
          ![
            "__v",
            "CustomerOfComapny",
            "createdAt",
            "updatedAt",
            "lastTransaction",
            "lastInteraction",
          ].includes(row),
      ); // keys array will be stored

      // Convert headers to CSV row
      const csvRows = [headers.join(",")]; // keystring

      // Convert data rows: N*N Time Complexity
      data.forEach((row) => {
        const values = headers.map((header) => {
          let val = row[header];
          if (
            header &&
            header === "currentDue" &&
            row[header] !== undefined &&
            row[header] !== null
          ) {
            val = `Rs. ${row[header]}`;
          }
          if (header && header === "lastReminder" && row[header]) {
            val = new Date(row[header]).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });
          }
          if (val && typeof val === "object") {
            if (header === "lastTransaction") {
              const amount = val.amount ? `${val.amount}` : "";
              const date =
                val.createdAt || val.date
                  ? `(${formatDate(val.createdAt || val.date)})`
                  : "";
              val = val.amount
                ? `${amount} ${date} ID:${val._id}`
                : `${val._id}`;
            } else if (header === "paymentTerm") val = val.name || "";
            else val = JSON.stringify(val);
          }
          val = val !== null && val !== undefined ? val : "";
          return `"${val}"`;
        });
        csvRows.push(values.join(","));
      });
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nodue-customerlist-${formatDate(new Date().toISOString().split("T")[0])}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch (error) {
      console.log(error);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await getAllcustomers();
      const data = response.data.customers;
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("All Customers History", 14, 20);

      let initialKeys = Object.keys(data[0]);
      if (!initialKeys.includes("feedback")) {
        initialKeys.push("feedback");
      }
      const tableColumns = initialKeys.filter(
        (row) =>
          ![
            "_id",
            "__v",
            "email",
            "CustomerOfComapny",
            "createdAt",
            "updatedAt",
            "lastTransaction",
            "lastInteraction",
          ].includes(row),
      ); // array of headers

      const tableRows = []; //rows according to headers
      data.forEach((row) => {
        const values = tableColumns.map((header) => {
          let val = row[header];
          console.log("val", val);
          if (
            header &&
            header === "currentDue" &&
            row[header] !== undefined &&
            row[header] !== null
          ) {
            val = `Rs. ${row[header]}`;
          }
          if (header && header === "lastReminder" && row[header]) {
            //formatting date: 13 Feb 2026, 09:24 am

            val = new Date(row[header]).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });
          }
          if (header && header === "paymentTerm" && row[header]) {
            // it will be object have to save it
            val = row[header].name.slice(0, 20);
          }
          if (val && typeof val === "object") {
            if (header === "lastTransaction") {
              const txId = val._id || val.id || "";
              const amount = val.amount ? `${val.amount}` : "";
              const date =
                val.createdAt || val.date
                  ? `(${formatDate(val.createdAt || val.date)})`
                  : "";

              if (val.amount) {
                val = `${amount} ${date} ID:${txId}`;
              } else {
                val = `${txId}`; // only adding id
              }
            } else if (header === "paymentTerm") {
              val = val.name || "";
            } else {
              val = JSON.stringify(val);
            }
          }
          return val; //taking only that is defined in filtered tableColumns above
        });

        tableRows.push(values);
      });

      const updatedColumns = tableColumns.map(
        (hd) => hd.charAt(0).toUpperCase() + hd.substring(1),
      );

      const nameIndex = tableColumns.indexOf("name");
      const reminderIndex = tableColumns.indexOf("lastReminder");
      const mobileIndex = tableColumns.indexOf("mobile");
      const currentDueIndex = tableColumns.indexOf("currentDue");
      const genderIndex = tableColumns.indexOf("gender");
      const statusIndex = tableColumns.indexOf("status");

      // Generate table
      autoTable(doc, {
        head: [updatedColumns],
        body: tableRows,
        startY: 30,
        styles: { fontSize: 10 },
        headStyles: {
          fillColor: [123, 241, 168],
          textColor: [0, 0, 0], // header text color
          fontStyle: "bold",
          halign: "left",
        },
        columnStyles: {
          // manually adding some space in that
          [nameIndex]: { cellWidth: 28 },
          [reminderIndex]: { cellWidth: 25 },
          [mobileIndex]: { cellWidth: 28 },
          [currentDueIndex]: { cellWidth: 18 },
          [statusIndex]: { cellWidth: 13 },
          [genderIndex]: { cellWidth: 16 },
        },
      });
      doc.save(
        `nodue-customerlist-${formatDate(new Date().toISOString().split("T")[0])}.pdf`,
      );
      toast.success("PDF downloaded");
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return <CustomerTableSkeleton />;
  }

  // Filtering is now done server-side; `customers` already contains only matching results
  const filteredCustomers = customers;

  return (
    <div className="hidden md:block rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          {/* ── Sticky header ── */}
          <thead className="sticky top-0 z-10 bg-gradient-to-b from-gray-50 to-gray-50/95 border-b border-gray-100">
            <tr>
              {TableHeaders.map((h, i) => (
                <th
                  key={i}
                  className={`py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${
                    i === 0 ? "pl-3 pr-1 w-6" : "px-3"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : customers.length === 0 ? (
              <EmptyState />
            ) : (
              customers.map((c, index) => (
                <tr
                  key={c._id}
                  className={`
                      group transition-all duration-200
                      hover:bg-green-50/40 hover:shadow-[inset_3px_0_0_0_#22c55e]
                      ${deletedCustomerId === c._id ? "opacity-0 scale-95" : "opacity-100"}
                    `}
                >
                  <td className="pl-3 pr-1 py-4 text-gray-400 text-xs font-medium w-6">
                    {(page - 1) * limit + index + 1}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2.5">
                      {/* Avatar */}
                      {/* <div className="shrink-0 w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-green-700">
                          {(c.name || "?")[0].toUpperCase()}
                        </span>
                      </div> */}
                      <span className="font-medium text-gray-900 truncate max-w-[140px]">
                        {c.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-gray-600 text-sm">
                    {`+91 ${c.mobile.slice(2, 5)} ${c.mobile.slice(5, 8)} ${c.mobile.slice(8, 12)}`}
                  </td>
                  <td className="px-3 py-4 font-semibold whitespace-nowrap">
                    <span
                      className={
                        (c.currentDue || 0) > 0
                          ? "text-red-600"
                          : "text-gray-400"
                      }
                    >
                      {currency(c.currentDue)}
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-gray-500 text-sm">
                    {formatDate(c.lastReminder)}
                  </td>
                  <td className="px-3 py-4">
                    <StatusBadge value={c.status} />
                  </td>
                  <td className="px-3 py-4 text-gray-600 text-sm max-w-[160px] truncate">
                    {c.feedback ? (
                      c.feedback
                        .toLowerCase()
                        .replace(/\b\w/g, (l) => l.toUpperCase())
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td>
                    <ActionBadge
                      onEdit={() => handleEditCustomer(c)}
                      onDelete={() => handleDeleteCustomer(c._id)}
                      onTransaction={() => handleAllTransactions(c)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="md:flex inline-flex md:flex-wrap items-center justify-between border-gray-200 bg-gray-50 px-2 md:px-2 py-3 text-sm text-gray-700 gap-3">
        <span>
          Total:{" "}
          <strong className="font-semibold text-gray-900">
            {totalCustomers}
          </strong>{" "}
          customers
        </span>

        <div className="md:flex items-center md:justify-center justify-end gap-3 p-4   bg-gray-50">
          {/* Pagination */}
          {/* Previous Button */}
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className={`px-4 py-2 rounded-lg border ${
              page === 1
                ? "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                : "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
            }`}
          >
            ← Prev
          </button>
          <span className="text-gray-500 text-xs px-1">
            <strong className="text-gray-700">{page}</strong> /{" "}
            <strong className="text-gray-700">{totalPages || 1}</strong>
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className={`px-4 py-2 rounded-lg border ${
              page === totalPages
                ? "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                : "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
            }`}
          >
            Next →
          </button>
        </div>

        {/* Export */}
        <div className="flex gap-2">
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 hover:cursor-pointer"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 hover:cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {showEditMOdal && (
        <div ref={editRef}>
          <EditCustomerModal
            customer={currentCustomer}
            setEditCustomer={setCurrentCustomer}
            handleClose={() => setShowEditModal(false)}
            handleEditSubmit={handleEditSubmit}
          />
        </div>
      )}
      {/* confirmation dialogue */}
      {confirmOpen && (
        <ConfirmModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          message="Are you sure you want to delete this customer?"
        />
      )}
      {showTransactionModal && (
        <div ref={transactionRef}>
          <TransactionHistoryModal
            customer={currentCustomer}
            setCurrentCustomer={setCurrentCustomer}
            setCustomers={setCustomers}
            transactions={transactions}
            setTransactions={setTransactions}
            handleClose={handleCloseTransaction}
          />
        </div>
      )}
    </div>
  );
};

export default CustomerTable;
