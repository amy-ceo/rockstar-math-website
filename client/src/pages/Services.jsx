import React, { useEffect, useState, Suspense, lazy, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { toast, Toaster } from "react-hot-toast"; // ✅ FIXED IMPORT
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ✅ Lazy Load Components
const ServiceCard = lazy(() => import("../components/ServiceCard"));

const Services = () => {
  const { users } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // ✅ State to store fetched services
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch products from the backend
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get("https://frontend-production-90a4.up.railway.app/api/stripe/get-products");
        setServices(response.data);
      } catch (error) {
        console.error("❌ Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // ✅ Handle Add to Cart (Fixed Double Toast)
  const handleAddToCart = useCallback((service) => {
    console.log("🔹 handleAddToCart Clicked for Service:", service.name);

    let price = null;
    let currency = "USD";

    // ✅ Extract Price from Service Object
    if (service.price) {
      price = Number(service.price).toFixed(2);
      currency = service.currency ? service.currency.toUpperCase() : "USD";
    }

    if (!price && service.default_price && service.default_price.unit_amount) {
      price = (service.default_price.unit_amount / 100).toFixed(2);
      currency = service.default_price.currency.toUpperCase();
    }

    // ❌ Prevent Adding if Price is Missing
    if (!price || isNaN(price)) {
      console.error("❌ Cannot add service to cart, missing price!", service);
      toast.dismiss();
      toast.error(`⚠️ Cannot add ${service.name} to cart, missing price!`);
      return;
    }

    // ✅ Create a clean cart item
    const newItem = {
      id: service.id,
      name: service.name,
      description: service.description || "",
      images: service.images || [],
      price,
      currency,
    };

    addToCart(newItem); // ✅ Add to Cart

    toast.dismiss(); // ✅ Clear any previous toast
    toast.success(`${service.name} added to cart!`, { id: "cart-toast" });
  }, [addToCart]);

  // ✅ Group Services into Categories
  const categorizedServices = {
    "Seasonal - AP Calc Review": services.filter((service) =>
      /(\bAP Calc Review 20 hours\b)/i.test(service.name)
    ),
    "30 Minute Sessions - *Recommended For Algebra 1 Students And Below*": services.filter(
      (service) =>
        /(\b8 x 30 minutes\b|\b5 x 30 minutes\b|\b3 x 30 minutes\b)/i.test(service.name)
    ),
    "60 Minute Sessions - Standard": services.filter((service) =>
      /(\b8 x 60 minutes\b|\b5 x 60 minutes\b|\b3 x 60 minutes\b)/i.test(service.name)
    ),
    "90 Minute Sessions - *Recommended For Calc 1 Students And Higher*": services.filter(
      (service) =>
        /(\b8 x 90 minutes\b|\b5 x 90 minutes\b|\b3 x 90 minutes\b)/i.test(service.name)
    ),
    "Seasonal - AP Calc 13 Sessions": services.filter((service) =>
      /(\b13 x 30 minutes\b|\b13 x 60 minutes\b|\b13 x 90 minutes\b)/i.test(service.name)
    ),
  };

  return (
    <>
      {/* ✅ Hero Section */}
      <div className="bg-deepBlue py-6 text-white mt-16">
        <h1 className="text-2xl font-bold text-center">Rockstar Math Tutoring Services</h1>
        <p className="text-center">Learn, Excel, Achieve!</p>
      </div>

      {/* ✅ Services List */}
      <div className="container mx-auto p-6 py-20">
        <Toaster position="top-right" /> {/* ✅ Toast Notifications */}

        {/* ✅ Display Services by Category */}
        <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading Services...</div>}>
          {loading ? (
            <p className="text-center py-10 text-gray-500">Fetching services...</p>
          ) : (
            Object.entries(categorizedServices).map(
              ([category, items]) =>
                items.length > 0 && (
                  <div key={category} className="mb-12">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">{category}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.map((service) => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          users={users}
                          handleAddToCart={handleAddToCart}
                        />
                      ))}
                    </div>
                  </div>
                )
            )
          )}
        </Suspense>
      </div>
    </>
  );
};

export default Services;
