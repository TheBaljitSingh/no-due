import React, { useState, useEffect, useRef } from 'react'
import { currency, formatDate, StatusBadge, ActionBadge } from '../../../utils/AfterAuthUtils/Helpers'
import { Download, FileText, Loader2, Pencil, Trash2 } from 'lucide-react'
import { TableHeaders } from "../../../utils/constants.js";
import { deleteCustomerById, getAllcustomers, getCustomers, getCustomerTransactions, updatecustomer } from "../../../utils/service/customerService";
import { toast } from 'react-toastify';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import EditCustomerModal from "./EditCustomerModal.jsx"
import ConfirmModal from "./ConfirmModal.jsx"
import TransactionHistoryModal from "./TransactionHistoryModal.jsx"
import { useNavigate } from 'react-router-dom';


const CustomerTable = () => {

  const [loading, setLoading] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState();
  const [totalCustomers, setTotalCustomers] = useState();
  const [deletingId, setDeletingId] = useState(null);
  const [currentCustomer, setCurrentCustomer] = useState([]);
  const [showEditMOdal, setShowEditModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletedCustomerId, setDeletedCustomerId] = useState();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const editRef = useRef();
  const transactionRef = useRef();


  useEffect(() => {
    const handleMouseClick = (e) => {
      if (!showEditMOdal || !showTransactionModal) return;

      if ((editRef !== undefined && editRef.current.contains(e.target)) || (transactionRef != undefined && transactionRef.current.contains(e.target))) {
        return;
      }

      setShowEditModal(false);
      setShowTransactionModal(false);

    }
    document.addEventListener("mousedown", handleMouseClick);

    return () => document.removeEventListener("mousedown", handleMouseClick);
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const data = await getCustomers({ page, limit });
        setCustomers(data.data.customers);
        setTotalPages(data.data.totalPages)
        setTotalCustomers(data.data.total);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();

  }, [page]);


  const handleEditCustomer = (customer) => {
    setCurrentCustomer(customer);
    setCurrentCustomer(Object.fromEntries(Object.entries(customer).filter(([key]) => !['__v', 'createdAt', 'updatedAt'].includes(key)))); // removing unwanted keys for update
    setShowEditModal(true);

  }

  const handleEditSubmit = async () => {
    const response = await updatecustomer(currentCustomer._id, currentCustomer);
    console.log(response);
    //else{call update api with data and id
    if (response.status === 200) {
      toast.success("Customer updated");
      //update the existing array obj
      setCustomers(prev => prev.map(c => c._id === currentCustomer._id ? response.data : c)); //updated the customer no extra  api call
      setShowEditModal(false);


    } else {
      console.log(response)
      toast.error("error while updating")
    }
  }

  const handleDeleteCustomer = async (id) => {
    // console.log("delete called",id);
    //call the api
    setDeletingId(id);
    setConfirmOpen(true);


  }

  const handleConfirmDelete = async () => {

    const res = await deleteCustomerById(deletingId);
    // console.log(res);

    if (res.success) {
      setDeletedCustomerId(deletingId); // to show the delete animation
      setTimeout(() => {
        const updatedCustomers = customers.filter(c => c._id !== deletingId);
        setCustomers(updatedCustomers);
        setTotalCustomers(prev => prev - 1);
        setDeletingId(null);
        // console.log(updatedCustomers);

      }, 300)
      toast.success("Customer deleted");
    } else {
      toast.error(res?.error || "error while deleting");
    }

    setConfirmOpen(false);
  };


  const handleAllTransactions = (c) => {
    //input: customer obj
    //
    setCurrentCustomer(c); //current customer have to perform actions
    console.log(c);
    async function loadTxn() {
      try {
        const tsx = await getCustomerTransactions(c._id);
        setTransactions(tsx.data?.dues || tsx.dues || []);
        console.log(tsx);
      }
      catch (error) {
        console.error(error);
      } finally {
      }
    }

    loadTxn();
    setShowTransactionModal(true);

  }



  const handleCloseTransaction = () => {
    //assuing it will only called when comming from transaction view modal

    console.log("printing the customer txn: ", transactions[0]);
    //update the totalDUE in UI
    // if(transaction type is due added then add in current due, else it is payment then show the as it is )
    setCustomers(prev => prev.map(c => c._id === currentCustomer._id ? { ...c, "currentDue": transactions[0]?.remainingDue } : c));
    setShowTransactionModal(false);
  }

  const handleDownloadCsv = async () => {
    // console.log(customers);

    //data will be customers data
    try {
      const response = await getAllcustomers();
      const data = response.data.customers;
      let initialKeys = Object.keys(data[0]);
      if (!initialKeys.includes('feedback')) {
        initialKeys.push('feedback');
      }
      const headers = initialKeys.filter(row => !['__v', 'CustomerOfComapny', 'createdAt', 'updatedAt'].includes(row)); // keys array will be stored

      // Convert headers to CSV row
      const csvRows = [headers.join(",")]; // keystring

      // Convert data rows: N*N Time Complexity
      data.forEach((row) => {
        const values = headers.map((header) => {
          //for each keys
          let val = row[header];
          if (header && header === 'lastReminder' && row[header]) {

            //formatting date: 13 Feb 2026, 09:24 am

            val = new Date(row[header]).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true
            })
          }

          if (val && typeof val === 'object') {
            if (header === 'lastTransaction') {
              const txId = val._id || '';
              const amount = val.amount ? `${val.amount}` : '';
              const date = val.createdAt || val.date ? `(${formatDate(val.createdAt || val.date)})` : '';

              if (val.amount) {
                val = `${amount} ${date} ID:${txId}`;
              } else {
                val = `${txId}`;
              }
            } else if (header === 'paymentTerm') {
              val = val.name || ''; // have to add here id
            } else {
              val = JSON.stringify(val);
            }
          }

          val = val !== null && val !== undefined ? val : "";
          return `"${val}"`; // wrap values in quotes to avoid comma issues
        });
        csvRows.push(values.join(","));
      });

      // Convert rows to CSV format
      const csvString = csvRows.join("\n");

      // Create blob file
      const blob = new Blob([csvString], { type: "text/csv" });

      // Create link to download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const d = new Date();
      const fileName = `nodue-customerlist-${formatDate(d.toISOString().split("T")[0])}`;
      a.download = `${fileName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("successfully downloaded csv data");

    } catch (error) {
      console.log(error);

    }


  }

  const handleDownloadPdf = async () => {
    try {
      const response = await getAllcustomers();
      const data = response.data.customers;
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text("All Customers History", 14, 20);


      let initialKeys = Object.keys(data[0]);
      if (!initialKeys.includes('feedback')) {
        initialKeys.push('feedback');
      }
      const tableColumns = initialKeys.filter(row => !['_id', '__v', 'email', 'CustomerOfComapny', 'createdAt', 'updatedAt'].includes(row));// array of headers


      const tableRows = [];  //rows according to headers
      data.forEach((row) => {
        const values = tableColumns.map((header) => {

          let val = row[header];
          if (header && header === 'lastReminder' && row[header]) {
            //formatting date: 13 Feb 2026, 09:24 am

            val = new Date(row[header]).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true
            })
          }
          console.log("val", val);
          if (val && typeof val === 'object') {
            if (header === 'lastTransaction') {
              const txId = val._id || val.id || '';
              const amount = val.amount ? `${val.amount}` : '';
              const date = val.createdAt || val.date ? `(${formatDate(val.createdAt || val.date)})` : '';

              if (val.amount) {
                val = `${amount} ${date} ID:${txId}`;
              } else {
                val = `${txId}`; // only adding id
              }
            } else if (header === 'paymentTerm') {
              val = val.name || '';
            } else {
              val = JSON.stringify(val);
            }
          }
          return val; //taking only that is defined in filtered tableColumns above
        });

        tableRows.push(values);
      })

      const updatedColumns = tableColumns.map(hd => hd.charAt(0).toUpperCase() + hd.substring(1));

      const nameIndex = tableColumns.indexOf('name');
      const reminderIndex = tableColumns.indexOf('lastReminder');
      const mobileIndex = tableColumns.indexOf('mobile');

      // Generate table
      autoTable(doc, {
        head: [updatedColumns],
        body: tableRows,
        startY: 30,
        styles: { fontSize: 10 },
        headStyles: {
          fillColor: [123, 241, 168],
          textColor: [0, 0, 0],       // header text color
          fontStyle: "bold",
          halign: "left",
        },
        columnStyles: { // manually adding some space in that 
          [nameIndex]: { cellWidth: 30 },
          [reminderIndex]: { cellWidth: 25 },
          [mobileIndex]: { cellWidth: 28 }
        }
      });

      // Save the PDF // nodue-customerlist-date.pdf
      const d = new Date();
      const fileName = `nodue-customerlist-${formatDate(d.toISOString().split("T")[0])}`;
      doc.save(`${fileName}.pdf`);
      toast.success("successfully downloaded");

    } catch (error) {
      console.log(error);

    }


  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
      </div>
    );
  }


  return (
    <div className="hidden md:block rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden ">
      <div className=" ">
        {/* removed overflow-x-auto just for action button functionality */}
        <table className="w-full text-left text-sm ">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {TableHeaders.map((h, i) => (
                <th key={i} className="px-2 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap align-middle">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {customers.map((c, index) => (

              <tr key={c._id} className={`transition-all duration-300 overflow-hidden hover:bg-gray-50 ${deletedCustomerId === c._id ? "opacity-0 h-0" : "opacity-100 h-auto"}`}>
                <td className="px-2 py-4 font-medium text-gray-900 align-middle">{index + 1}</td>
                <td className="px-2 py-4 text-gray-700 align-middle">{c.name}</td>
                {/* <td className="px-6 py-4">

                  {c.email ? (<a href={`mailto:${c.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                    {c.email}
                  </a>) : "No email added"}
                </td> */}
                <td className="px-2 py-4 whitespace-nowrap text-gray-700 align-middle">{c.mobile}</td>
                <td className="px-2 py-4 font-medium text-gray-900">{currency(c.currentDue)}</td>
                {/* <td className="px-2 py-4 font-medium text-red-600">{currency(c.lastTransaction)}</td> */}
                <td className="px-2 py-4 whitespace-nowrap text-gray-700">{formatDate(c.lastReminder)}</td>
                {/* <td className="px-6 py-4 max-w-xs">
                        <span className="line-clamp-2 text-gray-700" title={c.feedback}>
                          {c.feedback || "-"}
                        </span>
                      </td> */}
                <td className="px-6 py-4 align-middle">
                  <StatusBadge value={c.status} />
                </td>
                {/* COMMITTED_THIS_WEEK => Committed This Week*/}
                <td className="px-2 py-4 whitespace-nowrap text-gray-700">
                  {c.lastTransaction?.commitmentStatus
                    ? c.lastTransaction.commitmentStatus.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
                    : "-"}
                </td>
                <td >
                  <ActionBadge onEdit={() => handleEditCustomer(c)} onDelete={() => handleDeleteCustomer(c._id)} onTransaction={() => handleAllTransactions(c)} />
                </td>
              </tr>
            ))}

            {customers.length === 0 && (
              <tr>
                <td colSpan={TableHeaders.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <img
                      className="w-48 h-48 object-contain opacity-60 mb-4"
                      src="https://img.freepik.com/premium-vector/no-data-concept-missing-files-no-search-results-found-system-data-available-illustration_939213-1763.jpg"
                      alt="No customers found"
                    />
                    <p className="text-gray-500 text-sm">No customers found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>


      </div>


      {/* Footer */}
      <div className="md:flex inline-flex md:flex-wrap items-center justify-between border-gray-200 bg-gray-50 px-2 md:px-2 py-3 text-sm text-gray-700 gap-3">

        <span>Total: <strong className="font-semibold text-gray-900">{totalCustomers}</strong> customers</span>


        <div className="md:flex items-center md:justify-center justify-end gap-3 p-4   bg-gray-50">

          {/* Pagination */}
          {/* Previous Button */}
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className={`px-4 py-2 rounded-lg border ${page === 1 ? "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200" : "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
              }`}
          >
            Previous
          </button>

          {/* Page Numbers */}
          <span className="text-gray-700 text-sm">
            Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong>
          </span>

          {/* Next Button */}
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className={`px-4 py-2 rounded-lg border ${page === totalPages ? "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200" : "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
              }`}
          >
            Next
          </button>

        </div>
        <div className="flex gap-2">
          <button onClick={handleDownloadCsv} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 hover:cursor-pointer">
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button onClick={handleDownloadPdf} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 hover:cursor-pointer">
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {showEditMOdal && <div ref={editRef}>
        <EditCustomerModal customer={currentCustomer} setEditCustomer={setCurrentCustomer} handleClose={() => setShowEditModal(false)} handleEditSubmit={handleEditSubmit} />
      </div>}
      {/* confirmation dialogue */}
      {confirmOpen &&
        <ConfirmModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          message="Are you sure you want to delete this customer?"
        />
      }
      {showTransactionModal &&
        <div ref={transactionRef}>
          <TransactionHistoryModal
            //i have to send the id for which customer i'm going to fetch the transaction history
            customer={currentCustomer}
            setCurrentCustomer={setCurrentCustomer}
            setCustomers={setCustomers} // to update on the UI, no extra call at time
            transactions={transactions}
            setTransactions={setTransactions}
            handleClose={handleCloseTransaction}
          />
        </div>
      }
    </div>
  )
}

export default CustomerTable