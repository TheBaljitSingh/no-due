import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import "flowbite";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>

    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
    <ToastContainer
      containerId="stackbar"
      position="bottom-right"
      newestOnTop
      draggable
      pauseOnHover
      theme='light'
      pauseOnFocusLoss
      autoClose={3000}
      closeButton={false}
      hideProgressBar
      stacked
      toastStyle={{
        borderRadius: "10px",
        minWidth: "320px"
      }}
    />
  </StrictMode>,
)
