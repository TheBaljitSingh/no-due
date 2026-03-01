import React from "react";
import { TableHeaders } from "../../../utils/constants.js";

const CustomerTableSkeleton = () => {
  // Array to map 5 skeleton rows
  const skeletonRows = Array(5).fill(0);

  return (
    <div className="hidden md:block rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden animate-pulse">
      <div className="h-full">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {TableHeaders.map((h, i) => (
                <th
                  key={i}
                  className="px-2 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap align-middle"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {skeletonRows.map((_, index) => (
              <tr key={index} className="transition-all duration-300">
                {/* S.No */}
                <td className="px-2 py-4 align-middle">
                  <div className="h-4 bg-gray-200 rounded w-4"></div>
                </td>
                {/* Name */}
                <td className="px-2 py-4 align-middle">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </td>
                {/* Mobile */}
                <td className="px-2 py-4 align-middle">
                  <div className="h-4 bg-gray-200 rounded w-28"></div>
                </td>
                {/* Current Due */}
                <td className="px-2 py-4 align-middle">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </td>
                {/* Last Reminder */}
                <td className="px-2 py-4 align-middle">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </td>
                {/* Status */}
                <td className="px-6 py-4 align-middle">
                  <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                </td>
                {/* Feedback */}
                <td className="px-2 py-4 align-middle">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </td>
                {/* Actions */}
                <td className="px-2 py-4 align-middle">
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Skeleton */}
      <div className="md:flex inline-flex md:flex-wrap items-center justify-between border-gray-200 bg-gray-50 px-2 md:px-2 py-3 gap-3">
        <div className="h-4 bg-gray-200 rounded w-32"></div>

        <div className="md:flex items-center md:justify-center justify-end gap-3 p-4 bg-gray-50">
          <div className="h-9 bg-gray-200 rounded-lg w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-9 bg-gray-200 rounded-lg w-24"></div>
        </div>

        <div className="flex gap-2">
          <div className="h-9 bg-gray-200 rounded-lg w-20"></div>
          <div className="h-9 bg-gray-200 rounded-lg w-20"></div>
        </div>
      </div>
    </div>
  );
};

export default CustomerTableSkeleton;
