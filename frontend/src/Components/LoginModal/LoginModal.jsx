import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { registerUser } from "../../utils/service/userService";
import {
  checkAuth,
  googleLogin,
  loginUser,
} from "../../utils/service/authService";
import { verify2FALogin } from "../../utils/service/twofaService";
import LoadingPage from "../AfterAuthComponent/ReminderHistoryPage/LoadingPage";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

// ─── Animation variants ─────────────────────────────────────────────────────

/** Modal backdrop */
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

/** Modal card */
const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: 24,
    scale: 0.96,
    transition: { duration: 0.22, ease: "easeIn" },
  },
};

/** Form content — re-animates on mode switch */
const formVariants = {
  hidden: { opacity: 0, x: 18 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.32, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    x: -18,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

/** Staggered field rows */
const fieldListVariants = {
  visible: { transition: { staggerChildren: 0.065, delayChildren: 0.05 } },
};
const fieldVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

// ─── Small helpers ───────────────────────────────────────────────────────────

const EyeIcon = ({ open }) =>
  open ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.09-3.568M6.228 6.228A9.969 9.969 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.97 9.97 0 01-2.682 4.317M3 3l18 18"
      />
    </svg>
  );

const FieldRow = ({ children }) => (
  <motion.div variants={fieldVariants}>{children}</motion.div>
);

// ─── Main component ──────────────────────────────────────────────────────────

export default function LoginModal({ open, onClose }) {
  const dialogRef = useRef(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [lastName, setLastName] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [err, setErr] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [Loading, setLoading] = useState(true);
  const { user, setUser, setIsUserLoggedOut } = useAuth();

  // 2FA state
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [isBackupCode, setIsBackupCode] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
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
    setErr({});
    setSubmitError("");
    setShowPw(false);
    setShowConfirmPw(false);
    setShow2FA(false);
    setTwoFACode("");
    setIsBackupCode(false);
    setTwoFAError("");
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  const validateField = (field, value, pw = "", confirmPw = "") => {
    value = value?.trim();
    switch (field) {
      case "firstName":
        if (!value) return "First name is required.";
        if (value.length < 2) return "At least 2 characters.";
        if (!/^[a-zA-Z ]+$/.test(value)) return "Letters only.";
        return "";
      case "lastName":
        if (!value) return "Last name is required.";
        if (!/^[a-zA-Z ]+$/.test(value)) return "Letters only.";
        return "";
      case "email":
        if (!value) return "Email is required.";
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value))
          return "Please enter a valid email address.";
        return "";
      case "password":
        if (!value) return "Password is required.";
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(value))
          return "Password must have 8+ chars, 1 uppercase, 1 lowercase, 1 number & 1 symbol.";
        return "";
      case "confirmPw":
        if (value !== pw) return "Passwords do not match.";
        return "";
      case "phoneNumber":
        if (!value) return "";
        if (!/^(\+\d{1,3}[- ]?)?\d{10}$/.test(value))
          return "Invalid phone number.";
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

    if (isSignUp && Object.values(newErrors).some((err) => err)) {
      setLoading(false);
      return;
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
          password: pw,
        });
        if (response.status === 201) {
          setIsSignUp(false);
          resetForm();
          toast.success("Registration successful! Please log in.");
        }
      } else {
        const response = await loginUser({
          email: email.trim(),
          password: pw,
        });

        console.log(response);

        // 2FA required
        if (response.status === 202 && response.data?.requires2FA) {
          setShow2FA(true);
          setTwoFAError("");
          setTwoFACode("");
          setIsBackupCode(false);
          return;
        }

        if (response.status === 200) {
          setUser(response.data.user);
          setIsUserLoggedOut(false);
          localStorage.setItem("isUserLoggedIn", "true");
          const userdata = await checkAuth(); // it will fetch the current user logged in data
          setUser(userdata.data.user); // will update the user data in the state

          resetForm();
          onClose();

          navigate("/nodue/customer-master");
        }
      }
    } catch (err) {
      console.error("Error during form submission:", err);
      setSubmitError(
        err.response?.data?.errors[0] || "An error occurred. Please try again.",
      );
    } finally {
      setLoading(false);
    }
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

  // ---- 2FA Verification Handler ----
  const submit2FA = async (e) => {
    e?.preventDefault();
    if (!twoFACode.trim()) {
      setTwoFAError("Please enter your verification code.");
      return;
    }
    setTwoFALoading(true);
    setTwoFAError("");
    try {
      const response = await verify2FALogin(twoFACode.trim(), isBackupCode);
      if (response.status === 200) {
        setUser(response.data.user);
        setIsUserLoggedOut(false);
        localStorage.setItem("isUserLoggedIn", "true");
        const userdata = await checkAuth();
        setUser(userdata.data.user);
        resetForm();
        onClose();
        navigate("/nodue/customer-master");
      }
    } catch (err) {
      console.error("2FA verification error:", err);
      const errorMsg =
        err.response?.data?.errors?.[0] ||
        err.response?.data?.message ||
        "Invalid code. Please try again.";
      setTwoFAError(errorMsg);
      // Check if session was destroyed (429 too many attempts)
      if (err.response?.status === 429) {
        toast.error("Too many failed attempts. Please login again.");
        setShow2FA(false);
        resetForm();
      }
    } finally {
      setTwoFALoading(false);
    }
  };

  // ---- 2FA VERIFICATION SCREEN ----
  if (show2FA) {
    return (
      <div
        className="fixed min-h-screen inset-0 z-50 grid place-items-center"
        aria-modal="true"
        role="dialog"
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div
          ref={dialogRef}
          className="relative z-10 w-full max-w-md rounded-lg bg-white p-8 shadow-xl"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 mb-4">
              <svg
                className="w-8 h-8 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-normal text-gray-800">
              Two-Factor Authentication
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isBackupCode
                ? "Enter one of your backup codes"
                : "Enter the 6-digit code from your authenticator app"}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={twoFACode}
                onChange={(e) => {
                  const val = isBackupCode
                    ? e.target.value
                    : e.target.value.replace(/\D/g, "").slice(0, 6);
                  setTwoFACode(val);
                  setTwoFAError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit2FA(e);
                }}
                className={`w-full font-semibold rounded border px-4 py-3 text-center text-lg tracking-[0.5em] outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600 ${
                  isBackupCode ? "tracking-normal text-sm text-left" : ""
                } ${twoFAError ? "border-red-400" : "border-gray-300"}`}
                placeholder={isBackupCode ? "Backup code" : "000000"}
                autoFocus
                autoComplete="one-time-code"
              />
              {twoFAError && (
                <p className="mt-2 text-xs text-red-600">{twoFAError}</p>
              )}
            </div>

            <button
              onClick={submit2FA}
              disabled={twoFALoading || !twoFACode.trim()}
              className="w-full rounded bg-teal-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {twoFALoading ? "Verifying..." : "Verify"}
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsBackupCode(!isBackupCode);
                  setTwoFACode("");
                  setTwoFAError("");
                }}
                className="text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                {isBackupCode ? "Use authenticator code" : "Use backup code"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShow2FA(false);
                  resetForm();
                }}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              setShow2FA(false);
              resetForm();
              onClose();
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
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed min-h-screen inset-0 z-50 grid place-items-center"
          aria-modal="true"
          role="dialog"
          onMouseDown={onClose}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Blurred backdrop */}
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />

          {/* Modal card */}
          <motion.div
            ref={dialogRef}
            className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Subtle top accent line */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600"
            />

            {/* ── Content that slides when mode toggles ── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isSignUp ? "signup" : "signin"}
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Logo / heading */}
                <div className="mb-6 text-center">
                  {!isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, ease: "backOut" }}
                      className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full"
                    >
                      <img
                        src="https://res.cloudinary.com/dzdt11nsx/image/upload/v1770710830/logo_s59z23.png"
                        alt="NoDue logo"
                      />
                    </motion.div>
                  )}
                  <h2 className="text-2xl font-semibold text-gray-800">
                    {isSignUp ? "Create your Account" : "Sign in"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {isSignUp
                      ? "to continue to our service"
                      : "to continue to your account"}
                  </p>
                </div>

                {/* Google button */}
                <motion.div variants={fieldVariants}>
                  <motion.button
                    type="button"
                    onClick={googleLoginButton}
                    className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                  >
                    <img
                      src="https://www.svgrepo.com/show/475656/google-color.svg"
                      className="h-5 w-5"
                      alt=""
                    />
                    Continue with Google
                  </motion.button>
                </motion.div>

                {/* Divider */}
                <div className="flex items-center my-5">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="px-4 text-xs font-medium text-gray-400 uppercase tracking-wider bg-white">
                    or
                  </span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>

                {/* ── Staggered form fields ── */}
                <motion.div
                  className="space-y-4"
                  variants={fieldListVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {/* Sign-up name row */}
                  {isSignUp && (
                    <FieldRow>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => {
                              setFirstName(e.target.value);
                              setErr((prev) => ({
                                ...prev,
                                firstName: validateField(
                                  "firstName",
                                  e.target.value,
                                ),
                              }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") submit(e);
                            }}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                            placeholder="First name"
                          />
                          {err.firstName && (
                            <p className="mt-1 text-xs text-red-500">
                              {err.firstName}
                            </p>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => {
                              setLastName(e.target.value);
                              setErr((prev) => ({
                                ...prev,
                                lastName: validateField(
                                  "lastName",
                                  e.target.value,
                                ),
                              }));
                            }}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                            placeholder="Last name"
                          />
                          {err.lastName && (
                            <p className="mt-1 text-xs text-red-500">
                              {err.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    </FieldRow>
                  )}

                  {/* Phone */}
                  {isSignUp && (
                    <FieldRow>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value);
                          setErr((prev) => ({
                            ...prev,
                            phoneNumber: validateField(
                              "phoneNumber",
                              e.target.value,
                            ),
                          }));
                        }}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        placeholder="Phone number"
                      />
                      {err.phoneNumber && (
                        <p className="mt-1 text-xs text-red-500">
                          {err.phoneNumber}
                        </p>
                      )}
                    </FieldRow>
                  )}

                  {/* Email */}
                  <FieldRow>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErr((prev) => ({
                          ...prev,
                          email: validateField("email", e.target.value),
                        }));
                      }}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      placeholder="Email"
                    />
                    {err.email && (
                      <p className="mt-1 text-xs text-red-500">{err.email}</p>
                    )}
                  </FieldRow>

                  {/* Password */}
                  <FieldRow>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={pw}
                        onChange={(e) => {
                          setPw(e.target.value);
                          setErr((prev) => ({
                            ...prev,
                            password: validateField("password", e.target.value),
                          }));
                        }}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 text-sm font-medium outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        placeholder="Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors cursor-pointer"
                      >
                        <EyeIcon open={showPw} />
                      </button>
                    </div>
                    {err.password && isSignUp && (
                      <p className="mt-1 text-xs text-red-500">
                        {err.password}
                      </p>
                    )}
                  </FieldRow>

                  {/* Confirm password */}
                  {isSignUp && (
                    <FieldRow>
                      <div className="relative">
                        <input
                          type={showConfirmPw ? "text" : "password"}
                          value={confirmPw}
                          onChange={(e) => {
                            setConfirmPw(e.target.value);
                            setErr((prev) => ({
                              ...prev,
                              confirmPw: validateField(
                                "confirmPw",
                                e.target.value,
                                pw,
                              ),
                            }));
                          }}
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 text-sm font-medium outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                          placeholder="Confirm password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors cursor-pointer"
                        >
                          <EyeIcon open={showConfirmPw} />
                        </button>
                      </div>
                      {err.confirmPw && (
                        <p className="mt-1 text-xs text-red-500">
                          {err.confirmPw}
                        </p>
                      )}
                    </FieldRow>
                  )}

                  {/* Submit / API error */}
                  {submitError && (
                    <p className="text-sm text-red-500 ">{submitError}</p>
                  )}

                  {/* Forgot password */}
                  {!isSignUp && (
                    <FieldRow>
                      <div className="text-right">
                        <a
                          href="#"
                          className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                        >
                          Forgot password?
                        </a>
                      </div>
                    </FieldRow>
                  )}

                  {/* Footer row: toggle + submit */}
                  <FieldRow>
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <button
                        type="button"
                        onClick={toggleMode}
                        className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors cursor-pointer"
                      >
                        {isSignUp ? "Sign in instead" : "Create account"}
                      </button>

                      <motion.button
                        onClick={submit}
                        className="rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors cursor-pointer"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                      >
                        {isSignUp ? "Sign up" : "Next"}
                      </motion.button>
                    </div>
                  </FieldRow>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Close button */}
            <motion.button
              onClick={() => {
                setErr("");
                resetForm();
                onClose();
              }}
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close"
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
