import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Facebook, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../utils/service/api';
import { diconnectWhatsapp } from "../../utils/service/authService.js"

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const WhatsappConnectivity = () => {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(user?.whatsapp?.status || 'not_connected');
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        // Load Facebook SDK
        window.fbAsyncInit = function () {
            window.FB.init({
                appId: '25791969630489371', // Replace with your actual Meta App ID
                autoLogAppEvents: true,
                xfbml: true,
                version: 'v24.0'
            });
        };

        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) { return; }
            js = d.createElement(s); js.id = id;
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    }, []);

    // Handle OAuth callback redirect
    useEffect(() => {
        const connected = searchParams.get('connected');
        const errorParam = searchParams.get('error');

        if (connected === 'true') {
            // Success - fetch updated user data
            const fetchUserData = async () => {
                try {
                    //in dev it will log 2 time may be
                    const response = await api.get('/v1/auth/check-auth');
                    if (response.data.success && response.data.data.user) {
                        setUser(response.data.data.user);
                        setStatus('connected');
                    }
                    toast.success('WhatsApp connected successfully!', {
                        position: 'top-right',
                        autoClose: 5000,
                    });
                } catch (error) {
                    console.error('Failed to fetch updated user data:', error);
                    toast.success('WhatsApp connected successfully!', {
                        position: 'top-right',
                        autoClose: 5000,
                    });
                }
                // Clean up URL
                searchParams.delete('connected');
                setSearchParams(searchParams, { replace: true });
            };
            fetchUserData();
        } else if (connected === 'false') {
            // Failure - show error message
            const errorMessage = errorParam
                ? decodeURIComponent(errorParam)
                : 'Failed to connect WhatsApp. Please try again.';

            toast.error(errorMessage, {
                position: 'top-right',
                autoClose: 7000,
            });
            // Clean up URL
            searchParams.delete('connected');
            searchParams.delete('error');
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams, setUser]);

    const launchWhatsAppSignup = () => {
        setLoading(true);

        if (!user || !user._id) {
            alert("User not authenticated properly.");
            setLoading(false);
            return;
        }

        if (!window.FB) {
            alert("Facebook SDK not loaded yet. Please wait and try again.");
            setLoading(false);
            return;
        }

        window.FB.login((response) => {
            (async () => {
                if (!response.authResponse?.code) {
                    console.log("User cancelled login or did not authorize", response);
                    setLoading(false);
                    return;
                }

                const code = response.authResponse.code;

                try {
                    // Redirect to backend callback endpoint
                    // Backend will handle token exchange and redirect back to frontend
                    window.location.href = `${VITE_API_BASE_URL}/api/v1/auth/meta/callback?code=${code}&state=${user._id}`;
                } catch (error) {
                    console.error("Connection failed:", error);
                    toast.error(`Failed to connect WhatsApp: ${error.message}`, {
                        position: 'top-right',
                        autoClose: 5000,
                    });
                    setLoading(false);
                }
            })();
        }, {
            config_id: "771218048783562",
            response_type: "code",
            override_default_response_type: true,
            scope: "business_management,whatsapp_business_management,whatsapp_business_messaging",
            //whatsapp_business_manage_events
            extras: {
                setup: {}
            }
        });
    };





    const [showManual, setShowManual] = useState(false);
    const [manualData, setManualData] = useState({
        wabaId: '',
        phoneNumberId: '',
        accessToken: ''
    });

    const handleManualConnect = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/v1/whatsapp/manual-connect', manualData);
            if (res.data.success) {
                // Fetch updated user data
                try {
                    const userResponse = await api.get('/v1/auth/check-auth');
                    if (userResponse.data.success && userResponse.data.data.user) {
                        setUser(userResponse.data.data.user);
                    }
                } catch (error) {
                    console.error('Failed to fetch updated user data:', error);
                }

                setStatus('connected');
                toast.success('WhatsApp connected successfully (Manual Mode)! 🎉', {
                    position: 'top-right',
                    autoClose: 5000,
                });
                setShowManual(false);
            }
        } catch (error) {
            console.error("Manual connect failed", error);
            toast.error(`Failed to connect: ${error.response?.data?.message || error.message}`, {
                position: 'top-right',
                autoClose: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        // Confirmation dialog
        const confirmed = window.confirm(
            'Are you sure you want to disconnect your WhatsApp Business Account? This will stop all automated reminders and messages.'
        );

        if (!confirmed) return;

        setLoading(true);
        try {
            const res = await diconnectWhatsapp();
            if (res.success) {
                // Fetch updated user data
                try {
                    const userResponse = await api.get('/v1/auth/check-auth');
                    if (userResponse.data.success && userResponse.data.data.user) {
                        setUser(userResponse.data.data.user);
                    }
                } catch (error) {
                    console.error('Failed to fetch updated user data:', error);
                }

                setStatus('not_connected');
                toast.success('WhatsApp disconnected successfully', {
                    position: 'top-right',
                    autoClose: 5000,
                });
            }
        } catch (error) {
            console.error("Disconnect failed", error);
            toast.error(`Failed to disconnect: ${error.response?.data?.message || error.message}`, {
                position: 'top-right',
                autoClose: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">WhatsApp Connectivity</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Connection Status</h2>
                        <p className="text-sm text-gray-500">Manage your WhatsApp Business Account connection</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {status === 'connected' ? 'Connected' : 'Not Connected'}
                    </div>
                </div>

                {status === 'not_connected' ? (
                    <div className="text-center py-10">
                        {!showManual ? (
                            <>
                                <div className="mb-6">
                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Facebook className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h3 className="text-md font-medium text-gray-900 mb-2">Connect your Business Account</h3>
                                    <p className="text-sm text-gray-500 max-w-sm mx-auto">
                                        Link your Meta WhatsApp Business Account to start sending automated reminders and templates.
                                    </p>
                                </div>

                                <button
                                    onClick={launchWhatsAppSignup}
                                    disabled={loading}
                                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Connecting...' : 'Connect with Facebook'}
                                </button>

                                <div className="mt-6">
                                    <button
                                        onClick={() => setShowManual(true)}
                                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                                    >
                                        I have my credentials (Developer Mode)
                                    </button>
                                </div>
                            </>
                        ) : (
                            <form onSubmit={handleManualConnect} className="max-w-md mx-auto text-left space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">WABA ID</label>
                                    <input
                                        type="text"
                                        required
                                        value={manualData.wabaId}
                                        onChange={e => setManualData({ ...manualData, wabaId: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone Number ID</label>
                                    <input
                                        type="text"
                                        required
                                        value={manualData.phoneNumberId}
                                        onChange={e => setManualData({ ...manualData, phoneNumberId: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Permanent Access Token</label>
                                    <input
                                        type="password"
                                        required
                                        value={manualData.accessToken}
                                        onChange={e => setManualData({ ...manualData, accessToken: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowManual(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                                    >
                                        {loading ? 'Saving...' : 'Save Credentials'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                ) : (
                    <div className="border-t border-gray-100 pt-6">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Provider</dt>
                                <dd className="mt-1 text-sm text-gray-900">Meta (Cloud API) {user?.whatsapp?.provider === 'manual' && '(Manual)'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">WABA ID</dt>
                                <dd className="mt-1 text-sm text-gray-900">{user?.whatsapp?.wabaId || '•••••••••'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Phone Number ID</dt>
                                <dd className="mt-1 text-sm text-gray-900">{user?.whatsapp?.phoneNumberId || '•••••••••'}</dd>
                            </div>
                        </dl>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleDisconnect}
                                disabled={loading}
                                className="text-red-600 text-sm hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Disconnecting...' : 'Disconnect Account'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsappConnectivity;
