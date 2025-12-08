import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../utils/service/userService";
import { googleLogin, loginUser } from "../../utils/service/authService";
import LoadingSkeleton from "../../utils/LoadingSkeleton";

export default function LoginModal({ open, onClose, setIsLoggedIn }) {
  const dialogRef = useRef(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const navigate = useNavigate();

  // Form fields
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [lastName, setLastName] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");


  const [err, setErr] = useState({});
  const [Loading,setLoading]=useState(false);

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
    setBusinessName("");
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

  const validateField = (field, value, pw = "", confirmPw = "") => {
    value = value?.trim();

    switch (field) {
      // FIRST NAME
      case "firstName":
        if (!value) return "First name is required.";
        if (value.length < 2) return "First name must be at least 2 characters.";
        if (!/^[a-zA-Z]+$/.test(value))
          return "First name should contain only letters.";
        return "";

      // LAST NAME
      case "lastName":
        if (!value) return "Last name is required.";
        if (value.length < 2) return "Last name must be at least 2 characters.";
        if (!/^[a-zA-Z]+$/.test(value))
          return "Last name should contain only letters.";
        return "";

      // BUSINESS NAME
      case "businessName":
        if (!value) return "Business name is required.";
        if (value.length < 3)
          return "Business name must be at least 3 characters.";
        if (value.length > 70)
          return "Business name can be at most 70 characters.";
        return "";

      // EMAIL
      case "email":
        if (!value) return "Email is required.";
        if (
          !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
        )
          return "Please enter a valid email address.";
        return "";

      // PASSWORD
      case "password":
        if (!value) return "Password is required.";
        if (
          !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(value)
        )
          return "Password must have 8+ chars, 1 uppercase, 1 lowercase, 1 number & 1 symbol.";
        return "";

      // CONFIRM PASSWORD
      case "confirmPw":
        if (value !== pw) return "Passwords do not match.";
        return "";

      // PHONE
      case "phoneNumber":
        if (!value) return ""; // optional
        if (!/^(\+\d{1,3}[- ]?)?\d{10}$/.test(value))
          return "Please enter a valid phone number.";
        return "";

      default:
        return "";
    }
  };

  const submit = async (e) => {
    setLoading(true);
    e.preventDefault();

    const newErrors = {
      firstName: isSignUp ? validateField("firstName", firstName) : "",
      lastName: isSignUp ? validateField("lastName", lastName) : "",
      businessName: isSignUp ? validateField("businessName", businessName) : "",
      phoneNumber: isSignUp ? validateField("phoneNumber", phoneNumber) : "",
      email: validateField("email", email),
      password: validateField("password", pw),
      confirmPw: isSignUp ? validateField("confirmPw", confirmPw, pw) : "",
    };

    setErr(newErrors);

    if (Object.values(newErrors).some((err) => err)) {
      setLoading(false);
      return; // Stop submit
    }

    if (!email.trim() || !pw.trim()) {
      setLoading(false);
      // setErr("Please fill in all required fields.");
      return;
    }

    try {
      if (isSignUp) {
        const response = await registerUser({
          email: email.trim(),
          fname: firstName.trim(),
          phoneNumber: phoneNumber.trim(),
          businessName: businessName.trim(),
          lname: lastName.trim(),
          password: pw
        });
        console.log("User registered successfully:", response);
        if (response.status === 201) {
          setIsSignUp(false);
          resetForm();
          alert("Registration successful! Please log in.");
        }
      }
      else {

        const response = await loginUser({
          email: email.trim(),
          password: pw
        });
        console.log("User logged in successfully:", response);
        if (response.status === 200) {
          setIsLoggedIn(true);
          //have to set the user context here
          onClose();
          navigate('/customer-master');


        }
      }
    } catch (err) {
      console.error("Error during form submission:", err);
      setErr(err.response?.data?.errors[0] || "An error occurred. Please try again.");
    }finally {
      setLoading(false) 
    };
  };

  const googleLoginButton=async()=>{
    console.log("Google login clicked");
    try{
      setLoading(true);
     const response= await googleLogin();
     console.log("Google login response:",response);
    }catch(err){
      console.error("Error during Google login:", err);
      setErr("Google login failed. Please try again.");
    }finally{
      setLoading(false);
    }
  };

  if (!open) return null;

  if (Loading) {
    return ( 
    <>
    <LoadingSkeleton />
    </>
    );
  };

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
        <button
  type="button"
  onClick={googleLoginButton}
  className="w-full flex items-center justify-center gap-2 rounded border border-gray-300 px-4 py-3 text-sm font-medium hover:bg-gray-50 transition"
>
  <img
    src="https://www.svgrepo.com/show/475656/google-color.svg"
    className="h-5 w-5"
  />
  Continue with Google
</button>


          {isSignUp && (
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFirstName(val);
                    setErr(prev => ({ ...prev, firstName: validateField("firstName", val) }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submit(e);
                  }}
                  className="w-full rounded border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  placeholder="First name"
                />
                {err.firstName && <p className="text-xs text-red-600">{err.firstName}</p>}

              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setErr(prev => ({ ...prev, lastName: validateField("lastName", e.target.value) }));
                  }}
                  className="w-full rounded border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  placeholder="Last name"
                />
                {err.lastName && <p className="text-xs text-red-600">{err.lastName}</p>}

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
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      setErr(prev => ({ ...prev, businessName: validateField("businessName", e.target.value) }));
                    }}
                    className="w-full rounded border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    placeholder="Business Name"
                  />
                  {err.businessName && <p className="text-xs text-red-600">{err.businessName}</p>}

                </div>

                <div>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPhoneNumber(e.target.value);
                      setErr(prev => ({ ...prev, phoneNumber: validateField("phoneNumber", e.target.value) }));
                    }}
                    className="w-full rounded border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    placeholder="Phone Number"
                  />
                  {err.phoneNumber && <p className="text-xs text-red-600">{err.phoneNumber}</p>}

                </div>


              </>
            )
          }

          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErr(prev => ({ ...prev, email: validateField("email", e.target.value) }));
              }}
              className="w-full rounded border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              placeholder="Email"
            />
            {err.email && <p className="text-xs text-red-600">{err.email}</p>}

          </div>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setErr(prev => ({ ...prev, password: validateField("password", e.target.value) }));
              }}
              className="w-full rounded border border-gray-300 px-4 py-3 pr-16 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              placeholder="Password"
            />
            {err.password && <p className="text-xs text-red-600">{err.password}</p>}

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
                onChange={(e) => {
                  setConfirmPw(e.target.value);
                  setErr(prev => ({ ...prev, confirmPw: validateField("confirmPw", e.target.value, pw) }));
                }}
                className="w-full rounded border border-gray-300 px-4 py-3 pr-16 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                placeholder="Confirm password"
              />
              {err.confirmPw && <p className="text-xs text-red-600">{err.confirmPw}</p>}

              <button
                type="button"
                onClick={() => setShowConfirmPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-teal-600 hover:underline"
              >
                {showConfirmPw ? "HIDE" : "SHOW"}
              </button>
            </div>
          )}

          {err && typeof err === "string" && (
            <p className="text-sm text-red-600">{err}</p>
          )}

          {!isSignUp && (
            <div className="text-right">
              <a href="#" className="text-sm font-medium text-teal-600 hover:underline">
                Forgot password?
              </a>
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
          onClick={() => {
            setErr("");
            resetForm();
            onClose()
          }}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

