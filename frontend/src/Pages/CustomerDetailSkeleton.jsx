import React from "react";

export default function CustomerDetailSkeleton() {
  return (
    <div className="p-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-4">
        <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>

      {/* Due and Buttons Skeleton */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 bg-gray-200 rounded w-24"></div>
          <div className="h-6 bg-gray-200 rounded w-32 font-bold"></div>
        </div>

        <div className="mt-3 flex space-x-2">
          <div className="h-8 w-24 bg-gray-300 rounded"></div>
          <div className="h-8 w-36 bg-gray-300 rounded"></div>
          <div className="h-8 w-24 bg-gray-300 rounded"></div>
        </div>
      </div>

      {/* Transactions Table Skeleton */}
      <section className="mt-6 border rounded-lg overflow-hidden bg-white">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4 mx-4 mt-4"></div>
        <table className="min-w-full">
          <thead className="bg-gray-50 border-y">
            <tr className="text-left">
              <th className="p-3">
                <div className="h-4 bg-gray-300 rounded w-16"></div>
              </th>
              <th className="p-3">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
              </th>
              <th className="p-3">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
              </th>
              <th className="p-3">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
              </th>
              <th className="p-3">
                <div className="h-4 bg-gray-300 rounded w-32"></div>
              </th>
              <th className="p-3">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <tr key={i}>
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded w-40"></div>
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
