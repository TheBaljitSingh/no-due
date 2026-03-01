import React, { useState, useEffect, useCallback } from "react";
import PageHeaders from "../../../utils/AfterAuthUtils/PageHeaders";
import CustomerTable from "../../../Components/AfterAuthComponent/CustomerMasterPage/CustomerTable";
import CustomerMobileCard from "../../../Components/AfterAuthComponent/CustomerMasterPage/CustomerMobileCard";
import { Search, Users, TrendingUp, Clock } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
    <div
      className={`flex items-center justify-center w-9 h-9 rounded-lg ${accent}`}
    >
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-base font-semibold text-gray-900 leading-tight">
        {value ?? "—"}
      </p>
    </div>
  </div>
);

const CustomerMaster = () => {
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [stats, setStats] = useState({
    total: null,
    highDue: null,
    lastUpdated: null,
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleStatsReady = useCallback((data) => {
    setStats(data);
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeaders
        header="Customer Master"
        subheader="All customers with dues, reminders, and their status."
        navigate="../upload-center"
        navigateName="Add Customer"
      />

      {/* Stats bar */}
      {/* <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          icon={Users}
          label="Total Customers"
          value={stats.total !== null ? stats.total.toLocaleString() : "—"}
          accent="bg-green-500"
        />
        <StatCard
          icon={TrendingUp}
          label="With Dues"
          value={stats.highDue !== null ? stats.highDue.toLocaleString() : "—"}
          accent="bg-red-400"
        />
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            icon={Clock}
            label="Last Refreshed"
            value={stats.lastUpdated ?? "—"}
            accent="bg-gray-400"
          />
        </div>
      </div> */}

      {/* Search Bar */}
      <div className="w-full max-w-md px-4 md:px-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="
              block w-full pl-10 pr-4 py-2.5
              border border-gray-200 rounded-xl
              bg-white placeholder-gray-400 text-sm text-gray-900
              shadow-sm
              focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400
              transition-all duration-150
            "
            placeholder="Search by name or mobile…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {isMobile ? (
        <CustomerMobileCard search={search} onStatsReady={handleStatsReady} />
      ) : (
        <CustomerTable search={search} onStatsReady={handleStatsReady} />
      )}
    </div>
  );
};

export default CustomerMaster;
