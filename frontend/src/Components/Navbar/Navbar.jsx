// Navbar.jsx
import React, { useState, useCallback, useEffect } from "react";
import logo from "../../assets/logo.png";
import LoginModal from "../LoginModal/LoginModal";
import { href, Link, useNavigate, useLocation } from "react-router-dom";
import { registerUser } from "../../utils/service/userService";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import logger from "../../utils/logger.js";


const links = [
  { href: "/",     label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#pricing",  label: "Pricing" },
  { href: "#contact",  label: "Contact" },
];

const NAV_HEIGHT_PX = 64; // your sticky header height (h-16 => 64px)

const Navbar = ({setIsLoggedIn}) => {
  const [open, setOpen] = useState(false);

  const [openLogin , setOpenLogin] = useState(false);

  const navigate = useNavigate();
  const {login, register} = useAuth();


  const location = useLocation();

  useEffect(()=>{
    //this is very important usecase of useLocation state
    if(location?.state?.openLogin){
      logger.log(location.state);
      setOpenLogin(true);
    }

    navigate(location.pathname, {replace:true, state:null});
  },[]);


  const handleNavClick = useCallback((e, href) => {
    if (!href) return;

    // handle hash links on the same page
    if (href.startsWith("#")) {
      e.preventDefault();

      if (href === "#contact") {
        navigate("/contact");   
        setOpen(false);
        return;
      }

      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      setOpen(false);
      return;
    }

    // normal route (non-hash) links
    navigate(href);
    setOpen(false);
  }, [navigate]);

  const handleLogin = async (data) => {
  if (data.type === 'signup') {
    //SIGNUP FORM
    const filteredData = {
      name: `${data.firstName}${data.lastName}`,
      email: data.email,
      password: data.password
    };

    try {
      const response = await register(filteredData);
      console.log(response);
      if(!response.data.success){
        toast.error("Signup failed");
        return;
      }
      toast.success("Signup Successfully");
    } catch (error) {
      toast.error(error.response?.data?.errors[0] || error.response?.data?.message || "Signup failed");
    }

  } else {
    // LOGIN FLOW
    try {
      const response = await login(data);

      if (!response.data.success) {
        toast.error("Login failed");
        return;
      }

      toast.success("Login successful");

      setTimeout(() => navigate("/nodue"), 1500);

    } catch (error) {
      logger.log(error);

      toast.error(error.response?.data?.errors[0] || error.response?.data?.message || "Invalid credentials");
    }
  }
};


  return (
    <header className="sticky top-0 z-50 py-4 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 ">
      <nav className="mx-auto px-4 sm:px-6 lg:px-14">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a
            href="#home"
            onClick={(e) => handleNavClick(e, "#home")}
            className="inline-flex items-center gap-3"
          >
            <img
              src={logo}
              alt="NODUE logo"
              className="h-28 w-auto rounded-sm"
              loading="eager"
              decoding="async"
            />
            <span className="sr-only">NODUE</span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center font-extrabold gap-8">
            <ul className="flex items-center gap-6">
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={(e) => handleNavClick(e, l.href) }
                    className="text-md font-medium text-gyay-950 hover:text-slate-600 transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>


           <button onClick={() => setOpenLogin(true)} className="inline-flex mr-1 cursor-pointer items-center rounded-full text-transparent bg-clip-text font-[font3] border-teal-400 border-2 py-2 px-3 bg-gradient-to-r from-blue-400 to-teal-600 p-[2px] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
                Login
            </button>

              <LoginModal
                open={openLogin}
                onClose={() => setOpenLogin(false)}
                setIsLoggedIn={setIsLoggedIn}
                onSubmit={handleLogin}
               />
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {open ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>

        {/* Mobile panel */}
        {open && (
          <div className="md:hidden pb-4">
            <ul className="space-y-2 pt-2">
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={(e) => handleNavClick(e, l.href)}
                    className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="pt-3">
              {/* <a
                href="#contact"
                onClick={(e) => handleNavClick(e, "#contact")}
                className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-blue-400 to-teal-600 p-[2px]"
              > */}
                <button onClick={() => setOpenLogin(true)} className="inline-flex  mr-1 cursor-pointer items-center rounded-full text-transparent bg-clip-text font-[font3] border-teal-400 border-2 py-2 px-3 bg-gradient-to-r from-blue-400 to-teal-600 p-[2px] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
                Login
                </button>

                <LoginModal
                  open={openLogin}
                  onClose={() => setOpenLogin(false)}
                  setIsLoggedIn={setIsLoggedIn}
                  onSubmit={(creds) => {
                  logger.log("Login with:", creds);
                  // TODO: call your API; on success:
                  setOpenLogin(false);
                  }}
                />
              {/* </a> */}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
