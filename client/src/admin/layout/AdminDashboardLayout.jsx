
import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";

const AdminDashboardLayout
 = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = true; // Backend se auth check karna hoga
    if (!isAdmin) {
      navigate("/login"); // Unauthorized users ko login pe redirect karna
    }
  }, []);

  return (
    <div className="flex ">
      <AdminSidebar />
      <div className="flex-1">
        <AdminHeader />
        <main className="">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout
;
