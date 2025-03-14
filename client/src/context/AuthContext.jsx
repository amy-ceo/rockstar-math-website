import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom"; // Import the useNavigate hook
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [users, setUser] = useState(null);
  const navigate = useNavigate(); // Initialize navigate for redirection

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser)); // ✅ Load user from storage
      navigate("/dashboard"); // Redirect to dashboard if user exists
    }
  }, [navigate]);

 
  const login = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData)); // Save user data to localStorage
    setUser(userData); // Update global state
    navigate("/dashboard"); // ✅ Redirect to dashboard after login
  };
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null); // Reset user state
    navigate("/login"); // Redirect to login page on logout
  };

  return (
    <AuthContext.Provider value={{ users, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
