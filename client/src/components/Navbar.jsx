import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { MdLockOutline } from 'react-icons/md'
import { FaChevronDown, FaShoppingCart } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext' // ✅ Import Cart Context
import 'animate.css'

export function Navbar() {
  const { users, logout } = useAuth()
  const { cart } = useCart() // ✅ Get cart from CartContext
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    setUser(users)
  }, [users])

  useEffect(() => {
    setCartCount(cart.length)
  }, [cart])

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
    setDropdownOpen(false)
  }

  const handleLinkClick = () => {
    setMobileMenuOpen(false)
    setDropdownOpen(false)
  }

  return (
    <header className="bg-white shadow-md fixed w-full top-0 left-0 z-50">
      <nav className="mx-auto max-w-7xl flex items-center justify-between px-6 py-3 animate__animated animate__fadeInRight">
        {/* Logo and Mobile Menu Button */}
        <div className="flex items-center justify-between w-full lg:w-auto">
          <NavLink
            to="/"
            className="animate__animated animate__backInLeft items-center text-2xl font-bold text-deepBlue"
          >
            <img src="/images/logo.png" alt="Logo" className="h-10 w-auto mr-2" />
          </NavLink>
          <button
            className="block lg:hidden text-gray-700 z-[101]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center space-x-7">
          <NavLink
            to="/"
            onClick={handleLinkClick}
            className="block  py-2 text-gray-700 transition-all"
          >
            Book Now
          </NavLink>
          <NavLink
            to="/about"
            onClick={handleLinkClick}
            className="block  py-2 text-gray-700 transition-all"
          >
            Abouts
          </NavLink>
          <NavLink
            to="/courses"
            onClick={handleLinkClick}
            className="block  py-2 text-gray-700 transition-all"
          >
            Courses
          </NavLink>

          {/* Dropdown Menu */}
          <div className="relative">
            <button
              className="flex items-center block  py-2 text-gray-700 transition-all"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              Pages <FaChevronDown className="ml-1" />
            </button>
            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-44 bg-white shadow-lg rounded-md overflow-hidden">
                <NavLink
                  to="/reviews"
                  onClick={handleLinkClick}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Reviews
                </NavLink>
                <NavLink
                  to="/calendar"
                  onClick={handleLinkClick}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Calendar
                </NavLink>
                <NavLink
                  to="/faqs"
                  onClick={handleLinkClick}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  FAQs
                </NavLink>
                <NavLink
                  to="/blogs"
                  onClick={handleLinkClick}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Blogs
                </NavLink>
                <NavLink
                  to="/contact"
                  onClick={handleLinkClick}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Contact
                </NavLink>
              </div>
            )}
          </div>

          <NavLink
            to="/services"
            onClick={handleLinkClick}
            className="text-gray-700 hover:text-sky-600 transition-all"
          >
            Tutoring
          </NavLink>

          {/* Cart */}
          <NavLink
            to="/cart"
            onClick={handleLinkClick}
            className="relative text-gray-700 hover:text-sky-600 transition-all flex items-center"
          >
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
            <span className="ml-1">Cart</span>
          </NavLink>

          <NavLink
            to="/subscription"
            onClick={handleLinkClick}
            className="text-gray-700 hover:text-sky-600 transition-all"
          >
            Group Tutoring
          </NavLink>

          {/* Authentication */}
          {user ? (
            <>
              <NavLink
                to="/dashboard"
                onClick={handleLinkClick}
                className="text-gray-700 hover:text-sky-600 transition-all"
              >
                Go To Dashboard
              </NavLink>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-deepBlue text-white rounded-lg hover:bg-sky-600 transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                onClick={handleLinkClick}
                className="flex items-center text-gray-700 hover:text-sky-600 transition-all"
              >
                <MdLockOutline className="w-6 h-6 mr-1" /> Log in
              </NavLink>
              <NavLink
                to="/signup"
                onClick={handleLinkClick}
                className="bg-deepBlue text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-all"
              >
                Sign Up
              </NavLink>
            </>
          )}
        </div>

        {mobileMenuOpen && (
  <div className="lg:hidden fixed inset-0 top-0 left-0 w-full h-screen bg-white shadow-md p-6 flex flex-col mt-14 space-y-7 animate__animated animate__fadeInRight z-[100]">
    
    {/* Navigation Links */}
    <NavLink to="/" onClick={handleLinkClick} className="text-gray-700 hover:text-sky-600 font-medium">
      Book Now
    </NavLink>
    <NavLink to="/about" onClick={handleLinkClick} className="text-gray-700 hover:text-sky-600 font-medium">
      About
    </NavLink>
    <NavLink to="/courses" onClick={handleLinkClick} className="text-gray-700 hover:text-sky-600 font-medium">
      Courses
    </NavLink>

    {/* Dropdown Menu */}
    <div className="w-full">
      <button
        className="flex items-center justify-between w-full text-gray-700 hover:text-sky-600 transition-all font-medium py-2"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        Pages 
        <FaChevronDown className={`ml-1 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Content */}
      <div className={`transition-all overflow-hidden ${dropdownOpen ? "max-h-60" : "max-h-0"} duration-300`}>
        <NavLink to="/reviews" onClick={handleLinkClick} className="block pl-4 py-2 text-gray-700 hover:text-sky-600">
          Reviews
        </NavLink>
        <NavLink to="/calendar" onClick={handleLinkClick} className="block pl-4 py-2 text-gray-700 hover:text-sky-600">
          Calendar
        </NavLink>
        <NavLink to="/faqs" onClick={handleLinkClick} className="block pl-4 py-2 text-gray-700 hover:text-sky-600">
          FAQs
        </NavLink>
        <NavLink to="/blogs" onClick={handleLinkClick} className="block pl-4 py-2 text-gray-700 hover:text-sky-600">
          Blogs
        </NavLink>
        <NavLink to="/contact" onClick={handleLinkClick} className="block pl-4 py-2 text-gray-700 hover:text-sky-600">
          Contact
        </NavLink>
      </div>
    </div>

    <NavLink to="/services" onClick={handleLinkClick} className="text-gray-700 hover:text-sky-600 font-medium">
      Tutoring
    </NavLink>

    {/* Cart */}
    <NavLink 
      to="/cart" 
      onClick={handleLinkClick} 
      className="relative flex items-center text-gray-700 hover:text-sky-600 font-medium"
    >
      {cartCount > 0 && (
        <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
          {cartCount}
        </span>
      )}
      {/* <FaShoppingCart className="mr-2" /> */}
      Cart
    </NavLink>

    <NavLink to="/subscription" onClick={handleLinkClick} className="text-gray-700 hover:text-sky-600 font-medium">
      Group Tutoring
    </NavLink>

    {/* Authentication */}
    {user ? (
      <>
        <NavLink to="/dashboard" onClick={handleLinkClick} className="text-gray-700 hover:text-sky-600 font-medium">
          Go To Dashboard
        </NavLink>
        <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-deepBlue text-white rounded-lg hover:bg-sky-600 transition-all w-full font-semibold">
          Logout
        </button>
      </>
    ) : (
      <>
        <NavLink to="/login" onClick={handleLinkClick} className="text-gray-700 hover:text-sky-600 font-medium">
          Log in
        </NavLink>
        <NavLink to="/signup" onClick={handleLinkClick} className="mt-2 bg-deepBlue text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-all w-full font-semibold text-center">
          Sign Up
        </NavLink>
      </>
    )}
  </div>
)}


      </nav>
    </header>
  )
}

export default Navbar
