import React, { useEffect, useRef, useState } from "react";
import { useNavigate} from "react-router-dom";
import { registerUser } from "../../utils/service/userService";
import logger from "../../utils/logger.js"

export default function AuthModal({ open, onClose, onSubmit , setIsLoggedIn }) {
  const dialogRef = useRef(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [businessName , setBuisnessName] = useState("")
  const [phoneNumber , setPhoneNumber] = useState("");
  const [lastName, setLastName] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [err, setErr] = useState("");
 

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    const first = dialogRef.current?.querySelector("input");
    first?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const resetForm = () => {
    setEmail("");
    setFirstName("");
    setBuisnessName("");
    setPhoneNumber("");
    setLastName("");
    setPw("");
    setConfirmPw("");
    setErr("");
    setShowPw(false);
    setShowConfirmPw(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  const navigate = useNavigate();

  const submit = (e) => {
    e?.preventDefault?.();
    setErr("");

    if (!email.trim() || !pw.trim()) {
      setErr("Please fill in all required fields.");
      return;
    }

    if (isSignUp) {
      if (!firstName.trim() || !lastName.trim()) {
        setErr("Please enter your first and last name.");
        return;
      }
      if (pw !== confirmPw) {
        setErr("Passwords don't match.");
        return;
      }
      if (pw.length < 8) {
        setErr("Password must be at least 8 characters.");
        return;
      }

      

      onSubmit?.({ 
        type: 'signup',
        email: email.trim(), 
        firstName: firstName.trim(),
        phoneNumber: phoneNumber.trim(),
        businessName: businessName.trim(),
        lastName: lastName.trim(),
        password: pw 
      });
    } else {
      onSubmit?.({ 
        type: 'login',
        email: email.trim(), 
        password: pw 
      });

      

      // setTimeout(() => {
      //   setIsLoggedIn(true)
      //   navigate('/nodue/customer-master') // text navigation
       
      // }, 1000)
    }

    //wait for the server response then respone according to it
  };

  if (!open) return null;

  return (
    <div
      className="fixed min-h-screen inset-0 z-50 grid place-items-center"
      aria-modal="true"
      role="dialog"
      onMouseDown={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-md rounded-lg bg-white p-8 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Logo Area */}
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full">
            <img src="/src/assets/logo.png" alt="" />
          </div>
          <h2 className="text-2xl font-normal text-gray-800">
            {isSignUp ? "Create your Account" : "Sign in"}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {isSignUp ? "to continue to our service" : "to continue to your account"}
          </p>
        </div>

        <div className="space-y-4">
          {isSignUp && (
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onKeyDown={(e) => {
                if (e.key === 'Enter') submit(e);
              }}
              className="w-full rounded border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  placeholder="First name"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  placeholder="Last name"
                />
              </div>

              
              
            </div>
          )}
          {
            isSignUp && (
                <>
                    <div>
                        <input
                            type="text"
                            value={businessName}
                            onChange={(e) => setBuisnessName(e.target.value)}
                            className="w-full rounded border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                            placeholder="Business Name"
                        />
                    </div>

                    <div>
                        <input
                            type="text"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full rounded border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                            placeholder="Phone Number"
                        />
                    </div>

                   
                </>
            )
          }

            <div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                        placeholder="Email"
                    />
            </div>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full rounded border border-gray-300 px-4 py-3 pr-16 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              placeholder="Password"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-teal-600 hover:underline"
            >
              {showPw ? "HIDE" : "SHOW"}
            </button>
          </div>

          {isSignUp && (
            <div className="relative">
              <input
                type={showConfirmPw ? "text" : "password"}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="w-full rounded border border-gray-300 px-4 py-3 pr-16 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                placeholder="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-teal-600 hover:underline"
              >
                {showConfirmPw ? "HIDE" : "SHOW"}
              </button>
            </div>
          )}

          {!isSignUp && (
            <div className="text-right">
              <a href="#" className="text-sm font-medium text-teal-600 hover:underline">
                Forgot password?
              </a>
            </div>
          )}

          {err && (
            <div className="rounded bg-red-50 px-3 py-2">
              <p className="text-sm text-red-600">{err}</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-4">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm font-medium text-teal-600 hover:underline"
            >
              {isSignUp ? "Sign in instead" : "Create account"}
            </button>
            
            <button
              onClick={submit}
              className="rounded bg-teal-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition"
            >
              {isSignUp ? "Sign up" : "Next"}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Demo wrapper
function Demo() {
  const [open, setOpen] = useState(true);
  
  const handleSubmit = async(data) => {
    logger.log('Form submitted:', data);

    if(data.type=="signup"){
      logger.log("signup is begin called");
      // const response = register(data);
      logger.log(response);
    }else{
      logger.log("sign in");
      //login
    }

    
    // alert(`${data.type === 'signup' ? 'Sign up' : 'Login'} successful!\n\nEmail: ${data.email}`);
    // setOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-3xl font-bold text-gray-800">Google-Style Auth Modal Demo</h1>
        <p className="mb-6 text-gray-600">Click the button below to open the authentication modal</p>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white shadow-lg hover:bg-teal-700"
        >
          Open Auth Modal
        </button>
      </div>
      
      <AuthModal 
        open={open} 
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}