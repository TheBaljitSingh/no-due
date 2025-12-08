import React from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom';

export default function AuthSuccess() {

    const navigate = useNavigate();


    useEffect(()=>{

        const timer = setTimeout(()=>{

            navigate("/no-due");

        },2000);

        return ()=> clearTimeout(timer);

    },[navigate]);


  return (

    <div className="flex flex-col justify-center items-center min-h-screen bg-blue-50 text-gray-800">
      <h2 className="text-4xl font-bold text-green-600 mb-4">Authentication Successful!</h2>
      <p className="text-lg text-gray-500">Redirecting to No-Due page...</p>
      <div className="mt-4 animate-pulse">
        
      </div>
    </div>

    )
}