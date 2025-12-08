import axios from "axios";
import { useEffect } from "react";

export default function GoogleLoginBtn() {

  
   const handleGoogleLogin = async(e) => {
    console.log("clicked on google auth");
    e.preventDefault();
    const VITE_API_URL = "http://localhost:8000";
    window.location.href = `http://localhost:8000/api/v1/auth/google-login`;
  };



  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2 px-4 hover:bg-gray-100 transition"
    >
      <img
        src="https://developers.google.com/identity/images/g-logo.png"
        alt="Google"
        className="w-5 h-5"
      />
      <span className="text-gray-700 font-medium hover:cursor-pointer">Sign in with Google</span>
    </button>
  );
}