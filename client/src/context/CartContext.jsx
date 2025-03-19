import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";

// ✅ Create Cart Context
const CartContext = createContext();

// ✅ Cart Provider Component
export const CartProvider = ({ children }) => {
  // ✅ Load cart from localStorage when the page loads
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cartItems")) || [];
    } catch (error) {
      console.error("❌ Failed to parse cart from localStorage:", error);
      return [];
    }
  });

  // ✅ Save cart to localStorage only when the cart state changes
  useEffect(() => {
    try {
      localStorage.setItem("cartItems", JSON.stringify(cart));
      console.log("🛒 Cart saved to localStorage:", cart);
    } catch (error) {
      console.error("❌ Failed to save cart to localStorage:", error);
    }
  }, [cart]);

  // ✅ Function to add item to cart
  const addToCart = (service) => {
    setCart((prevCart) => {
      const exists = prevCart.some((item) => item.id === service.id);
      if (exists) {
        console.warn(`⚠️ Item already exists in the cart: ${service.name}`);
        return prevCart;
      }

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
        console.error("❌ Cannot add plan without a valid price!", service);
        toast.error("This plan cannot be added because it has no price set.");
        return prevCart;
      }

      const newItem = {
        id: service.id,
        name: service.name,
        description: service.description,
        images: service.images || [],
        price,
        currency,
      };

      const updatedCart = [...prevCart, newItem];

      toast.success(`${service.name} added to cart!`);
      return updatedCart;
    });
  };

  // ✅ Remove Item from Cart
  const removeFromCart = (serviceId) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.filter((item) => item.id !== serviceId);
      localStorage.setItem("cartItems", JSON.stringify(updatedCart)); // ✅ Update localStorage correctly
      return updatedCart;
    });
    toast.success("Item removed from cart!");
  };

  const clearCart = () => {
    console.log("🛒 Clearing Cart...");
    setCart([]); // Reset cart state
    localStorage.removeItem("cartItems"); // Remove from localStorage
    window.dispatchEvent(new Event("storage")); // Sync across tabs
  };
  
  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

// ✅ Custom Hook to Use Cart Context
export const useCart = () => useContext(CartContext);
