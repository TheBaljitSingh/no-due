import React from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { getGoogleProfile } from '../../utils/service/authService';
import { useUser } from '../../contexts/UserContext';

export default function AuthSuccess() {


    const navigate = useNavigate();
    const {user,setUser,setIsUserLoggedOut}=useUser();


   useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await getGoogleProfile();
        console.log("Google Profile Data:", data);
      localStorage.setItem('isUserLoggedIn', 'true');
        setIsUserLoggedOut(false);
        setUser(data.user);

        navigate("/nodue");
      } catch (error) {
        console.error("Error fetching Google profile:", error);
        navigate("/");
      }
    }

    fetchProfile();
  }, [navigate]);



  return (

    <div className="flex flex-col justify-center items-center min-h-screen bg-blue-50 text-gray-800">
      <h2 className="text-4xl font-bold text-green-600 mb-4">Authentication Successful!</h2>
      <p className="text-lg text-gray-500">Redirecting to No-Due page...</p>
      <div className="mt-4 animate-pulse">
        
      </div>
    </div>

    )
}