import React, { useState, useEffect, useCallback } from "react";
import PageHeaders from "../../../utils/AfterAuthUtils/PageHeaders";
import CustomerTable from "../../../Components/AfterAuthComponent/CustomerMasterPage/CustomerTable";
import CustomerMobileCard from "../../../Components/AfterAuthComponent/CustomerMasterPage/CustomerMobileCard";
import { Search, Trash2, Save, X } from "lucide-react";
import { deleteCustomers, updateCustomersBatch } from "../../../utils/service/customerService";
import toast from "react-hot-toast";
import ConfirmModal from "../../../Components/AfterAuthComponent/CustomerMasterPage/ConfirmModal";

const CustomerMaster = () => {
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [stats, setStats] = useState({
    total: null,
    highDue: null,
    lastUpdated: null,
  });
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [refreshTable, setRefreshTable] = useState(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleStatsReady = useCallback((data) => {
    setStats(data);
  }, []);

  const handleDeleteSelected = async () => {
    const ids = selectedCustomers.map((c) => c._id);
    try {
      await toast.promise(deleteCustomers(ids), {
        loading: "Deleting selected customers...",
        success: "Deleted successfully",
        error: "Failed to delete",
      });
      setSelectedCustomers([]);
      setRefreshTable(prev => prev + 1);
    } catch (error) {
      console.error(error);
    }
    setConfirmOpen(false);
  };

  const handleSaveSelected = async () => {
    try {
      // Validate that all selected have name and mobile
      const invalid = selectedCustomers.find(c => !c.name || !c.mobile);
      if (invalid) {
        toast.error(`Please provide name and mobile for all selected customers`);
        return;
      }

      await toast.promise(updateCustomersBatch(selectedCustomers), {
        loading: "Saving changes...",
        success: "Updated successfully",
        error: "Failed to save changes",
      });
      setSelectedCustomers([]);
      setRefreshTable(prev => prev + 1);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeaders
        header="Customer Master"
        subheader="All customers with dues, reminders, and their status."
        navigate="../upload-center"
        navigateName="Add Customer"
      />

      {/* Toolbar: Search + Bulk Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="
              w-full pl-8 border shadow-accertinity inline px-2 py-1.5 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 
                         focus:border-gray-300 focus:bg-gray-100 border-transparent 
                         transition-all duration-200 outline-none
              "
              placeholder="Search by name or mobile…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {selectedCustomers.length > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
            <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
              {selectedCustomers.length} Selected
            </span>

            <button
              onClick={handleSaveSelected}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-all shadow-sm font-medium cursor-pointer text-sm"
            >
              <Save size={16} />
              Save {selectedCustomers.length > 1 ? "All" : "Changes"}
            </button>

            <button
              onClick={() => setConfirmOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100 font-medium cursor-pointer text-sm"
            >
              <Trash2 size={16} />
              Delete {selectedCustomers.length > 1 ? "Selected" : ""}
            </button>

            <button
              onClick={() => setSelectedCustomers([])}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Cancel / Clear selection"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-2 text-red-500">
        {selectedCustomers.length > 0 && (
          <p className="text-xs font-medium mb-3 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Editing mode active: Modify details directly in the table below.
          </p>
        )}
        {isMobile ? (
          <CustomerMobileCard search={search} onStatsReady={handleStatsReady} />
        ) : (
          <CustomerTable
            search={search}
            onStatsReady={handleStatsReady}
            selectedCustomers={selectedCustomers}
            setSelectedCustomers={setSelectedCustomers}
            key={refreshTable}
          />
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteSelected}
        message={`Are you sure you want to delete ${selectedCustomers.length} customer${selectedCustomers.length > 1 ? "s" : ""}?`}
      />
    </div>
  );
};

export default CustomerMaster;
