import { createContext, useContext, useState, useEffect } from "react";
import { toast } from 'react-toastify';
import api from "../utils/service/api.js";
import { checkAuth } from "../utils/service/authService.js";


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUserLoggedOut, setIsUserLoggedOut] = useState(true);

    useEffect(() => {
        if (user) {
            setIsUserLoggedOut(false);
        } else {
            setIsUserLoggedOut(true);
        }
    }, [user]);




    const fetchUser = async () => {
        try {
            const response = await checkAuth();
            console.log("Auth Check Response:", response);
            if (response.status === 200) {
                setUser(response.data.user);
            }
        } catch (err) {
            // toast.error(err?.message)
            console.error("Error checking Auth:", err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const hasLoggedIn = localStorage.getItem('isUserLoggedIn') === 'true';

        if (hasLoggedIn) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const value = { user, loading, setUser, isUserLoggedOut, setIsUserLoggedOut };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);