import React, { useEffect, useState, useCallback } from 'react';
import PageHeaders from '../../utils/AfterAuthUtils/PageHeaders';
// import { CustomerNames } from '../../utils/constants';
import CustomerDetailCard from '../../Components/AfterAuthComponent/ReminderHistoryPage/CustomerDetailCard';
import MobileCustomerDetailCard from '../../Components/AfterAuthComponent/ReminderHistoryPage/MobileCustomerDetailCard';
import LeftSide from '../../Components/AfterAuthComponent/ReminderHistoryPage/DetailedView/LeftSide';
import RightSide from '../../Components/AfterAuthComponent/ReminderHistoryPage/DetailedView/RightSide';
import NoDataFallbackPage from '../../Components/AfterAuthComponent/ReminderHistoryPage/NoDataFallbackPage';
import LoadingPage from '../../Components/AfterAuthComponent/ReminderHistoryPage/LoadingPage';
import { getAllcustomers } from "../../utils/service/customerService"
import { getCustomerReminder } from "../../utils/service/reminderService"

const ReminderHistory = () => {
  const [loading, setLoading] = useState(true);
  const [detailedView, setDetailedView] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);

  const [rotateDeg, setRotateDeg] = useState(6);
  const [direction, setDirection] = useState(-1);

  useEffect(() => {
    const interval = setTimeout(() => {
      setRotateDeg((prev) => prev + direction * 6);
      setDirection((prev) => -prev);
    }, 500);

    return () => clearTimeout(interval);
  }, [direction]);

  useEffect(() => {

    async function fetchCustoemr() {
      try {
        const response = await getAllcustomers();
        setCustomers(response.data.customers)

      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }

    fetchCustoemr();

  }, []);

  const imgFor = useCallback((c) =>
    c.gender === 'male'
      ? 'https://img.freepik.com/free-vector/smiling-man-with-glasses_1308-174409.jpg'
      : 'https://img.freepik.com/free-vector/smiling-woman-with-long-brown-hair_1308-175662.jpg', []);

  const handleSelectCustomer = useCallback(async (customer) => {
    const customerId = customer._id;
    // append the reminder details in the customer data

    // Only proceed if selecting a new customer or if we don't have details yet
    if (selectedCustomer?._id === customerId) return;

    setSelectedCustomer(customer);

    // Use a flag or check if we already have history to avoid re-fetching if not needed? 
    // For now, always fetch to get latest status.
    const response = await getCustomerReminder(customerId);
    setSelectedCustomer(prev => {
      if (!prev || prev._id !== customerId) return prev; // ignore stale response

      return {
        ...prev,
        summary: response?.data?.summary?.[0] || {},
        history: response?.data?.history || []
      };
    });
  }, [selectedCustomer]);

  const openDetails = useCallback((customer) => {
    setSelectedCustomer(customer);
    setDetailedView(true);
    handleSelectCustomer(customer);
  }, [handleSelectCustomer]);


  if (loading) {
    return (
      <LoadingPage />
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <NoDataFallbackPage rotateDeg={rotateDeg} />
    );
  }



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex-shrink-0">
        <PageHeaders
          header={'Reminder History'}
          subheader={'Track all your past reminders in one place'}
        />
      </div>

      {/* DESKTOP / TABLET */}
      {detailedView ? (
        <div className="hidden md:grid gap-6 mt-6 md:grid-cols-[380px_1fr] items-start">
          {/* LEFT: LIST */}
          <LeftSide
            CustomerNames={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={handleSelectCustomer}
            imgFor={imgFor}
          />

          {/* RIGHT: DETAIL */}
          <RightSide
            setDetailedView={setDetailedView}
            setSelectedCustomer={setSelectedCustomer}
            imgFor={imgFor}
            //here i have to pass the selectedcustomer reminder details using an api
            selectedCustomer={selectedCustomer}
          />
        </div>
      ) : (
        // CARD GRID FOR LAPTOP
        <div className="mt-6 overflow-y-auto flex-1">
          <CustomerDetailCard
            CustomerNames={customers}
            imgFor={imgFor}
            openDetails={openDetails}
          />
        </div>
      )}

      {/* MOBILE VIEW */}
      {/* MOBILE VIEW */}
      <div className="md:hidden flex-1 overflow-y-auto mt-6">
        <MobileCustomerDetailCard
          CustomerNames={customers}
          imgFor={imgFor}
          openDetails={openDetails}
          setDetailedView={setDetailedView}
          setSelectedCustomer={setSelectedCustomer}
          selectedCustomer={selectedCustomer}
          detailedView={detailedView}
        />
      </div>

    </div>
  );
};

export default ReminderHistory;