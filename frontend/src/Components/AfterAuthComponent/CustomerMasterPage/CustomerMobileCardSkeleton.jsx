import React from "react";

const CustomerMobileCardSkeleton = () => {
  // Array to map 5 skeleton cards
  const skeletonCards = Array(5).fill(0);

  return (
    <div className="md:hidden space-y-4 animate-pulse">
      {skeletonCards.map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden"
        >
          <div className="p-4 space-y-3">
            {/* Header: Name, Company, Status */}
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
            </div>

            {/* Content Lines */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Mobile Footer Skeleton */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 mt-4">
        <div className="flex flex-col gap-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="flex gap-2">
            <div className="flex-1 h-9 bg-gray-200 rounded-md"></div>
            <div className="flex-1 h-9 bg-gray-200 rounded-md"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerMobileCardSkeleton;
