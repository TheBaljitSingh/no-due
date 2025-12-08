import React, { useEffect, useMemo, useRef, useState } from "react";
import { User, Mail, Phone, Building2, MapPin, Globe, Shield, Lock, Eye, EyeOff, Camera, Trash2, Save, Bell, Crown, CreditCard, QrCode, LogOut, CheckCircle2, Download } from "lucide-react";

//


// const MOCK_USER = {
//   name: "Tanmay Shah",
//   email: "tanmay@example.com",
//   phone: "+91 99999 99999",
//   company: "Insansa Techknowledge Pvt Ltd",
//   gst: "27ABCDE1234F1Z5",
//   website: "https://insansa.com",
//   country: "India",
//   state: "Rajasthan",
//   city: "Udaipur",
//   pincode: "313001",
//   address: "24, Lakeview Park",
//   locale: "en-IN",
//   timezone: "Asia/Kolkata",
//   plan: { name: "Growth", price: 999, renewsOn: "2025-11-01" },
// };

const MOCK_INVOICES = [
  { id: "INV-1008", date: "2025-10-01", amount: 499, status: "Paid" },
  { id: "INV-1007", date: "2025-09-01", amount: 499, status: "Paid" },
];

export default function UserProfile() {
  // const [user, setUser] = useState(null); // Fetch from API
  const {user} = useAuth();
  const [form, setForm] = useState(user);

  useEffect(()=>{
    if(user) {
      setForm((prev)=>({
        ...prev,
        ...user,
        plan :{ name: "Growth", price: 999, renewsOn: "2025-11-01" }, //taking dummy data  
      }));
    }
  },[user])


  const [avatarUrl, setAvatarUrl] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [notif, setNotif] = useState({ whatsapp: true, email: true, voice: false, product: true });
  const fileRef = useRef(null);

  const planText = useMemo(() => (form?.plan?.price === 0 ? "Free" : `₹${form?.plan?.price}/mo`), [form?.plan]);

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const onAvatar = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setAvatarUrl(url);
  };

  const saveProfile = () => {
    alert("Profile saved (mock)");
  };
  
  const saveSecurity = () => {
    if (!pwd.current || !pwd.next || !pwd.confirm) return alert("Fill all password fields");
    if (pwd.next !== pwd.confirm) return alert("Passwords do not match");
    alert("Password changed (mock)");
    setPwd({ current: "", next: "", confirm: "" });
  };

  // useEffect(()=>{
  //   console.log(form);
  // },[])
 
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
            {/* <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <LogOut className="w-4 h-4"/> Sign out
              </button>
            </div> */}
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
                <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 overflow-hidden flex items-center justify-center shadow-lg">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover"/>
                  ) : (
                    <User className="w-10 h-10 text-gray-400"/>
                  )}
                </div>
                <button 
                  onClick={() => fileRef.current?.click()} 
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
                >
                  <Camera className="w-4 h-4"/>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatar}/>
              </div>
              <div className="flex-1 pt-4">
                <h2 className="text-2xl font-semibold text-gray-100">{form?.name || "—"}</h2>
                <p className="text-gray-600">{form?.email}</p>
                <p className="text-sm text-gray-500">{form?.phone}</p>
              </div>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg px-4 py-3">
                  <Crown className="w-5 h-5 text-amber-600"/>
                  <div>
                    <div className="text-xs font-medium text-amber-900">Current Plan</div>
                    <div className="text-sm font-semibold text-amber-900">{form?.plan?.name } · {planText}</div>
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
            <Section title="Personal Information" icon={<User className="w-5 h-5 text-blue-600"/>}>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field 
                  label="Full Name" 
                  icon={<User className='w-4 h-4'/>} 
                  value={form?.name} 
                  onChange={(v)=>onChange('name', v)} 
                  placeholder="Enter your full name"
                />
                <Field 
                  label="Email Address" 
                  icon={<Mail className='w-4 h-4'/>} 
                  value={form?.email} 
                  onChange={(v)=>onChange('email', v)} 
                  placeholder="you@company.com"
                />
                <Field 
                  label="Phone Number" 
                  icon={<Phone className='w-4 h-4'/>} 
                  value={form?.phone} 
                  onChange={(v)=>onChange('phone', v)} 
                  placeholder="+91 XXXXX XXXXX"
                />
                <Field 
                  label="Website" 
                  icon={<Globe className='w-4 h-4'/>} 
                  value={form?.website} 
                  onChange={(v)=>onChange('website', v)} 
                  placeholder="https://example.com"
                />
              </div>
            </Section>

            {/* Organization Details */}
            <Section title="Organization Details" icon={<Building2 className="w-5 h-5 text-purple-600"/>}>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field 
                  label="Company Name" 
                  icon={<Building2 className='w-4 h-4'/>} 
                  value={form?.companyName} 
                  onChange={(v)=>onChange('company', v)} 
                  placeholder="Your company name"
                />
                <Field 
                  label="GST Number" 
                  icon={<CreditCard className='w-4 h-4'/>} 
                  value={form?.GSTNumber} 
                  onChange={(v)=>onChange('gst', v)} 
                  placeholder="27ABCDE1234F1Z5"
                />
              </div>
            </Section>

            {/* Address & Location */}
            <Section title="Address & Location" icon={<MapPin className="w-5 h-5 text-green-600"/>}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field 
                    label="Street Address" 
                    icon={<MapPin className='w-4 h-4'/>} 
                    value={form?.address?.street} 
                    onChange={(v)=>onChange('address', v)} 
                    placeholder="Street, Area, Landmark"
                  />
                </div>
                <Field 
                  label="City" 
                  value={form?.address?.city} 
                  onChange={(v)=>onChange('city', v)} 
                  placeholder="City"
                />
                <Field 
                  label="State" 
                  value={form?.address?.state} 
                  onChange={(v)=>onChange('state', v)} 
                  placeholder="State"
                />
                <Field 
                  label="PIN Code" 
                  value={form?.address?.pinCode} 
                  onChange={(v)=>onChange('pincode', v)} 
                  placeholder="000000"
                />
                <Field 
                  label="Country" 
                  value={form?.address?.country} 
                  onChange={(v)=>onChange('country', v)} 
                  placeholder="Country"
                />
              </div>
            </Section>

            {/* Regional Settings */}
            <Section title="Regional Settings" icon={<Globe className="w-5 h-5 text-orange-600"/>}>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field 
                  label="Timezone" 
                  value={form?.timezone} 
                  onChange={(v)=>onChange('timezone', v)} 
                  placeholder="Asia/Kolkata"
                />
                <Field 
                  label="Language & Locale" 
                  value={form?.address?.country} //locale 
                  onChange={(v)=>onChange('locale', v)} 
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
                <Save className="w-4 h-4"/> Save Changes
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
            <Section title="Security" icon={<Shield className="w-5 h-5 text-red-600"/>}>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Change Password</h4>
                  <div className="space-y-3">
                    <PwField 
                      label="Current Password" 
                      value={pwd.current} 
                      onChange={(v)=>setPwd((s)=>({...s, current:v}))} 
                      show={showPw} 
                      setShow={setShowPw}
                    />
                    <PwField 
                      label="New Password" 
                      value={pwd.next} 
                      onChange={(v)=>setPwd((s)=>({...s, next:v}))} 
                      show={showPw} 
                      setShow={setShowPw}
                    />
                    <PwField 
                      label="Confirm New Password" 
                      value={pwd.confirm} 
                      onChange={(v)=>setPwd((s)=>({...s, confirm:v}))} 
                      show={showPw} 
                      setShow={setShowPw}
                    />
                    <button 
                      onClick={saveSecurity} 
                      className="w-full bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                      Update Password
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
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        twoFA 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-gray-50 text-gray-700 border-gray-200"
                      }`}>
                        {twoFA ? <CheckCircle2 className="w-3 h-3"/> : null}
                        {twoFA ? "Enabled" : "Disabled"}
                      </span>
                      <button 
                        onClick={()=>setTwoFA(v=>!v)} 
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        {twoFA ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>

                  {twoFA && (
                    <div className="mt-4 rounded-lg border border-gray-200 p-4 bg-gray-50">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3">
                        <QrCode className="w-4 h-4"/> Scan QR Code
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

            {/* Billing & Invoices */}
            <Section title="Billing & Invoices" icon={<CreditCard className="w-5 h-5 text-pink-600"/>}>
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-white border border-gray-200">
                      <Crown className="w-5 h-5 text-blue-600"/>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{form?.plan?.name} Plan</div>
                      <div className="text-sm text-gray-600">{planText}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mb-3">Renews on {form?.plan?.renewsOn}</div>
                  {/* <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                    Upgrade Plan
                  </button> */}
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Recent Invoices</h4>
                  <div className="space-y-2">
                    {MOCK_INVOICES.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{inv.id}</div>
                          <div className="text-xs text-gray-600">
                            {new Date(inv.date).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">₹{inv.amount}</div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            {inv.status}
                          </span>
                        </div>
                        <button className="ml-3 p-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors">
                          <Download className="w-4 h-4 text-gray-600"/>
                        </button>
                      </div>
                    ))}
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
          onChange={(e)=>onChange?.(e.target.value)}
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
        {description && <div className="text-xs text-gray-600 mt-0.5">{description}</div>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer ml-4">
        <input 
          type="checkbox" 
          className="sr-only peer" 
          checked={!!checked} 
          onChange={(e)=>onChange?.(e.target.checked)} 
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
}

function PwField({ label, value, onChange, show, setShow }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e)=>onChange?.(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        <button 
          type="button" 
          onClick={()=>setShow?.(v=>!v)} 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
        </button>
      </div>
    </div>
  );
}