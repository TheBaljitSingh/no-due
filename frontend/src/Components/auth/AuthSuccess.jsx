import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getGoogleProfile } from "../../utils/service/authService";
import { verify2FALogin } from "../../utils/service/twofaService";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function AuthSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setIsUserLoggedOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // 2FA state
  const requires2FA = searchParams.get("requires2fa") === "true";
  const [twoFACode, setTwoFACode] = useState("");
  const [isBackupCode, setIsBackupCode] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState("");

  useEffect(() => {
    // If 2FA is required, don't fetch profile — wait for TOTP verification
    if (requires2FA) {
      setIsLoading(false);
      return;
    }

    let timer;
    async function fetchProfile() {
      try {
        const data = await getGoogleProfile();

        // Save login state
        localStorage.setItem("isUserLoggedIn", "true");
        setIsUserLoggedOut(false);
        setUser(data.data.user);

        // Stop loading → show success page
        setIsLoading(false);

        // Redirect after 2 seconds
        timer = setTimeout(() => {
          navigate("/nodue");
        }, 2000);
      } catch (error) {
        console.error("Error fetching Google profile:", error);
        navigate("/");
      }
    }

    fetchProfile();
    return () => clearTimeout(timer);
  }, [navigate, setUser, setIsUserLoggedOut, requires2FA]);

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

        // Fetch full profile
        const profileData = await getGoogleProfile();
        setUser(profileData.data.user);

        toast.success("Login successful!");
        navigate("/nodue");
      }
    } catch (err) {
      console.error("2FA verification error:", err);
      const errorMsg =
        err.response?.data?.errors?.[0] ||
        err.response?.data?.message ||
        "Invalid code. Please try again.";
      setTwoFAError(errorMsg);
      if (err.response?.status === 429) {
        toast.error("Too many failed attempts. Please login again.");
        setTimeout(() => navigate("/"), 2000);
      }
    } finally {
      setTwoFALoading(false);
    }
  };

  // ---- 2FA Verification Screen for Google OAuth ----
  if (requires2FA) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-blue-50 text-gray-800">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
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
            <h2 className="text-2xl font-semibold text-gray-800">
              Two-Factor Authentication
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Google sign-in successful!{" "}
              {isBackupCode
                ? "Enter one of your backup codes to continue"
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
                className={`w-full font-semibold rounded-lg border px-4 py-3 text-center text-lg tracking-[0.5em] outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
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
              className="w-full rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {isBackupCode ? "Use authenticator code" : "Use backup code"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // While fetching profile
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-blue-50 text-gray-800">
        <h2 className="text-3xl font-semibold">Verifying your account...</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-blue-50 text-gray-800">
      <h2 className="text-4xl font-bold text-green-600 mb-4">
        Authentication Successful!
      </h2>
      <p className="text-lg text-gray-500">Redirecting…</p>
    </div>
  );
}
