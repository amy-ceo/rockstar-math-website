import React, { useEffect, useState, Suspense, lazy, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";

// ✅ Lazy Load Components
const ServiceCard = lazy(() => import("../components/ServiceCard"));

const Services = () => {
  const { users } = useAuth();
  const { addToCart } = useCart();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Function to Assign Ribbon Text and Color
  const getRibbonDetails = (serviceName) => {
    const ribbonMapping = {
      "8 x 60 minutes": { text: "🔥 Best Value", color: "bg-red-600" },
      "5 x 60 minutes": { text: "⭐ Most Popular", color: "bg-blue-600" },
      "3 x 60 minutes": { text: "💡 Great Choice", color: "bg-green-600" },
      "AP Calc - 20 Hours": { text: "📚 AP Exam Prep", color: "bg-yellow-500" },
      "Common Core-Parents": { text: "🎉 Parents' Choice", color: "bg-purple-600" },
      "8 x 30 minutes": { text: "🔥 Best Value", color: "bg-red-600" },
      "5 - 30 minutes": { text: "⭐ Most Popular", color: "bg-blue-600" },
      "3 x 30 minutes": { text: "💡 Great Choice", color: "bg-green-600" },
      "8 x 90 minutes": { text: "📚 AP Exam Prep", color: "bg-yellow-500" },
      "5 x 90 minutes": { text: "🎉 Parents' Choice", color: "bg-purple-600" },
      "3 x 90 minutes": { text: "🎉 Parents' Choice", color: "bg-purple-600" },
      "90 Minute Tutoring Session": { text: "📚 AP Exam Prep", color: "bg-yellow-500" },
      "60 minute Tutoring Session": { text: "🎉 Parents' Choice", color: "bg-purple-600" },
      "30 Minute Tutoring Session": { text: "🎉 Parents' Choice", color: "bg-purple-600" },

    };

    return ribbonMapping[serviceName] || { text: "", color: "" };
  };

  // ✅ Fetch products from the backend
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get("https://backend-production-cbe2.up.railway.app/api/stripe/get-products");
        const data = response.data;

        console.log("✅ Fetched Services:", data);

        // ✅ Apply Ribbon Labels Dynamically
        const updatedServices = data.map((service) => {
          const { text, color } = getRibbonDetails(service.name);
          return {
            ...service,
            ribbonText: text,
            ribbonColor: color,
          };
        });

        setServices(updatedServices);
      } catch (error) {
        console.error("❌ Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // ✅ Handle Add to Cart
  const handleAddToCart = useCallback(
    (service) => {
      console.log("🔹 handleAddToCart Clicked for Service:", service.name);

      let price = null;
      let currency = "USD";

      if (service.price) {
        price = Number(service.price).toFixed(2);
        currency = service.currency ? service.currency.toUpperCase() : "USD";
      }

      if (!price && service.default_price && service.default_price.unit_amount) {
        price = (service.default_price.unit_amount / 100).toFixed(2);
        currency = service.default_price.currency.toUpperCase();
      }

      if (!price || isNaN(price)) {
        console.error("❌ Cannot add service to cart, missing price!", service);
        toast.dismiss();
        toast.error(`⚠️ Cannot add ${service.name} to cart, missing price!`);
        return;
      }

      const newItem = {
        id: service.id,
        name: service.name,
        description: service.description || "",
        images: service.images || [],
        price,
        currency,
      };

      addToCart(newItem);
      toast.dismiss();
      toast.success(`${service.name} added to cart!`, { id: "cart-toast" });
    },
    [addToCart]
  );

  // ✅ Group Services into Categories
  const categorizedServices = {
    "Seasonal - AP Calc Review": services.filter((service) =>
      /(\bAP Calc - 20 Hours\b)/i.test(service.name)
    ),
    "Recommended for Student up to Algebra I": services.filter(
      (service) =>
        /(\b8 x 30 minutes\b|\b5 - 30 minutes\b|\b3 x 30 minutes\b)/i.test(service.name)
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
    "Single Sessions": services.filter((service) =>
      /(\b90 Minute Tutoring Session\b|\b30 Minute Tutoring Session\b|\b60 Minute Tutoring Session\b)/i.test(service.name)
    ),
  };

  return (
    <>
      {/* ✅ Hero Section */}
      <div className="bg-deepBlue py-6 text-white mt-16">
        <h1 className="text-2xl font-bold text-center">RockstarMath Tutoring Services</h1>
        <p className="text-center">Learn, Excel, Achieve!</p>
      </div>

      {/* ✅ Services List */}
      <div className="container mx-auto p-6 py-20">
        <Toaster position="top-right" />

        {/* ✅ Display Services */}
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
