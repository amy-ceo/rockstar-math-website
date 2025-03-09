import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // ✅ Load user from localStorage on app startup
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser)); // ✅ Load user into state
    }
  }, []);

  // ✅ Listen for `storage` events (Triggered when localStorage updates)
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem("user");
      if (updatedUser) {
        setUser(JSON.parse(updatedUser)); // ✅ Update user state if localStorage changes
      } else {
        setUser(null); // ✅ If no user found, logout
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ✅ Login function (Saves user to localStorage & updates state)
  const login = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData); // ✅ Update global state
  };

  // ✅ Logout function (Clears user data)
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null); // ✅ Reset user state
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Custom Hook for Easy Access to AuthContext
export const useAuth = () => useContext(AuthContext);
