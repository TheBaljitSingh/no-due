import React from "react";
import { seedCustomers, TableHeaders } from "../../utils/constants";
import PageHeaders from "../../utils/AfterAuthUtils/PageHeaders";
import CustomerTable from "../../Components/AfterAuthComponent/CustomerMasterPage/CustomerTable";
import CustomerMobileCard from "../../Components/AfterAuthComponent/CustomerMasterPage/CustomerMobileCard";
import logger from "../../utils/logger.js";


const CustomerMaster = () => {
  return (
    <div >
      {/* Header */}
     <PageHeaders 
      header={'Customer Master'} 
      subheader={'All customers with dues, reminders, and their status.'} 
      handleOnClick={() => logger.log("clicked from customer master")} 
      buttonName={'Upload CSV/XLSX'} 
      navigate={"../upload-center"} 
      navigateName={"Add Customer"}
     />

      {/* Desktop Table */}
      <CustomerTable TableHeaders={TableHeaders} seedCustomers={seedCustomers}/>

      {/* Mobile Cards */}
      <CustomerMobileCard seedCustomers={seedCustomers}/>
    </div>
  );
};

export default CustomerMaster;