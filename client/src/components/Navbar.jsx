// src/components/Navbar.jsx
import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login"); // Send them back to login after logging out
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-50">
      {/* Brand Logo / Home Link */}
      <Link to="/" className="text-2xl font-black tracking-tight text-gray-900">
        Corporate<span className="text-blue-600">LMS</span>
      </Link>

      {/* Dynamic Navigation Links */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="hidden md:block text-gray-700 font-medium">
              Hi, {user.name}
            </span>

            {/* RBAC: Only teachers see this link */}
            {user.role === "teacher" && (
              <Link
                to="/teacher/dashboard"
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Teacher Dashboard
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="bg-red-50 text-red-600 text-sm font-bold px-4 py-2 rounded hover:bg-red-100 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="bg-black text-white text-sm font-bold px-5 py-2 rounded hover:bg-gray-800 transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
