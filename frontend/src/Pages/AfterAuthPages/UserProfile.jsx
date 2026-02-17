import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { User, Mail, Phone, Building2, MapPin, Globe, Shield, Eye, EyeOff, Save, Crown, CreditCard, QrCode, LogOut, CheckCircle2, User2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { toast } from "react-toastify";
import { updateUser, updatePassword } from "../../utils/service/userService.js";

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
      plan: { name: "Growth", price: 999, renewsOn: "2026-11-01" }
    }
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
      toast.warning("Please complete your profile to continue!", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  }, [user]);





  const [twoFA, setTwoFA] = useState(false);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const planText = useMemo(() => (form?.plan?.price === 0 ? "Free" : `₹${form?.plan?.price}/mo`), [form?.plan]);

  const onChange = (k, v) => {
    if (k === 'address') {
      // Handle nested address object
      setForm((s) => ({ ...s, address: { ...s.address, street: v } }));
    } else if (['city', 'state', 'pincode', 'country'].includes(k)) {
      // Handle address sub-fields
      const addressKey = k === 'pincode' ? 'pinCode' : k;
      setForm((s) => ({ ...s, address: { ...s.address, [addressKey]: v } }));
    } else if (k === 'locale') {
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
        newPassword: pwd.next
      });

      if (response.status === 200 || response.success) {
        toast.success("Password updated successfully!");
        setPwd({ current: "", next: "", confirm: "" });
      } else {
        toast.error(response.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Password update error:", error);
      toast.error(error.response?.data?.message || "Failed to update password. Please try again.");
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
                <h1 className="text-xl font-medium text-gray-900">Account Settings</h1>
                <p className="text-sm text-gray-600">Manage your profile and preferences</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/nodue/settings/whatsapp" className="inline-flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <LogOut className="w-4 h-4" /> Connect WhatsApp Account
              </Link>
            </div>
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
                <p className="text-gray-600">{form?.fname} {form?.lname}</p>
                <p className="text-gray-600">{form?.email}</p>
                <p className="text-sm text-gray-500">{form?.phone}</p>
              </div>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg px-4 py-3">
                  <Crown className="w-5 h-5 text-amber-600" />
                  <div>
                    <div className="text-xs font-medium text-amber-900">Current Plan</div>
                    <div className="text-sm font-semibold text-amber-900">{form?.plan?.name} · {planText}</div>
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
            <Section title="Personal Information" icon={<User className="w-5 h-5 text-blue-600" />}>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Full Name"
                  icon={<User className='w-4 h-4' />}
                  value={form?.fullName}
                  onChange={(v) => onChange("fullName", preventEmpty("fullName", v))}
                  placeholder="Enter your full name"
                />
                <Field
                  label="Email Address"
                  icon={<Mail className='w-4 h-4' />}
                  value={form?.email}
                  onChange={(v) => onChange('email', preventEmpty("email", v))}
                  placeholder="you@company.com"
                />
                <Field
                  label="Phone Number"
                  icon={<Phone className='w-4 h-4' />}
                  value={form?.phoneNumber}
                  onChange={(v) => onChange('phoneNumber', preventEmpty("phoneNumber", v))}
                  placeholder="+91 XXXXX XXXXX"
                />
                <Field
                  label="Website"
                  icon={<Globe className='w-4 h-4' />}
                  value={form?.website}
                  onChange={(v) => onChange('website', v)}
                  placeholder="https://example.com"
                />
              </div>
            </Section>

            {/* Organization Details */}
            <Section title="Organization Details" icon={<Building2 className="w-5 h-5 text-purple-600" />}>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Company Name"
                  icon={<Building2 className='w-4 h-4' />}
                  value={form?.companyName}
                  onChange={(v) => onChange('companyName', preventEmpty("companyName", v))}
                  placeholder="Your company name"
                />
                <Field
                  label="GST Number"
                  icon={<CreditCard className='w-4 h-4' />}
                  value={form?.GSTNumber}
                  onChange={(v) => onChange('GSTNumber', preventEmpty("GSTNumber", v))}
                  placeholder="27ABCDE1234F1Z5"
                />
              </div>
            </Section>

            {/* Address & Location */}
            <Section title="Address & Location" icon={<MapPin className="w-5 h-5 text-green-600" />}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field
                    label="Street Address"
                    icon={<MapPin className='w-4 h-4' />}
                    value={form?.address?.street}
                    onChange={(v) => onChange('address', v)}
                    placeholder="Street, Area, Landmark"
                  />
                </div>
                <Field
                  label="City"
                  value={form?.address?.city}
                  onChange={(v) => onChange('city', v)}
                  placeholder="City"
                />
                <Field
                  label="State"
                  value={form?.address?.state}
                  onChange={(v) => onChange('state', v)}
                  placeholder="State"
                />
                <Field
                  label="PIN Code"
                  value={form?.address?.pinCode}
                  onChange={(v) => onChange('pincode', v)}
                  placeholder="000000"
                />
                <Field
                  label="Country"
                  value={form?.address?.country}
                  onChange={(v) => onChange('country', v)}
                  placeholder="Country"
                />
              </div>
            </Section>

            {/* Regional Settings */}
            <Section title="Regional Settings" icon={<Globe className="w-5 h-5 text-orange-600" />}>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Timezone"
                  value={form?.timezone}
                  onChange={(v) => onChange('timezone', v)}
                  placeholder="Asia/Kolkata"
                />
                <Field
                  label="Language & Locale"
                  value={form?.language}
                  onChange={(v) => onChange('locale', v)}
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
            <Section title="Security" icon={<Shield className="w-5 h-5 text-red-600" />}>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Change Password</h4>
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
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">Two-Factor Authentication</div>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${twoFA
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}>
                        {twoFA ? <CheckCircle2 className="w-3 h-3" /> : null}
                        {twoFA ? "Enabled" : "Disabled"}
                      </span>
                      <button
                        onClick={() => setTwoFA(v => !v)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        {twoFA ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>

                  {twoFA && (
                    <div className="mt-4 rounded-lg border border-gray-200 p-4 bg-gray-50">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3">
                        <QrCode className="w-4 h-4" /> Scan QR Code
                      </div>
                      <div className="w-full h-40 rounded-lg border-2 border-dashed border-gray-300 bg-white flex items-center justify-center">
                        <div className="text-center">
                          <QrCode className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500">QR Code Placeholder</p>
                          <p className="text-xs text-gray-400 mt-1">Scan with Google Authenticator</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {/* Billing & Plan */}
            <Section title="Billing & Plan" icon={<CreditCard className="w-5 h-5 text-pink-600" />}>
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-white border border-gray-200">
                      <Crown className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{form?.plan?.name} Plan</div>
                      <div className="text-sm text-gray-600">{planText}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">Renews on {form?.plan?.renewsOn}</div>
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
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

function Field({ label, icon, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
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
          className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${icon ? "pl-10" : ""
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
        {description && <div className="text-xs text-gray-600 mt-0.5">{description}</div>}
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
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
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