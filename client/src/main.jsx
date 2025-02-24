import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import './index.css' // Global styles
import 'tailwindcss/tailwind.css' // Tailwind CSS

import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import CourseDetail from './components/CourseDetail.jsx'
import Archive from './components/Archive.jsx'
import AdminDashboardLayout from './admin/layout/AdminDashboardLayout.jsx'
import AdminAuthProvider from './admin/context/AdminAuthContext.jsx'
import AdminDashboard from './admin/pages/AdminDashboard.jsx'
import AdminLogin from './admin/pages/AdminLogin.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import AdminAnalytics from './admin/pages/AdminAnalytics.jsx'
import AdminUsers from './admin/pages/AdminUsers.jsx'
import AdminBlogs from './admin/pages/AdminBlogs.jsx'
import Payments from './admin/pages/Payments.jsx'

// Function to check admin authentication
const isAdminAuthenticated = () => !!localStorage.getItem('adminToken')

// Lazy Load Pages & Components
const App = lazy(() => import('./App.jsx'))
const HomePage = lazy(() => import('./pages/HomePage.jsx'))
const ReviewsPage = lazy(() => import('./pages/ReviewsPage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'))
const CalendarPage = lazy(() => import('./pages/CalendarPage.jsx'))
const FAQsPage = lazy(() => import('./pages/FAQsPage.jsx'))
const CoursesPage = lazy(() => import('./pages/CoursesPage.jsx'))
const BlogPage = lazy(() => import('./pages/BlogPage.jsx'))
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'))
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'))
const ForgotPassword = lazy(() => import('./components/ForgotPassword.jsx'))
const ResetPassword = lazy(() => import('./components/ResetPassword.jsx'))
const Services = lazy(() => import('./pages/Services.jsx'))
const CartPage = lazy(() => import('./pages/CartPage.jsx'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'))
const RegisterBeforeCheckout = lazy(() => import('./pages/RegisterBeforeCheckout.jsx'))
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const DashboardLayout = lazy(() => import('./pages/DashboardLayout.jsx'))
const MyClasses = lazy(() => import('./pages/MyClasses.jsx'))
const Schedule = lazy(() => import('./pages/Schedule.jsx'))
const Message = lazy(() => import('./pages/Messages.jsx'))
const Newsletter = lazy(() => import('./pages/Newsletter.jsx'))

const root = createRoot(document.getElementById('root'))
root.render(
  <StrictMode>
    <AdminAuthProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Suspense
              fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}
            >
              <Routes>
                {/* ✅ Public Website Routes with Navbar & Footer */}
                <Route
                  path="/"
                  element={
                    <>
                      <Navbar />
                      <HomePage />
                      <Footer />
                    </>
                  }
                />

                {/* ✅ Other Public Routes */}
                <Route
                  path="about"
                  element={
                    <>
                      <Navbar />
                      <AboutPage />
                      <Footer />
                    </>
                  }
                />
                <Route path="reviews" element={   <>
                      <Navbar />
                      <ReviewsPage />
                      <Footer />
                    </>} />
                <Route path="calendar" element={   <>
                      <Navbar />
                      <CalendarPage />
                      <Footer />
                    </>} />
                <Route path="faqs" element={   <>
                      <Navbar />
                      <FAQsPage />
                      <Footer />
                    </>} />
                <Route path="courses" element={   <>
                      <Navbar />
                      <CoursesPage />
                      <Footer />
                    </>} />
                <Route path="blogs" element={   <>
                      <Navbar />
                      <BlogPage />
                      <Footer />
                    </>} />
                <Route path="contact" element={   <>
                      <Navbar />
                      <ContactPage />
                      <Footer />
                    </>} />
                <Route path="services" element={   <>
                      <Navbar />
                      <Services />
                      <Footer />
                    </>} />
                <Route path="forgot-password" element={   <>
                      <Navbar />
                      <ForgotPassword />
                      <Footer />
                    </>} />
                <Route path="reset-password/:token" element={   <>
                      <Navbar />
                      <ResetPassword />
                      <Footer />
                    </>} />
                <Route path="login" element={   <>
                      <Navbar />
                      <LoginPage />
                      <Footer />
                    </>} />
                <Route path="signup" element={   <>
                      <Navbar />
                      <SignupPage />
                      <Footer />
                    </>} />
                <Route path="/register-before-checkout" element={   <>
                      <Navbar />
                      <RegisterBeforeCheckout />
                      <Footer />
                    </>} />
                <Route path="/subscription" element={   <>
                      <Navbar />
                      <SubscriptionPage />
                      <Footer />
                    </>} />
                <Route path="cart" element={   <>
                      <Navbar />
                      <CartPage />
                      <Footer />
                    </>} />
                <Route path="checkout" element={   <>
                      <Navbar />
                      <CheckoutPage />
                      <Footer />
                    </>} />
                <Route path="/newsletter" element={   <>
                      <Navbar />
                      <Newsletter />
                      <Footer />
                    </>} />
                <Route path="/course/:id" element={   <>
                      <Navbar />
                      <CourseDetail />
                      <Footer />
                    </>} />

                {/* ✅ User Dashboard Routes */}
                <Route path="/dashboard/*" element={<DashboardLayout />}>
                  <Route index element={   <>
                      <Navbar />
                      <Dashboard />
                      <Footer />
                    </>} />
                  <Route path="courses" element={   <>
                      <Navbar />
                      <MyClasses />
                      <Footer />
                    </>} />
                  <Route path="schedule" element={   <>
                      <Navbar />
                      <Schedule />
                      <Footer />
                    </>} />
                  <Route path="archive" element={   <>
                      <Navbar />
                      <Archive />
                      <Footer />
                    </>} />
                </Route>

                {/* ✅ Admin Authentication */}
                <Route path="/admin" element={   <>
                      <Navbar />
                      <AdminLogin />
                      <Footer />
                    </>} />

                {/* ✅ Admin Dashboard Layout (Without Navbar & Footer) */}
                <Route
                  path="/admin/dashboard/*"
                  element={
                    isAdminAuthenticated() ? <AdminDashboardLayout /> : <Navigate to="/admin" />
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="blogs" element={<AdminBlogs />} />
                  <Route path="payments" element={<Payments />} />

                </Route>

                {/* Catch-All Route for 404 */}
                <Route
                  path="*"
                  element={<h1 className="text-center text-3xl mt-10">404 - Page Not Found</h1>}
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </AdminAuthProvider>
  </StrictMode>,
)
