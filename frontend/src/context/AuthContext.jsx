import { createContext, useContext, useState, useEffect } from "react";
import { toast } from 'react-toastify';
import api from "../utils/service/api.js";


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);


    const fetchUser = async () => {
        try {
            const {data}  = await api.get("/api/v1/auth/me"); // backend route to return user info
            setUser(data.user);
        } catch (err) {
            // toast.error(err?.message)
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);


    const login = async (credentials) => {
        const response = await api.post("/api/v1/auth/login", credentials);
        await fetchUser(); // refresh user after login
        return response;
    };

    const register = async (data)=>{
        console.log("register is calling from context");
        
        const response = await api.post("/api/v1/auth/register", data);

        console.log(response);

        return response;

    }

    const logout = async () => {
        await api.post("/api/v1/auth/logout", {}, { withCredentials: true });
        setUser(null);
    };


    const value = { user, register, login, logout, loading };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);