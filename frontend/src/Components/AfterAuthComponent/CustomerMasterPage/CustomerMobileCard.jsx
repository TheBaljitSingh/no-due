import React, { useState, useEffect } from "react";
import {
  currency,
  formatDate,
  StatusBadge,
} from "../../../utils/AfterAuthUtils/Helpers";
import {
  getAllcustomers,
  getCustomers,
} from "../../../utils/service/customerService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import { Download, FileText, Phone } from "lucide-react";

// ── Initials avatar ───────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-green-100 text-green-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

const Avatar = ({ name }) => {
  const letter = (name || "?")[0].toUpperCase();
  const colorClass = AVATAR_COLORS[letter.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div
      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-base ${colorClass}`}
    >
      {letter}
    </div>
  );
};

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-10 text-center">
    <svg
      className="w-20 h-20 mx-auto text-gray-200 mb-3"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="30" y="50" width="140" height="100" rx="8" fill="currentColor" />
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
      <circle cx="155" cy="55" r="22" fill="#86efac" />
      <path
        d="M146 55l6 6 10-12"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <p className="text-gray-600 font-medium text-sm">No customers found</p>
    <p className="text-gray-400 text-xs mt-0.5">Try adjusting your search</p>
  </div>
);

// ── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4 animate-pulse">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-gray-100" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-gray-100 rounded-full w-2/3" />
        <div className="h-3 bg-gray-100 rounded-full w-1/3" />
      </div>
      <div className="w-14 h-5 bg-gray-100 rounded-full" />
    </div>
    <div className="space-y-2">
      {[80, 60, 70].map((w, i) => (
        <div
          key={i}
          className="h-3 bg-gray-100 rounded-full"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  </div>
);

const CustomerMobileCard = ({ search = "", onStatsReady }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [debounceQuery, setDebounceQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounceQuery(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const data = await getCustomers({ page, limit, search: debounceQuery });
        const list = data.data.customers;
        setCustomers(list);
        setTotalCustomers(data.data.total);
        setTotalPages(data.data.totalPages);

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
    fetchCustomers();
  }, [page, limit, debounceQuery]);

  const handleDownloadCsv = async () => {
    try {
      const response = await getAllcustomers();
      const data = response.data.customers;
      let initialKeys = Object.keys(data[0]);
      if (!initialKeys.includes("feedback")) initialKeys.push("feedback");
      const headers = initialKeys.filter(
        (row) =>
          ![
            "__v",
            "CustomerOfComapny",
            "createdAt",
            "updatedAt",
            "lastTransaction",
          ].includes(row),
      );
      const csvRows = [headers.join(",")];
      data.forEach((row) => {
        const values = headers.map((header) => {
          let val = row[header];

          if (header === "mobile") {
            val = `="${val}"`;
          }

          if (val && typeof val === "object") {
            if (header === "paymentTerm") {
              val = val.name || "";
            } else {
              val = JSON.stringify(val); // Fallback for other objects
            }
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
      a.download = `nodue-customerlist-${new Date().toISOString().split("T")[0]}.csv`;
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
          textColor: [0, 0, 0],
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

      // Save the PDF // nodue-customerlist-date.pdf
      const d = new Date();
      const fileName = `nodue-customerlist-${formatDate(d.toISOString().split("T")[0])}`;
      doc.save(`${fileName}.pdf`);
      toast.success("successfully downloaded");
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return <CustomerMobileCardSkeleton />;
  }

  return (
    <div className="md:hidden space-y-3">
      {/* Cards */}
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
      ) : customers.length === 0 ? (
        <EmptyState />
      ) : (
        customers.map((c) => (
          <div
            key={c._id}
            className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-4 space-y-3">
              {/* Top row: avatar + name + status */}
              <div className="flex items-center gap-3">
                <Avatar name={c.name} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {c.name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    {c.company || "—"}
                  </p>
                </div>
                <StatusBadge value={c.status} />
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Current Due</p>
                  <p
                    className={`font-semibold ${(c.currentDue || 0) > 0 ? "text-red-600" : "text-gray-400"}`}
                  >
                    {currency(c.currentDue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Mobile</p>
                  <p className="text-gray-700 font-medium text-xs">{`+91 ${c.mobile?.slice(2, 5)} ${c.mobile?.slice(5, 8)} ${c.mobile?.slice(8, 12)}`}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Last Reminder</p>
                  <p className="text-gray-600 text-xs">
                    {formatDate(c.lastReminder)}
                  </p>
                </div>
                {c.feedback && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Feedback</p>
                    <p className="text-gray-600 text-xs line-clamp-1">
                      {c.feedback}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {/* Mobile Footer */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Total:{" "}
              <strong className="font-semibold text-gray-800">
                {totalCustomers}
              </strong>{" "}
              customers
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                ← Prev
              </button>
              <span className="text-xs text-gray-500">
                {page}/{totalPages || 1}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadCsv}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerMobileCard;
