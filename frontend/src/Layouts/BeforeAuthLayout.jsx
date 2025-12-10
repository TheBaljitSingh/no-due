import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../Components/Navbar/Navbar";
import Footer from "../Components/Footer/Footer";
import { use, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function BeforeAuthLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const {user} = useAuth();

  console.log(user);

  useEffect(() => {
    if(user){
      navigate('/nodue/customer-master'); //forcing logged in user to view dashboard
    }
  }, [user,location.pathname,navigate]);

  return (
    <div className={`min-h-screen flex flex-col ${location.pathname === '/' && 'backgroundone'}`}>   
      <Navbar/>
      <main className="flex-1 min-h-screen"> 

        {(!user || location.pathname === "google-success")?

          <Outlet />
          :
          null 
         }
      </main>
      <Footer />                                  
    </div>
  );
}
