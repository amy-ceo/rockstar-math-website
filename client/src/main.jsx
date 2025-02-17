import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css"; // Global styles
import "tailwindcss/tailwind.css"; // Tailwind CSS

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

// Lazy Load Pages & Components
const App = lazy(() => import("./App.jsx"));
const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const ReviewsPage = lazy(() => import("./pages/ReviewsPage.jsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const AboutPage = lazy(() => import("./pages/AboutPage.jsx"));
const CalendarPage = lazy(() => import("./pages/CalendarPage.jsx"));
const FAQsPage = lazy(() => import("./pages/FAQsPage.jsx"));
const CoursesPage = lazy(() => import("./pages/CoursesPage.jsx"));
const BlogPage = lazy(() => import("./pages/BlogPage.jsx"));
const ContactPage = lazy(() => import("./pages/ContactPage.jsx"));
const SignupPage = lazy(() => import("./pages/SignupPage.jsx"));
const ForgotPassword = lazy(() => import("./components/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./components/ResetPassword.jsx"));
const Services = lazy(() => import("./pages/Services.jsx"));
const CartPage = lazy(() => import("./pages/CartPage.jsx"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage.jsx"));
const RegisterBeforeCheckout = lazy(() => import("./pages/RegisterBeforeCheckout.jsx"));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const DashboardLayout = lazy(() => import("./pages/DashboardLayout.jsx"));
const MyClasses = lazy(() => import("./pages/MyClasses.jsx"));
const Schedule = lazy(() => import("./pages/Schedule.jsx"));
const Message = lazy(() => import("./pages/Messages.jsx"));
const Newsletter = lazy(() => import("./pages/Newsletter.jsx"));

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <CartProvider>
      <BrowserRouter>
        <Navbar />
        <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="faqs" element={<FAQsPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="blogs" element={<BlogPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="services" element={<Services />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password/:token" element={<ResetPassword />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="/register-before-checkout" element={<RegisterBeforeCheckout />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="/newsletter" element={<Newsletter />} />

            {/* Dashboard Routes Wrapped in Layout */}
            <Route path="/dashboard/*" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="courses" element={<MyClasses />} />
              <Route path="schedule" element={<Schedule />} />
            </Route>
          </Routes>
        </Suspense>
        <Footer />
      </BrowserRouter>
    </CartProvider>
  </AuthProvider>
);
