import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import "flowbite";
import { Toaster } from "react-hot-toast";
// import { ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>

    <Toaster
      position="top-right"
      autoClose={3000}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
    {/* <Toaster
      containerId="stackbar"
      position="bottom-right"
      newestOnTop
      draggable
      pauseOnHover
      theme="light"
      pauseOnFocusLoss
      autoClose={3000}
      closeButton={false}
      hideProgressBar
      stacked
      toastStyle={{
        borderRadius: "10px",
        minWidth: "320px",
      }}
    /> */}
  </StrictMode>,
);
