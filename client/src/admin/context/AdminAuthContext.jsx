import { createContext, useState, useEffect } from "react";

export const AdminAuthContext = createContext();

const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const loggedInAdmin = localStorage.getItem("admin");
    setAdmin(loggedInAdmin ? JSON.parse(loggedInAdmin) : null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, setAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthProvider;
