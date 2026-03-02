import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Globe,
  Shield,
  Eye,
  EyeOff,
  Save,
  Crown,
  CreditCard,
  QrCode,
  LogOut,
  CheckCircle2,
  User2,
  Copy,
  Download,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import toast, { ToastBar } from "react-hot-toast";
import { updateUser, updatePassword } from "../../utils/service/userService.js";
import {
  setup2FA,
  verifySetup2FA,
  disable2FA,
  get2FAStatus,
  regenerateBackupCodes,
} from "../../utils/service/twofaService.js";

export default function UserProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({});
  const [original, setOriginal] = useState({});

  useEffect(() => {
    if (!user) return;
    const formatted = {
      ...user,
      fullName: user?.name
        ? user.name
        : user?.fname && user?.lname
          ? `${user.fname} ${user.lname}`
          : "",
      plan: { name: "Growth", price: 999, renewsOn: "2026-11-01" },
    };
    setForm(formatted);
    setOriginal(formatted);
  }, [user]);

  const preventEmpty = (field, value) => {
    // If field originally had value AND new value is empty → block
    if (original[field] && value.trim() === "") {
      toast.error(`${field} cannot be empty`);
      // return original[field]; // rollback to original
    }
    return value;
  };
  let hasShownProfileWarning = useRef(false);

  useEffect(() => {
    if (!user) return;

    if (hasShownProfileWarning.current) return;

    const isIncomplete =
      !user.fname ||
      !user.lname ||
      !user.phoneNumber ||
      !user.companyName ||
      !user.address?.street ||
      !user.address?.city ||
      !user.address?.state ||
      !user.address?.country ||
      !user.address?.pinCode;

    if (isIncomplete) {
      hasShownProfileWarning.current = true;
      toast.error("Please complete your profile to continue!");
      // toast.warning("Please complete your profile to continue!", {
      //   position: "top-right",
      //   autoClose: 3000,
      // });
    }
  }, [user]);

  const [twoFA, setTwoFA] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState(0); // 0=idle, 1=scan QR, 2=verify code, 3=backup codes
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [manualEntryKey, setManualEntryKey] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);
  const [twoFAStatus, setTwoFAStatus] = useState(null);

  // Fetch 2FA status on mount
  useEffect(() => {
    const fetch2FAStatus = async () => {
      try {
        const response = await get2FAStatus();
        if (response.status === 200) {
          setTwoFAStatus(response.data);
          setTwoFA(response.data.enabled);
        }
      } catch (err) {
        console.error("Error fetching 2FA status:", err);
      }
    };
    if (user) fetch2FAStatus();
  }, [user]);

  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const planText = useMemo(
    () => (form?.plan?.price === 0 ? "Free" : `₹${form?.plan?.price}/mo`),
    [form?.plan],
  );

  const onChange = (k, v) => {
    if (k === "address") {
      // Handle nested address object
      setForm((s) => ({ ...s, address: { ...s.address, street: v } }));
    } else if (["city", "state", "pincode", "country"].includes(k)) {
      // Handle address sub-fields
      const addressKey = k === "pincode" ? "pinCode" : k;
      setForm((s) => ({ ...s, address: { ...s.address, [addressKey]: v } }));
    } else if (k === "locale") {
      setForm((s) => ({ ...s, language: v }));
    } else {
      setForm((s) => ({ ...s, [k]: v }));
    }
  };

  const saveProfile = async () => {
    const requiredFields = [
      "fullName",
      "email",
      "phoneNumber",
      "companyName",
      "GSTNumber",
    ];

    for (let field of requiredFields) {
      if (original[field] && (!form[field] || form[field].trim() === "")) {
        toast.error(`${field} cannot be empty.`);
        return;
      }
    }

    const updatedForm = {
      ...form,
      fname: form.fullName?.split(" ")[0] || "",
      lname: form.fullName?.split(" ").slice(1).join(" ") || "",
    };

    delete updatedForm.fullName; // backend should NOT receive this

    try {
      const response = await updateUser(updatedForm);
      if (response.status !== 200) {
        toast.error("Failed to save profile. Please try again.");
        return;
      }
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Failed to save profile. Please try again.");
      return;
    }
  };

  const saveSecurity = async () => {
    if (!pwd.current || !pwd.next || !pwd.confirm) {
      toast.error("Please fill all password fields");
      return;
    }
    if (pwd.next !== pwd.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    if (pwd.next.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await updatePassword({
        currentPassword: pwd.current,
        newPassword: pwd.next,
      });

      if (response.status === 200 || response.success) {
        toast.success("Password updated successfully!");
        setPwd({ current: "", next: "", confirm: "" });
      } else {
        toast.error(response.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Password update error:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to update password. Please try again.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    console.log(form);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Google-style Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-medium text-gray-900">
                  Account Settings
                </h1>
                <p className="text-sm text-gray-600">
                  Manage your profile and preferences
                </p>
              </div>
            </div>
            {user?.whatsapp?.status != "connected" ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/nodue/settings/whatsapp"
                  className="inline-flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Connect WhatsApp Account
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/nodue/settings/whatsapp"
                  className="inline-flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Connect WhatsApp Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <div className="h-24 bg-green-800"></div>
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-12">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-gradient-to-br from-green-400 to-green-600 overflow-hidden flex items-center justify-center shadow-lg">
                  <img src={user?.profileImageUrl} alt="profile avatar" />
                </div>
              </div>
              <div className="flex-1 pt-4">
                <p className="text-gray-600">
                  {form?.fname} {form?.lname}
                </p>
                <p className="text-gray-600">{form?.email}</p>
                <p className="text-sm text-gray-500">{form?.phone}</p>
              </div>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg px-4 py-3">
                  <Crown className="w-5 h-5 text-amber-600" />
                  <div>
                    <div className="text-xs font-medium text-amber-900">
                      Current Plan
                    </div>
                    <div className="text-sm font-semibold text-amber-900">
                      {form?.plan?.name} · {planText}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Section
              title="Personal Information"
              icon={<User className="w-5 h-5 text-blue-600" />}
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Full Name"
                  icon={<User className="w-4 h-4" />}
                  value={form?.fullName}
                  onChange={(v) =>
                    onChange("fullName", preventEmpty("fullName", v))
                  }
                  placeholder="Enter your full name"
                />
                <Field
                  label="Email Address"
                  icon={<Mail className="w-4 h-4" />}
                  value={form?.email}
                  onChange={(v) => onChange("email", preventEmpty("email", v))}
                  placeholder="you@company.com"
                />
                <Field
                  label="Phone Number"
                  icon={<Phone className="w-4 h-4" />}
                  value={form?.phoneNumber}
                  onChange={(v) =>
                    onChange("phoneNumber", preventEmpty("phoneNumber", v))
                  }
                  placeholder="+91 XXXXX XXXXX"
                />
                <Field
                  label="Website"
                  icon={<Globe className="w-4 h-4" />}
                  value={form?.website}
                  onChange={(v) => onChange("website", v)}
                  placeholder="https://example.com"
                />
              </div>
            </Section>

            {/* Organization Details */}
            <Section
              title="Organization Details"
              icon={<Building2 className="w-5 h-5 text-purple-600" />}
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Company Name"
                  icon={<Building2 className="w-4 h-4" />}
                  value={form?.companyName}
                  onChange={(v) =>
                    onChange("companyName", preventEmpty("companyName", v))
                  }
                  placeholder="Your company name"
                />
                <Field
                  label="GST Number"
                  icon={<CreditCard className="w-4 h-4" />}
                  value={form?.GSTNumber}
                  onChange={(v) =>
                    onChange("GSTNumber", preventEmpty("GSTNumber", v))
                  }
                  placeholder="27ABCDE1234F1Z5"
                />
              </div>
            </Section>

            {/* Address & Location */}
            <Section
              title="Address & Location"
              icon={<MapPin className="w-5 h-5 text-green-600" />}
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field
                    label="Street Address"
                    icon={<MapPin className="w-4 h-4" />}
                    value={form?.address?.street}
                    onChange={(v) => onChange("address", v)}
                    placeholder="Street, Area, Landmark"
                  />
                </div>
                <Field
                  label="City"
                  value={form?.address?.city}
                  onChange={(v) => onChange("city", v)}
                  placeholder="City"
                />
                <Field
                  label="State"
                  value={form?.address?.state}
                  onChange={(v) => onChange("state", v)}
                  placeholder="State"
                />
                <Field
                  label="PIN Code"
                  value={form?.address?.pinCode}
                  onChange={(v) => onChange("pincode", v)}
                  placeholder="000000"
                />
                <Field
                  label="Country"
                  value={form?.address?.country}
                  onChange={(v) => onChange("country", v)}
                  placeholder="Country"
                />
              </div>
            </Section>

            {/* Regional Settings */}
            <Section
              title="Regional Settings"
              icon={<Globe className="w-5 h-5 text-orange-600" />}
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Timezone"
                  value={form?.timezone}
                  onChange={(v) => onChange("timezone", v)}
                  placeholder="Asia/Kolkata"
                />
                <Field
                  label="Language & Locale"
                  value={form?.language}
                  onChange={(v) => onChange("locale", v)}
                  placeholder="en-IN"
                />
              </div>
            </Section>

            <div className="flex items-center justify-end gap-3">
              <button className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Cancel
              </button>
              <button
                onClick={saveProfile}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>

          {/* Right Column - Security & Preferences */}
          <div className="space-y-6">
            {/* Notifications */}
            {/* <Section title="Notifications" icon={<Bell className="w-5 h-5 text-indigo-600"/>}>
              <div className="space-y-3">
                <Toggle 
                  label="WhatsApp Reminders" 
                  description="Get payment reminders via WhatsApp"
                  checked={notif.whatsapp} 
                  onChange={(v)=>setNotif((s)=>({...s, whatsapp:v}))} 
                />
                <Toggle 
                  label="Email Updates" 
                  description="Receive updates and notifications via email"
                  checked={notif.email} 
                  onChange={(v)=>setNotif((s)=>({...s, email:v}))} 
                />
                <Toggle 
                  label="Voice Call Follow-ups" 
                  description="Automated voice call reminders"
                  checked={notif.voice} 
                  onChange={(v)=>setNotif((s)=>({...s, voice:v}))} 
                />
                <Toggle 
                  label="Product Announcements" 
                  description="Stay updated with new features"
                  checked={notif.product} 
                  onChange={(v)=>setNotif((s)=>({...s, product:v}))} 
                />
              </div>
            </Section> */}

            {/* Security */}
            <Section
              title="Security"
              icon={<Shield className="w-5 h-5 text-red-600" />}
            >
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Change Password
                  </h4>
                  <div className="space-y-3">
                    <PwField
                      label="Current Password"
                      value={pwd.current}
                      onChange={(v) => setPwd((s) => ({ ...s, current: v }))}
                    />
                    <PwField
                      label="New Password"
                      value={pwd.next}
                      onChange={(v) => setPwd((s) => ({ ...s, next: v }))}
                    />
                    <PwField
                      label="Confirm New Password"
                      value={pwd.confirm}
                      onChange={(v) => setPwd((s) => ({ ...s, confirm: v }))}
                    />
                    <button
                      onClick={saveSecurity}
                      disabled={passwordLoading}
                      className="w-full bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {passwordLoading ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  {/* 2FA Status / Setup Wizard */}
                  {twoFAStep === 0 && !twoFA && (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">
                          Two-Factor Authentication
                        </div>
                        <p className="text-sm text-gray-600">
                          Add an extra layer of security to your account using
                          Google Authenticator
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200">
                          Disabled
                        </span>
                        <button
                          onClick={async () => {
                            setTwoFALoading(true);
                            try {
                              const response = await setup2FA();
                              if (response.status === 200) {
                                setQrCodeUrl(response.data.qrCodeUrl);
                                setManualEntryKey(response.data.manualEntryKey);
                                setTwoFAStep(1);
                              }
                            } catch (err) {
                              toast.error(
                                err.response?.data?.errors?.[0] ||
                                  "Failed to start 2FA setup",
                              );
                            } finally {
                              setTwoFALoading(false);
                            }
                          }}
                          disabled={twoFALoading}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          {twoFALoading ? "Setting up..." : "Enable"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 1: Scan QR Code */}
                  {twoFAStep === 1 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={() => {
                            setTwoFAStep(0);
                            setVerifyCode("");
                            setVerifyError("");
                          }}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <h4 className="font-medium text-gray-900">
                          Step 1: Scan QR Code
                        </h4>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                        <div className="text-sm text-gray-700 mb-3 space-y-1">
                          <p className="font-medium">
                            Open Google Authenticator on your phone:
                          </p>
                          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                            <li>
                              Tap the <strong>+</strong> button
                            </li>
                            <li>
                              Select <strong>"Scan a QR code"</strong>
                            </li>
                            <li>Point your camera at the code below</li>
                          </ol>
                        </div>
                        {qrCodeUrl && (
                          <div className="flex justify-center my-4">
                            <img
                              src={qrCodeUrl}
                              alt="2FA QR Code"
                              className="w-48 h-48 rounded-lg border border-gray-200 bg-white p-2"
                            />
                          </div>
                        )}
                        <div className="mt-3 p-3 rounded-lg bg-white border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">
                            Can't scan? Enter this key manually:
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs font-mono bg-gray-100 px-2 py-1 rounded break-all">
                              {manualEntryKey}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(manualEntryKey);
                                toast.success("Key copied!");
                              }}
                              className="p-1.5 rounded hover:bg-gray-100"
                              title="Copy key"
                            >
                              <Copy className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setTwoFAStep(2);
                            setVerifyCode("");
                            setVerifyError("");
                          }}
                          className="w-full mt-4 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                        >
                          Next — I've scanned the code
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Verify Code */}
                  {twoFAStep === 2 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={() => setTwoFAStep(1)}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <h4 className="font-medium text-gray-900">
                          Step 2: Verify Code
                        </h4>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                        <p className="text-sm text-gray-600 mb-3">
                          Enter the 6-digit code displayed in your Google
                          Authenticator app:
                        </p>
                        <input
                          type="text"
                          value={verifyCode}
                          onChange={(e) => {
                            const val = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6);
                            setVerifyCode(val);
                            setVerifyError("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && verifyCode.length === 6) {
                              // trigger verify
                              document
                                .getElementById("verify-2fa-btn")
                                ?.click();
                            }
                          }}
                          className={`w-full text-center text-lg tracking-[0.5em] font-mono border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            verifyError ? "border-red-400" : "border-gray-300"
                          }`}
                          placeholder="000000"
                          autoFocus
                          autoComplete="one-time-code"
                        />
                        {verifyError && (
                          <p className="mt-2 text-xs text-red-600">
                            {verifyError}
                          </p>
                        )}
                        <button
                          id="verify-2fa-btn"
                          onClick={async () => {
                            if (verifyCode.length !== 6) {
                              setVerifyError("Please enter a 6-digit code");
                              return;
                            }
                            setTwoFALoading(true);
                            try {
                              const response = await verifySetup2FA(verifyCode);
                              if (response.status === 200) {
                                setBackupCodes(response.data.backupCodes);
                                setTwoFAStep(3);
                                toast.success("2FA enabled successfully!");
                              }
                            } catch (err) {
                              setVerifyError(
                                err.response?.data?.errors?.[0] ||
                                  "Invalid code. Please try again.",
                              );
                            } finally {
                              setTwoFALoading(false);
                            }
                          }}
                          disabled={twoFALoading || verifyCode.length !== 6}
                          className="w-full mt-3 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {twoFALoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />{" "}
                              Verifying...
                            </>
                          ) : (
                            "Verify & Enable"
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Backup Codes */}
                  {twoFAStep === 3 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <KeyRound className="w-5 h-5 text-amber-600" />
                        <h4 className="font-medium text-gray-900">
                          Step 3: Save Backup Codes
                        </h4>
                      </div>
                      <div className="rounded-lg border border-amber-200 p-4 bg-amber-50">
                        <div className="flex items-start gap-2 mb-3">
                          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                          <p className="text-sm text-amber-800">
                            Save these codes in a safe place. Each code can only
                            be used once. If you lose access to your
                            authenticator app, these are the only way to log in.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {backupCodes.map((code, i) => (
                            <div
                              key={i}
                              className="bg-white border border-amber-200 rounded px-3 py-2 text-center"
                            >
                              <code className="text-sm font-mono text-gray-800">
                                {code}
                              </code>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 mb-4">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                backupCodes.join("\n"),
                              );
                              toast.success("Backup codes copied!");
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                          >
                            <Copy className="w-4 h-4" /> Copy All
                          </button>
                          <button
                            onClick={() => {
                              const content = `NoDue - 2FA Backup Codes\nGenerated: ${new Date().toLocaleDateString()}\n\n${backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\nKeep these codes safe. Each can only be used once.`;
                              const blob = new Blob([content], {
                                type: "text/plain",
                              });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = "nodue-2fa-backup-codes.txt";
                              a.click();
                              URL.revokeObjectURL(url);
                              toast.success("Backup codes downloaded!");
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                          >
                            <Download className="w-4 h-4" /> Download
                          </button>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer mb-3">
                          <input
                            type="checkbox"
                            checked={backupCodesSaved}
                            onChange={(e) =>
                              setBackupCodesSaved(e.target.checked)
                            }
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            I have saved my backup codes
                          </span>
                        </label>
                        <button
                          onClick={() => {
                            setTwoFA(true);
                            setTwoFAStep(0);
                            setBackupCodes([]);
                            setBackupCodesSaved(false);
                            setTwoFAStatus((prev) => ({
                              ...prev,
                              enabled: true,
                              enabledAt: new Date().toISOString(),
                            }));
                          }}
                          disabled={!backupCodesSaved}
                          className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2FA Enabled State */}
                  {twoFAStep === 0 && twoFA && (
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-1">
                            Two-Factor Authentication
                          </div>
                          <p className="text-sm text-gray-600">
                            Your account is secured with 2FA
                          </p>
                          {twoFAStatus?.enabledAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Enabled on{" "}
                              {new Date(
                                twoFAStatus.enabledAt,
                              ).toLocaleDateString()}
                            </p>
                          )}
                          {twoFAStatus?.backupCodesRemaining !== undefined &&
                            twoFAStatus.backupCodesRemaining <= 2 && (
                              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Only {twoFAStatus.backupCodesRemaining} backup
                                code
                                {twoFAStatus.backupCodesRemaining !== 1
                                  ? "s"
                                  : ""}{" "}
                                remaining
                              </p>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="w-3 h-3" /> Enabled
                          </span>
                          <button
                            onClick={() => setShowDisableDialog(true)}
                            className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                          >
                            Disable
                          </button>
                        </div>
                      </div>

                      {/* Disable 2FA Password Dialog */}
                      {showDisableDialog && (
                        <div className="mt-4 rounded-lg border border-red-200 p-4 bg-red-50">
                          <p className="text-sm text-red-800 mb-3 font-medium">
                            Enter your password to disable 2FA:
                          </p>
                          <input
                            type="password"
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-3"
                            placeholder="Current password"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                if (!disablePassword.trim()) {
                                  toast.error("Password is required");
                                  return;
                                }
                                setDisableLoading(true);
                                try {
                                  const response =
                                    await disable2FA(disablePassword);
                                  if (response.status === 200) {
                                    setTwoFA(false);
                                    setShowDisableDialog(false);
                                    setDisablePassword("");
                                    setTwoFAStatus((prev) => ({
                                      ...prev,
                                      enabled: false,
                                    }));
                                    toast.success(
                                      "Two-factor authentication disabled",
                                    );
                                  }
                                } catch (err) {
                                  toast.error(
                                    err.response?.data?.errors?.[0] ||
                                      "Failed to disable 2FA",
                                  );
                                } finally {
                                  setDisableLoading(false);
                                }
                              }}
                              disabled={disableLoading}
                              className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {disableLoading
                                ? "Disabling..."
                                : "Confirm Disable"}
                            </button>
                            <button
                              onClick={() => {
                                setShowDisableDialog(false);
                                setDisablePassword("");
                              }}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {/* Billing & Plan */}
            <Section
              title="Billing & Plan"
              icon={<CreditCard className="w-5 h-5 text-pink-600" />}
            >
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-white border border-gray-200">
                      <Crown className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {form?.plan?.name} Plan
                      </div>
                      <div className="text-sm text-gray-600">{planText}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Renews on {form?.plan?.renewsOn}
                  </div>
                </div>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Components
function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, icon, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}
        <input
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            icon ? "pl-10" : ""
          }`}
        />
      </div>
    </div>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <div className="font-medium text-sm text-gray-900">{label}</div>
        {description && (
          <div className="text-xs text-gray-600 mt-0.5">{description}</div>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer ml-4">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={!!checked}
          onChange={(e) => onChange?.(e.target.checked)}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
}

function PwField({ label, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
