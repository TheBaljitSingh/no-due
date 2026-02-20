import React, { useState, useEffect } from "react";
import PageHeaders from "../../utils/AfterAuthUtils/PageHeaders";
import CustomerTable from "../../Components/AfterAuthComponent/CustomerMasterPage/CustomerTable";
import CustomerMobileCard from "../../Components/AfterAuthComponent/CustomerMasterPage/CustomerMobileCard";
import { Search } from "lucide-react";


const CustomerMaster = () => {
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeaders
        header={'Customer Master'}
        subheader={'All customers with dues, reminders, and their status.'}
        navigate={"../upload-center"}
        navigateName={"Add Customer"}
      />

      {/* Search Bar */}
      <div className="max-w-md px-4 md:px-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm shadow-sm transition-all"
            placeholder="Search by name or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Render only one based on screen size to avoid double API calls */}
      {isMobile ? (
        <CustomerMobileCard search={search} />
      ) : (
        <CustomerTable search={search} />
      )}
    </div>
  );
};

export default CustomerMaster;