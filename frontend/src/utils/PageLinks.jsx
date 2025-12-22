// utils/PageLinks.jsx
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Contact from "../Pages/Contact";
import PageShell from "./PageChangeAnimation";
import BeforeAuthLayout from "../Layouts/BeforeAuthLayout";
import AfterAuthLayout from "../Layouts/AfterAuthLayout";
import { useEffect, useState } from "react";
import AfterAuthLanding from "../Pages/AfterAuthPages/AfterAuthLanding";
import CustomerMaster from "../Pages/AfterAuthPages/CustomerMaster";
import UploadCenter from "../Pages/AfterAuthPages/UploadCenter";
import ReminderManagement from "../Pages/AfterAuthPages/ReminderManagement";
import ReminderHistory from "../Pages/AfterAuthPages/ReminderHistory";
import UserProfile from "../Pages/AfterAuthPages/UserProfile";
import SubcriptionPage from "../Pages/AfterAuthCTCPages/SubcriptionPage";
import Documentation from "../Pages/AfterAuthCTCPages/Documentation";
import HelpPage from "../Pages/AfterAuthCTCPages/HelpPage";
import Error404Page from "../Pages/Error404Page";
import CustomerCreationPage from "../Pages/AfterAuthPages/CustomerCreationPage";
import { checkAuth } from "./service/authService";
import LoadingPage from "../Components/AfterAuthComponent/ReminderHistoryPage/LoadingPage";
import Hero from "../Pages/Hero";
import AuthSuccess from "../Components/auth/AuthSuccess";
import AuthRoute from "../Layouts/AuthRoutes";
import { useAuth } from "../context/AuthContext";
import CustomerDetail from "../Pages/CustomerDetail";


const PageLinks = () => {
  const location = useLocation();
  const keyId = location.pathname;

  const {loading} = useAuth();


  if(loading){
    return(
      <>
      <LoadingPage />
      </>
    )
  };

  return (
    <Routes location={location} key={keyId}>
      {/* PUBLIC AREA */}
      <Route element={<BeforeAuthLayout/>}>
        <Route path ='/' element = {<Hero/>} />
        <Route path="/contact" element={<PageShell keyId={keyId}><Contact /></PageShell>} />
        <Route path="/login" element={<Navigate to="/" state={{openLogin: true}} replace />} />
      </Route>
      
      <Route path='/google-success' element={<AuthSuccess />} />


      {/* AUTH AREA */}
      <Route
        path="/nodue"
        element={
          //authRoute works as privateRoute
          <AuthRoute> 
        <AfterAuthLayout />
        </AuthRoute>
      }
      >
        {/* If user hits /nodue, land on first active page */}
        <Route index element={<Navigate to="customer-master" replace />} />

        <Route path="dashboard" element={<AfterAuthLanding />} />
        <Route path="customer-master" element={<CustomerMaster />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="upload-center" element={<UploadCenter />} />
        <Route path="reminder-management" element={<ReminderManagement />} />
        <Route path="reminder-history" element={<ReminderHistory />} />
        <Route path="user-profile" element={<UserProfile />} />
        <Route path="subscriptions" element={<SubcriptionPage />} />
        <Route path="documentaion" element={<Documentation />} />
        <Route path="help" element={<HelpPage />} />
        <Route path='customer-creation' element={<CustomerCreationPage/>}/>
      </Route>

      <Route path="*" element={<Error404Page />} />
    </Routes>
  );
};

export default PageLinks;
