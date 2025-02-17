import { useState, useEffect } from "react";

const usePurchasedClasses = (userId) => {
  const [purchasedClasses, setPurchasedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setError("User ID not provided");
      setLoading(false);
      return;
    }

    const fetchPurchasedClasses = async () => {
      try {
        const response = await fetch(`https://rockstarmathfinal-production.up.railway.app//api/${userId}/purchased-classes`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch purchased classes");
        }

        setPurchasedClasses(data.purchasedClasses || []);
      } catch (err) {
        console.error("❌ Error fetching purchased classes:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedClasses();
  }, [userId]);

  return { purchasedClasses, loading, error };
};

export default usePurchasedClasses;
