import React from 'react'
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../utils/service/authService';
import { useAuth } from '../../context/AuthContext';

const LogoutModal = ({ setShowLogoutModal }) => {
  const { setUser, setIsUserLoggedOut } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {

    const response = await logoutUser();
    if (response.status == 200) {
      setIsUserLoggedOut(true);
      setUser(null);
      setShowLogoutModal(false);
      localStorage.removeItem('hasLoggedIn');
      localStorage.setItem("isUserLoggedIn",false);

    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600/50 ">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6 text-center">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Confirm Logout</h2>
        <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setShowLogoutModal(false)}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default LogoutModal