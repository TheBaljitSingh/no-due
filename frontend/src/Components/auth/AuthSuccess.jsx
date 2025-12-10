import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getGoogleProfile } from "../../utils/service/authService";
import { useAuth } from "../../context/AuthContext";

export default function AuthSuccess() {
  const navigate = useNavigate();
  const { setUser, setIsUserLoggedOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
         //currently there is not profileCoplete
          navigate("/nodue");
        }, 2000);

      } catch (error) {
        console.error("Error fetching Google profile:", error);
        navigate("/");
      }
    }

    fetchProfile(); 
    return ()=>clearTimeout(timer);
  }, [navigate, setUser, setIsUserLoggedOut]);

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
