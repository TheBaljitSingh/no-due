import React, { useState, useEffect } from 'react'
import { currency, formatDate, StatusBadge } from '../../../utils/AfterAuthUtils/Helpers'
import { getAllcustomers, getCustomers } from '../../../utils/service/customerService';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from 'react-toastify';

const CustomerMobileCard = () => {


  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCustomers, setTotalCustomers] = useState();


  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await getCustomers({ page, limit });
        console.log(customers);
        setCustomers(data.data.customers);
        setTotalCustomers(data.data.total);

      } catch (error) {
        console.log(error);
      }
    };

    fetchCustomers();

  }, [page, limit]);


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
          let val = row[header] !== null && row[header] !== undefined ? row[header] : "";
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
          return row[header]; //taking only that is defined in filtered tableColumns above
        });

        tableRows.push(values);
      })

      const updatedColumns = tableColumns.map(hd => hd.charAt(0).toUpperCase() + hd.substring(1));


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

  return (
    <div className="md:hidden space-y-4">
      {customers.map((c) => (
        <div key={c._id} className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 truncate">{c.name}</h3>
                <p className="text-sm text-gray-600 truncate">{c.company}</p>
              </div>
              <StatusBadge value={c.status} />
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <span className="font-medium text-gray-900">{c._id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due:</span>
                <span className="font-semibold text-gray-900">{currency(c.due)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Overdue:</span>
                <span className="font-semibold text-red-600">{currency(c.overdue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Email:</span>
                <a href={`mailto:${c.email}`} className="text-green-600 hover:text-green-800 truncate max-w-[60%] text-right">
                  {c.email}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mobile:</span>
                <span className="text-gray-900">{c.mobile}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Reminder:</span>
                <span className="text-gray-900">{formatDate(c.lastReminder)}</span>
              </div>
              {c.feedback && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-600 text-xs">Feedback:</span>
                  <p className="text-gray-700 mt-1 line-clamp-2">{c.feedback}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {customers.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-12 text-center text-gray-500">
          No customers found.
          <img className="mx-auto" src="https://img.freepik.com/premium-vector/file-folder-mascot-character-design-vector_166742-4371.jpg" alt="" />

        </div>
      )}

      {/* Mobile Footer */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
        <div className="flex flex-col gap-3">
          <div className="text-sm text-gray-700">
            Total: <strong className="font-semibold text-gray-900">{totalCustomers}</strong> customers
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownloadCsv} className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Export CSV</button>
            <button onClick={handleDownloadPdf} className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Export PDF</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerMobileCard
