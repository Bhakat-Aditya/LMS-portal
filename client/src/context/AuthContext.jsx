// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import api from "./axiosInstance";

// Create the context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if a token exists when the app first loads
  useEffect(() => {
    const storedUser = localStorage.getItem("lms_user");
    const storedToken = localStorage.getItem("lms_token");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      // Attach token to all future Axios requests automatically!
      api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem("lms_user", JSON.stringify(userData));
    localStorage.setItem("lms_token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("lms_user");
    localStorage.removeItem("lms_token");
    delete api.defaults.headers.common["Authorization"];
  };

  // Called after a successful payment to pull fresh user data
  // (including the newly added courseId in purchasedCourses)
  const refreshUser = async () => {
    try {
      const response = await api.get("/users/profile");
      const freshUser = response.data;
      setUser(freshUser);
      localStorage.setItem("lms_user", JSON.stringify(freshUser));
    } catch (error) {
      console.error("Failed to refresh user profile:", error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
