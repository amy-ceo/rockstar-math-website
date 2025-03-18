import React, { useState, useEffect, Suspense, lazy } from "react";
import { useCart } from "../context/CartContext";
import { FaTrashAlt, FaShoppingCart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";

const CartSummary = lazy(() => import("../components/CartSummary"));

const CartPage = () => {
  const { cart, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);

  // ✅ Load Cart from Local Storage on Page Load
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    } else {
      setCartItems(cart); // Fallback to context if localStorage is empty
    }
  }, [cart]);

  // ✅ Sync Local State with Context
  useEffect(() => {
    setCartItems(cart);
    localStorage.setItem("cart", JSON.stringify(cart)); // Ensure localStorage is updated
  }, [cart]);

  const handleProceedToCheckout = async () => {
    try {
      const email = localStorage.getItem("userEmail");
      const phone = localStorage.getItem("userPhone");

      if (!email || !phone) {
        localStorage.setItem("cartItems", JSON.stringify(cartItems));
        navigate("/register-before-checkout");
        return;
      }

      const response = await axiosInstance.post("/check-registration", { email, phone });

      if (response.data.success) {
        navigate("/checkout");
      } else {
        localStorage.setItem("cartItems", JSON.stringify(cartItems));
        navigate("/register-before-checkout");
      }
    } catch (error) {
      console.error("❌ Error checking registration:", error);
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
      navigate("/register-before-checkout");
    }
  };

  // ✅ Remove Item and Update Local Storage
  const handleRemoveItem = (id) => {
    const updatedCart = cartItems.filter((item) => item.id !== id);
    setCartItems(updatedCart);
    localStorage.setItem("cartItems", JSON.stringify(updatedCart));
    removeFromCart(id);
  };

  return (
    <div className="container mx-auto p-6 py-16">
      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[400px]">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center w-96">
            <FaShoppingCart className="text-gray-400 text-6xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Your Cart is Empty</h2>
            <p className="text-gray-500 mt-2">Start adding items to your cart now!</p>
            <button
              onClick={() => navigate("/services")}
              className="mt-6 bg-deepBlue text-white px-6 py-3 rounded-lg shadow-md hover:bg-sky-600 transition-all duration-300"
            >
              Browse Courses
            </button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center mt-10">Cart</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-300">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sky-600 font-semibold text-lg">
                  {cartItems.length} {cartItems.length > 1 ? "Courses" : "Course"} in Cart
                </p>
              </div>

              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50 transition-all duration-200 rounded-lg">
                  <div className="flex items-center gap-4 w-2/3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
                      <p className="text-gray-500 text-sm">{item.description}</p>
                    </div>
                  </div>

                  <p className="text-green-600 font-semibold w-1/6">
                    {item.price ? `$${item.price} ${item.currency}` : "Price Not Available"}
                  </p>

                  <button onClick={() => handleRemoveItem(item.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 shadow-md w-1/6 text-center"
                  >
                    <FaTrashAlt className="text-white" /> Remove
                  </button>
                </div>
              ))}
            </div>

            <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading Summary...</div>}>
              <CartSummary cartItems={cartItems} handleProceedToCheckout={handleProceedToCheckout} />
            </Suspense>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
