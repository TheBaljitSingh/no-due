import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSearchParams } from "react-router-dom";

import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Users,
  Clock,
  Loader2,
  Eye,
  EyeOff,
  X,
  AlertTriangle,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import api from "../../utils/service/api";

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const WhatsAppSetupOverlay = ({ onClose, isRouteBlocked = false }) => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const [manualData, setManualData] = useState({
    wabaId: "",
    phoneNumberId: "",
    accessToken: "",
  });

  // Load Facebook SDK
  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: "25791969630489371",
        autoLogAppEvents: true,
        xfbml: true,
        version: "v24.0",
      });
    };

    (function (d, s, id) {
      var js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const connected = searchParams.get("connected");
    const errorParam = searchParams.get("error");

    if (connected === "true") {
      const fetchUserData = async () => {
        try {
          const response = await api.get("/v1/auth/check-auth");
          if (response.data.success && response.data.data.user) {
            setUser(response.data.data.user);
            toast.success("WhatsApp connected successfully!", {
              position: "top-right",
              autoClose: 3000,
            });
            onClose?.();
          }
        } catch (error) {
          console.error("Failed to fetch updated user data:", error);
        }
        searchParams.delete("connected");
        setSearchParams(searchParams, { replace: true });
      };
      fetchUserData();
    } else if (connected === "false") {
      const errorMessage = errorParam
        ? decodeURIComponent(errorParam)
        : "Failed to connect WhatsApp. Please try again.";
      toast.error(errorMessage, { position: "top-right", autoClose: 7000 });
      searchParams.delete("connected");
      searchParams.delete("error");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, setUser, onClose]);

  const launchWhatsAppSignup = () => {
    setLoading(true);

    if (!user || !user._id) {
      toast.error("User not authenticated properly.");
      setLoading(false);
      return;
    }

    if (!window.FB) {
      toast.error("Facebook SDK not loaded yet. Please wait and try again.");
      setLoading(false);
      return;
    }

    window.FB.login(
      (response) => {
        (async () => {
          if (!response.authResponse?.code) {
            console.log("User cancelled login or did not authorize", response);
            setLoading(false);
            return;
          }

          try {
            const code = response.authResponse.code;
            window.location.href = `${VITE_API_BASE_URL}/api/v1/auth/meta/callback?code=${code}&state=${user._id}`;
          } catch (error) {
            console.error("Connection failed:", error);
            toast.error(`Failed to connect WhatsApp: ${error.message}`);
            setLoading(false);
          }
        })();
      },
      {
        config_id: "771218048783562",
        response_type: "code",
        override_default_response_type: true,
        scope:
          "business_management,whatsapp_business_management,whatsapp_business_messaging",
        extras: { setup: {} },
      },
    );
  };

  const handleManualConnect = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/v1/whatsapp/manual-connect", manualData);
      if (res.data.success) {
        const userResponse = await api.get("/v1/auth/check-auth");
        if (userResponse.data.success && userResponse.data.data.user) {
          setUser(userResponse.data.data.user);
        }
        toast.success("WhatsApp connected successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        onClose?.();
      }
    } catch (error) {
      console.error("Manual connect failed", error);
      toast.error(
        `Failed to connect: ${error.response?.data?.message || error.message}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop — blurred */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={isRouteBlocked ? undefined : onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-lg mx-4"
        >
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                    <FaWhatsapp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      Connect WhatsApp Business
                    </h2>
                    <p className="text-sm text-gray-600">
                      {isRouteBlocked
                        ? "Required to access reminders"
                        : "Required to send payment reminders"}
                    </p>
                  </div>
                </div>
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Route-blocked warning */}
            {isRouteBlocked && (
              <div className="mx-6 mt-4 flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  You need to connect your Meta WhatsApp Business Account before
                  you can manage or send reminders.
                </p>
              </div>
            )}

            {/* Body */}
            <div className="p-6">
              {!showManual ? (
                <div className="space-y-5">
                  {/* Why connect — info cards */}
                  <div className="space-y-2">
                    {[
                      {
                        icon: MessageSquare,
                        text: "Automated payment reminders via WhatsApp",
                      },
                      {
                        icon: Users,
                        text: "Customer tracking and due management",
                      },
                      {
                        icon: Clock,
                        text: "Scheduled reminders with templates",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100"
                      >
                        <item.icon className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="text-sm text-gray-700">
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Primary CTA */}
                  <button
                    id="whatsapp-connect-btn"
                    onClick={launchWhatsAppSignup}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <FaWhatsapp className="w-4 h-4" />
                        Connect with Facebook
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-gray-500">
                        or connect manually
                      </span>
                    </div>
                  </div>

                  {/* Secondary CTA */}
                  <button
                    onClick={() => setShowManual(true)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    I have my credentials (Developer Mode)
                  </button>
                </div>
              ) : (
                <form onSubmit={handleManualConnect} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WABA ID
                    </label>
                    <input
                      id="manual-waba-id"
                      type="text"
                      required
                      placeholder="e.g. 123456789012345"
                      value={manualData.wabaId}
                      onChange={(e) =>
                        setManualData({ ...manualData, wabaId: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number ID
                    </label>
                    <input
                      id="manual-phone-id"
                      type="text"
                      required
                      placeholder="e.g. 109876543210987"
                      value={manualData.phoneNumberId}
                      onChange={(e) =>
                        setManualData({
                          ...manualData,
                          phoneNumberId: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permanent Access Token
                    </label>
                    <div className="relative">
                      <input
                        id="manual-access-token"
                        type={showToken ? "text" : "password"}
                        required
                        placeholder="EAAxxxxxxx..."
                        value={manualData.accessToken}
                        onChange={(e) =>
                          setManualData({
                            ...manualData,
                            accessToken: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showToken ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowManual(false)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Connect"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                Secure connection via Meta Business Platform &middot; Your
                credentials are encrypted
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WhatsAppSetupOverlay;
