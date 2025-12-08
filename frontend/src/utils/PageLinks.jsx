// utils/PageLinks.jsx
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Hero from "../Pages/Hero";
import Contact from "../Pages/Contact";
import PageShell from "./PageChangeAnimation";
import BeforeAuthLayout from "../Layouts/BeforeAuthLayout";
import AfterAuthLayout from "../Layouts/AfterAuthLayout";
import { useState } from "react";
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
import ProtectedRoute from "../context/ProtectedRoute.jsx"
import LoginComponent from "../Components/auth/LoginComponent.jsx"

const PageLinks = () => {
  const location = useLocation();
  const keyId = location.pathname;
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Routes location={location} key={keyId}>
      {/* PUBLIC AREA */}
      <Route element={<BeforeAuthLayout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />}>
        {/* If logged in and at "/", redirect to first app page */}
        <Route
          path="/"
          element={
            isLoggedIn
              ? <Navigate to="/nodue/customer-master" replace />
              : <Hero />
          }
        />
        <Route path="/contact" element={<PageShell keyId={keyId}><Contact /></PageShell>} />
        <Route path="/login" element={<Navigate to="/" state={{openLogin: true}} replace />} />
      </Route>

      {/* AUTH AREA */}
      <Route
        path="/nodue"
        element={<ProtectedRoute> <AfterAuthLayout setIsLoggedIn={setIsLoggedIn} isLoggedIn={isLoggedIn} /></ProtectedRoute>}
      >
        {/* If user hits /nodue, land on first active page */}
        <Route index element={<Navigate to="customer-master" replace />} />

        <Route path="dashboard" element={<AfterAuthLanding />} />
        <Route path="customer-master" element={<CustomerMaster />} />
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
