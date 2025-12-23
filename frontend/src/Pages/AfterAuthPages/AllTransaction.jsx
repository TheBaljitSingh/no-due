import React from "react";

export default function AllTransaction() {
  const data = [
    {
      party: "ABC Corporation",
      totalDue: 3000,
      rows: [
        {
          date: "01-12-2025",
          refNo: "-",
          pending: 1000,
          dueOn: "15-12-2025",
          overdue: 20,
        },
        {
          date: "10-12-2025",
          refNo: "-",
          pending: 500,
          dueOn: "25-12-2025",
          overdue: 20,
        },
        {
          date: "15-12-2025",
          refNo: "-",
          pending: 1500,
          dueOn: "30-12-2025",
          overdue: 20,
        },
      ],
    },
    {
      party: "XYZ Corporation",
      totalDue: 1500,
      rows: [
        {
          date: "05-12-2025",
          refNo: "-",
          pending: 500,
          dueOn: "25-12-2025",
          overdue: 20,
        },
        {
          date: "15-12-2025",
          refNo: "-",
          pending: 1000,
          dueOn: "30-12-2025",
          overdue: 20,
        },
      ],
    },
  ];

  return (
    <div className="overflow-x-auto p-4">
      <table className="w-full border border-gray-300 text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">Date</th>
            <th className="border p-2">Ref. No.</th>
            <th className="border p-2">Party's Name</th>
            <th className="border p-2 text-right">Pending Amount</th>
            <th className="border p-2">Due on</th>
            <th className="border p-2">Overdue by days</th>
            <th className="border p-2 bg-yellow-300">Total Due</th>
          </tr>
        </thead>

        <tbody>
          {data.map((party, partyIndex) =>
            party.rows.map((row, rowIndex) => (
              <tr key={`${partyIndex}-${rowIndex}`}>
                <td className="border p-2">{row.date}</td>
                <td className="border p-2">{row.refNo}</td>

                {rowIndex === 0 && (
                  <td
                    className="border p-2 font-medium"
                    rowSpan={party.rows.length}
                  >
                    {party.party}
                  </td>
                )}

                <td className="border p-2 text-right">{row.pending}</td>
                <td className="border p-2">{row.dueOn}</td>
                <td className="border p-2 text-center">{row.overdue}</td>

                {rowIndex === 0 && (
                  <td
                    className="border p-2 bg-yellow-300 font-semibold text-center"
                    rowSpan={party.rows.length}
                  >
                    {party.totalDue}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
