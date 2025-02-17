import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";

// ✅ Create Cart Context
const CartContext = createContext();

// ✅ Cart Provider Component
export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // ✅ Load cart from localStorage when the page loads (With Error Handling)
  useEffect(() => {
    try {
      const storedCart = JSON.parse(localStorage.getItem("cartItems")) || [];
      setCart(storedCart);
    } catch (error) {
      console.error("❌ Failed to load cart from localStorage:", error);
      setCart([]); // Ensure fallback to empty cart
    }
  }, []);

  // ✅ Save cart to localStorage only when the cart state changes
  useEffect(() => {
    try {
      localStorage.setItem("cartItems", JSON.stringify(cart));
    } catch (error) {
      console.error("❌ Failed to save cart to localStorage:", error);
    }
  }, [cart]);

  // ✅ Function to add item to cart (Fix for "Cannot add plan without price" error)
 const addToCart = (service) => {
  setCart((prevCart) => {
    const exists = prevCart.some((item) => item.id === service.id);
    if (exists) {
      console.warn(`⚠️ Item already exists in the cart: ${service.name}`);
      return prevCart;
    }

    // ✅ Handle Both Subscription & Services Price Data Structure
    let price = null;
    let currency = "USD";

    // Subscription plans use `price` directly
    if (service.price) {
      price = Number(service.price).toFixed(2);
      currency = service.currency ? service.currency.toUpperCase() : "USD";
    }

    // Services have `default_price.unit_amount` structure
    if (!price && service.default_price && service.default_price.unit_amount) {
      price = (service.default_price.unit_amount / 100).toFixed(2);
      currency = service.default_price.currency.toUpperCase();
    }

    // ✅ Prevent Adding Items Without Price
    if (!price || isNaN(price)) {
      console.error("❌ Cannot add plan without a valid price!", service);
      toast.error("This plan cannot be added because it has no price set.");
      return prevCart;
    }

    // ✅ Create a Clean Object for the Cart
    const newItem = {
      id: service.id,
      name: service.name,
      description: service.description,
      images: service.images || [],
      price,
      currency,
    };

    const updatedCart = [...prevCart, newItem];
    localStorage.setItem("cartItems", JSON.stringify(updatedCart));

    toast.success(`${service.name} added to cart!`);
    return updatedCart;
  });
};



  // ✅ Function to remove item from cart
  const removeFromCart = (serviceId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== serviceId));
    localStorage.setItem(
      "cartItems",
      JSON.stringify(cart.filter((item) => item.id !== serviceId))
    );
  };

  // ✅ Function to clear the cart (Optional)
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cartItems"); // ✅ Remove cart from localStorage when cleared
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

// ✅ Custom Hook to Use Cart Context
export const useCart = () => useContext(CartContext);
