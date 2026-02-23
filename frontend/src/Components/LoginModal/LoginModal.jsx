import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../utils/service/userService";
import { checkAuth, googleLogin, loginUser } from "../../utils/service/authService";
import LoadingPage from "../AfterAuthComponent/ReminderHistoryPage/LoadingPage";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

export default function LoginModal({ open, onClose }) {
  const dialogRef = useRef(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const navigate = useNavigate();

  // Form fields
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [lastName, setLastName] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");


  const [err, setErr] = useState({});
  const [Loading, setLoading] = useState(true);
  const { user, setUser, setIsUserLoggedOut } = useAuth();

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
        if (!/^[a-zA-Z ]+$/.test(value))
          return "First name should contain only letters.";
        return "";

      // LAST NAME
      case "lastName":
        if (!value) return "Last name is required.";
        if (value.length < 1) return "Last name must be at least 1 characters.";
        if (!/^[a-zA-Z ]+$/.test(value))
          return "Last name should contain only letters.";
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
      setErr("Please fill in all required fields.");
      return;
    }

    try {
      if (isSignUp) {
        const response = await registerUser({
          email: email.trim(),
          fname: firstName.trim(),
          phoneNumber: phoneNumber.trim(),
          lname: lastName.trim(),
          password: pw
        });
        if (response.status === 201) {
          setIsSignUp(false);
          resetForm();
          toast.success("Registration successful! Please log in.");
        }
      }
      else {

        const response = await loginUser({
          email: email.trim(),
          password: pw
        });

        console.log(response);

        if (response.status === 200) {
          setUser(response.data.user);
          setIsUserLoggedOut(false);
          localStorage.setItem('isUserLoggedIn', 'true');
          const userdata = await checkAuth(); // it will fetch the current user logged in data
          setUser(userdata.data.user); // will update the user data in the state
          
          resetForm();
          onClose();

          navigate('/nodue/customer-master');


        }
      }
    } catch (err) {
      console.error("Error during form submission:", err);
      setErr(err.response?.data?.errors[0] || "An error occurred. Please try again.");
    } finally {
      setLoading(false)
    };
  };

  const googleLoginButton = () => {
    try {
      setLoading(true);
      googleLogin();
    } catch (err) {
      console.error("Error during Google login:", err);
      setErr("Google login failed. Please try again.");
      setLoading(false);
    }
  };

  if (!open) return null;



  return (

    <div
      className="fixed min-h-screen inset-0 z-50 grid place-items-center"
      aria-modal="true"
      role="dialog"
      onMouseDown={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm " />

      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-md rounded-lg bg-red-400 bg-white p-8 shadow-xl "
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Logo Area */}
        <div className="mb-6 text-center ">
          <div className={`mx-auto ${isSignUp ? 'hidden' : 'flex'} h-32 w-32 items-center justify-center rounded-full `}>
            <img src='https://res.cloudinary.com/dzdt11nsx/image/upload/v1770710830/logo_s59z23.png' alt="" />
          </div>
          <h2 className="text-2xl font-normal text-gray-800">
            {isSignUp ? "Create your Account" : "Sign in"}
          </h2>
          <p className="mt-1 text-sm font-semibold text-gray-600">
            {isSignUp ? "to continue to our service" : "to continue to your account"}
          </p>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={googleLoginButton}
            className="w-full flex items-center justify-center gap-2  border border-gray-300 rounded-lg  px-4 py-2 text-sm font-semibold hover:bg-gray-100 transition"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="h-5 w-5"
            />
            Continue with Google
          </button>

          <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500 bg-white">
            OR
          </span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>


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
                  className="w-full font-semibold rounded border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  placeholder="First name"
                />
                {err.firstName && <p className="text-xs font-normal text-red-600">{err.firstName}</p>}

              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setErr(prev => ({ ...prev, lastName: validateField("lastName", e.target.value) }));
                  }}
                  className="w-full font-semibold rounded border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  placeholder="Last name"
                />
                {err.lastName && <p className="text-xs font-normal text-red-600">{err.lastName}</p>}

              </div>



            </div>
          )}
          {
            isSignUp && (
              <>
            

                <div>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPhoneNumber(e.target.value);
                      setErr(prev => ({ ...prev, phoneNumber: validateField("phoneNumber", e.target.value) }));
                    }}
                    className="w-full font-semibold rounded border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    placeholder="Phone Number"
                  />
                  {err.phoneNumber && <p className="text-xs font-normal text-red-600">{err.phoneNumber}</p>}

                </div>


              </>
            )
          }

          <div className="flex flex-col gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErr(prev => ({ ...prev, email: validateField("email", e.target.value) }));
              }}
              className="w-full font-semibold rounded border font-semibold border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              placeholder="Email"
            />
            {err.email && <p className="text-xs font-normal text-red-600 min-h-[16px]">{err.email}</p>}

          </div>
          <div className="relative flex flex-col gap-2">
            <input
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setErr(prev => ({ ...prev, password: validateField("password", e.target.value) }));
              }}
              className="w-full font-semibold rounded border font-semibold border-gray-300 px-4 py-3 pr-16 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              placeholder="Password"
              />


            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-4 item-center text-xs font-medium text-teal-600"
              >
              {showPw ? "HIDE" : "SHOW"}
            </button>

          {err.password &&isSignUp  && <p className="text-xs font-normal text-red-600 min-h-[16px]">{err.password}</p>}
          </div>


          {isSignUp && (
            <div className="relative flex flex-col gap-2">
              <input
                type={showConfirmPw ? "text" : "password"}
                value={confirmPw}
                onChange={(e) => {
                  setConfirmPw(e.target.value);
                  setErr(prev => ({ ...prev, confirmPw: validateField("confirmPw", e.target.value, pw) }));
                }}
                className="w-full font-semibold rounded border border-gray-300 px-4 py-3 pr-16 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                placeholder="Confirm password"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPw((s) => !s)}
                className="absolute right-3 top-3.5  text-xs font-medium text-teal-600"
              >
                {showConfirmPw ? "HIDE" : "SHOW"}
              </button>

                {/* <div className="flex flex-col"> */}
                {err.confirmPw && <p className="text-xs font-normal text-red-600 min-h-[16px]">{err.confirmPw}</p>}
                {/* </div> */}

            </div>
          )}

          {err && typeof err === "string" && (
            <p className="text-sm font-normal text-red-600">{err}</p>
          )}

          {!isSignUp && (
            <div className="text-right">
              <a href="#" className="text-sm font-medium text-teal-600">
                Forgot password?
              </a>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 ">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm font-medium text-teal-600 hover:text-blue-700"
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
