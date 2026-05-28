import { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Night Mode state & persistence
  const [theme, setTheme] = useState(localStorage.getItem("lms_theme") || "light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("lms_theme", nextTheme);
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate("/login");
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 px-4 md:px-8 py-4 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Brand Logo / Home Link */}
        <Link to="/" onClick={handleLinkClick} className="text-2xl font-black tracking-tight text-gray-900 dark:text-gray-100 select-none">
          LMS<span className="text-blue-600">Portal</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          {/* Night Mode Switcher (Always Visible for All Visitors) */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Night Mode"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            className="p-2 rounded-lg bg-gray-50 hover:bg-gray-150 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer select-none"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          {user ? (
            <>
              <span className="text-gray-700 dark:text-gray-300 text-sm font-semibold">
                Hi, {user.name}
              </span>

              <Link
                to="/notice-board"
                className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Notice Board
              </Link>

              {user.role === "teacher" && (
                <>
                  <Link
                    to="/teacher/dashboard"
                    className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Teacher Dashboard
                  </Link>
                  <Link
                    to="/teacher/students"
                    className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    All Students
                  </Link>
                </>
              )}

              <button
                onClick={handleLogout}
                className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 border border-transparent dark:border-red-900/30 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-black dark:bg-white text-white dark:text-black text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Drawer Trigger */}
        <div className="flex md:hidden items-center gap-3">
          {user && (
            <span className="text-gray-700 dark:text-gray-300 text-xs font-bold truncate max-w-[120px]">
              {user.name.split(" ")[0]}
            </span>
          )}

          {/* Quick theme switcher for mobile next to hamburger */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Night Mode"
            className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer select-none text-xs"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Menu"
            className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none transition-colors p-1 cursor-pointer"
          >
            {isOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu Dropdown */}
      <div
        className={`absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg px-6 py-5 flex flex-col gap-4 md:hidden transition-all duration-300 ease-out origin-top z-40 ${
          isOpen ? "opacity-100 scale-y-100 pointer-events-auto" : "opacity-0 scale-y-95 pointer-events-none"
        }`}
      >
        {user ? (
          <>
            <div className="border-b dark:border-gray-800 pb-3 mb-1">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider">Logged In As</p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-0.5">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">{user.email}</p>
            </div>

            <div className="flex flex-col gap-3 mb-1">
              <Link
                to="/notice-board"
                onClick={handleLinkClick}
                className="text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50 dark:bg-gray-950/60 hover:bg-blue-50 dark:hover:bg-blue-950/20 px-3 py-2.5 rounded-lg transition-all flex items-center gap-2"
              >
                <span>📢</span> Notice Board
              </Link>
            </div>

            {user.role === "teacher" && (
              <div className="flex flex-col gap-3">
                <Link
                  to="/teacher/dashboard"
                  onClick={handleLinkClick}
                  className="text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50 dark:bg-gray-950/60 hover:bg-blue-50 dark:hover:bg-blue-950/20 px-3 py-2.5 rounded-lg transition-all flex items-center gap-2"
                >
                  <span>👨‍🏫</span> Teacher Dashboard
                </Link>
                <Link
                  to="/teacher/students"
                  onClick={handleLinkClick}
                  className="text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-gray-50 dark:bg-gray-950/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 px-3 py-2.5 rounded-lg transition-all flex items-center gap-2"
                >
                  <span>👥</span> All Students
                </Link>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="w-full text-center bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm font-extrabold py-3 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/40 border border-transparent dark:border-red-900/30 transition-colors mt-2 cursor-pointer"
            >
              Log Out
            </button>
          </>
        ) : (
          <Link
            to="/login"
            onClick={handleLinkClick}
            className="w-full text-center bg-black dark:bg-white text-white dark:text-black text-sm font-extrabold py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Sign In to Account
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
