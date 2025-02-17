require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

async function fetchProducts() {
  try {
    const products = await stripe.products.list();
    console.log("All Products from Stripe:", products.data);
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

fetchProducts();
