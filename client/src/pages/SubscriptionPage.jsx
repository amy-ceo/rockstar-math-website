import React, { useEffect, useState, useCallback } from "react";
import { useCart } from "../context/CartContext"; // ✅ Import Cart Context
import { toast, Toaster } from "react-hot-toast"; // ✅ Toast Notifications

const SubscriptionPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart(); // ✅ Access addToCart function

  // ✅ Fetch Subscription Plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch(
          "https://backend-production-cbe2.up.railway.app/api/stripe/get-plans"
        );
        const data = await response.json();

        console.log("✅ Fetched Plans:", data);

        if (Array.isArray(data)) {
          setPlans(
            data.map((plan) => ({
              ...plan,
              ribbonText: getRibbonText(plan.name), // Assign ribbon text dynamically
            }))
          );
        }
      } catch (error) {
        console.error("❌ Error fetching plans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // 🎯 **Function to Customize Ribbon Text for Each Plan**
  const getRibbonText = (planName) => {
    const ribbonMapping = {
      Achieve: "Limited Offer 🔥",
      Excel: "Top Choice ⭐",
      Learn: "Best Value 💡",
      "Common Core-Parents": "Special Deal 🎉",
    };
    return ribbonMapping[planName] || "Best Offer"; // Default if not found
  };

  // ✅ Handle Subscription Click
  const handleSubscribe = useCallback(
    (plan) => {
      console.log("🔹 handleSubscribe Clicked for Plan:", plan.name);

      if (!plan.price || isNaN(Number(plan.price))) {
        toast.dismiss();
        toast.error(`⚠️ Cannot subscribe to ${plan.name}, missing price!`);
        return;
      }

      addToCart(plan);
      console.log("🛒 Plan added to cart:", plan);

      toast.dismiss();
      toast.success(`✅ ${plan.name} added to cart!`, { id: "subscribe-toast" });
    },
    [addToCart]
  );

  return (
    <>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-16">
        <div className="text-center py-24 bg-deepBlue w-full text-white">
          <h2 className="text-3xl font-bold">Your Path to Math Mastery Starts Here</h2>
          <p className="max-w-2xl mx-auto mt-2">
            RockstarMath offers three tailored subscription plans designed to help students succeed
            at every level. Whether you’re strengthening your foundation or preparing for advanced
            exams, we have the perfect plan for you.
          </p>
        </div>
        <Toaster position="top-right" /> {/* ✅ Toast Notifications */}

        {/* ✅ Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10 max-w-6xl mx-auto px-4 md:px-0">
          {loading ? (
            <p className="text-center text-gray-700 text-lg">Loading plans...</p>
          ) : plans.length > 0 ? (
            plans.map((plan, index) => (
              <div
                key={index}
                className="relative bg-white p-8 rounded-lg shadow-lg border border-gray-200 text-center flex flex-col justify-between h-full"
              >
                {/* 🔹 Ribbon at Top Right (Now Dynamic) */}
                <div
                  className={`absolute top-2 -right-6 text-white text-xs font-bold py-1 px-2 transform rotate-45 shadow-md ${
                    plan.name.toLowerCase() === "achieve" ? "bg-red-600" : "bg-blue-600"
                  }`}
                >
                  {plan.ribbonText}
                </div>

                {/* ✅ Plan Header */}
                <div className="flex flex-col items-center mb-4">
                  <img
                    src={plan.images || "/default-image.png"}
                    alt={plan.name}
                    className="w-24 h-24 object-contain mb-3"
                  />
                  <h3 className="text-2xl font-semibold text-gray-800">{plan.name}</h3>
                </div>

                {/* ✅ Price */}
                <p className="text-3xl font-bold text-gray-900 my-3">
                  ${plan.price !== "N/A" ? plan.price : "Not Available"}{" "}
                  <span className="text-sm text-gray-500">/ {plan.currency}</span>
                </p>

                {/* ✅ Description */}
                <p className="text-sm text-gray-600 my-4 flex-grow">{plan.description}</p>

                {/* ✅ Subscribe Button (Disabled for "Learn" Plan) */}
                {plan.name.toLowerCase() === "learn" ? (
                  <p className="mt-auto bg-gray-300 text-gray-700 w-full py-3 rounded-lg font-medium cursor-not-allowed">
                    Coming Soon
                  </p>
                ) : (
                  <button
                    className="mt-auto bg-blue-600 text-white w-full py-3 rounded-lg font-medium hover:bg-blue-700 transition-all"
                    onClick={() => handleSubscribe(plan)}
                  >
                    Subscribe
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-700 text-lg">No plans available.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default SubscriptionPage;
