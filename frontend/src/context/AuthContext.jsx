import { createContext, useContext, useState, useEffect } from "react";
import { toast } from 'react-toastify';
import api from "../utils/service/api.js";
import { checkAuth } from "../utils/service/authService.js";


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUserLoggedOut,setIsUserLoggedOut] = useState(true);




    const fetchUser = async () => {
        try {
            const response = await checkAuth();
             console.log("Auth Check Response:", response);
            if(response.status === 200){
                setUser(response.data.user);
            }
        } catch (err) {
            // toast.error(err?.message)
            console.error("Error checking Auth:",err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const hasLoggedIn = localStorage.getItem('isUserLoggedIn') === 'true';

        if(!user && hasLoggedIn){
            fetchUser();
        }else{
            setLoading(false); // have to check this from my side

        }

        // if(user){
        //     setIsUserLoggedOut(false);
        // }
        fetchUser();
    }, []);

// 
    const login = async (credentials) => {
        const response = await api.post("/v1/auth/login", credentials);
        await fetchUser(); // refresh user after login
        return response;
    };

    const register = async (data)=>{
        console.log("register is calling from context");
        
        const response = await api.post("/v1/auth/register", data);

        console.log(response);

        return response;

    }

    const logout = async () => {
        await api.get("/v1/auth/logout", {}, { withCredentials: true });
        setUser(null);
    };


    const value = { user, register, login, logout, loading, setUser, isUserLoggedOut, setIsUserLoggedOut };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);