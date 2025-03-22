import React, { useState, useEffect, Suspense, lazy } from 'react'
import { FaQuoteLeft } from 'react-icons/fa'
import axios from 'axios'

// Lazy Load Components
const BlogBanner = lazy(() => import('../components/banners/BlogBanner'))
const AnimatedSection = lazy(() => import('../components/AnimatedSection'))

function BlogPage() {
  const [blogs, setBlogs] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedBlog, setSelectedBlog] = useState(null)

  // ✅ Fetch Blogs from Backend
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await axios.get('https://backend-production-cbe2.up.railway.app/api/blogs') // Adjust URL as needed
        setBlogs(response.data)
      } catch (error) {
        console.error('Error fetching blogs:', error)
      }
    }
    fetchBlogs()
  }, [])

  // ✅ Open & Close Modal
  const handleOpenModal = (blog) => {
    setSelectedBlog(blog)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedBlog(null)
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseModal()
    }
  }

  return (
    <>
      {/* ✅ Blog Banner */}
      <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading...</div>}>
        <BlogBanner />
      </Suspense>

      {/* ✅ About Blogs Section */}
      <div className="flex flex-col md:flex-row px-8 md:px-32 py-12 md:py-20 gap-12 md:gap-20 items-center bg-gray-50">
        <div className="md:w-2/3 text-lg md:text-2xl text-gray-600 font-medium leading-relaxed">
          <Suspense fallback={<div className="text-gray-500 text-center">Loading...</div>}>
            <AnimatedSection direction="bottom">
              <h2>
                A passion for making math <span className="text-deepBlue">understandable</span> and
                helping my students reach their <span className="text-deepBlue">potential</span> is
                at the core of everything we do at RockstarMath.
              </h2>
              <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white text-[16px] px-6 py-2 rounded-full shadow-md transition duration-300">
                See More
              </button>
            </AnimatedSection>
          </Suspense>
        </div>

        <div className="md:w-1/3">
          <div className="relative overflow-hidden rounded-lg shadow-lg">
            <img
              src="/images/blog2.png"
              loading="lazy"
              alt="Blog"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>

      {/* ✅ Quote Section */}
      <div
        className="relative bg-cover bg-center bg-no-repeat py-20 px-6 sm:px-8 text-lightGray font-sans"
        style={{ backgroundImage: `url(/images/blog3.png)` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>

        <Suspense fallback={<div className="text-gray-500 text-center">Loading...</div>}>
          <AnimatedSection direction="right">
            <div className="relative max-w-4xl mx-auto text-center text-gray-200">
              <div className="flex justify-center mb-6">
                <FaQuoteLeft className="text-6xl sm:text-7xl text-white" />
              </div>
              <p className="text-lg sm:text-1xl leading-relaxed font-medium">
                RockstarMath is all about transforming challenges into achievements. We take pride
                in simplifying math and helping students discover their true potential through
                guided learning.
              </p>
              <br />
              <hr />
              <p className="text-lg sm:text-1xl leading-relaxed font-medium mt-5">Rockstar-Math</p>
            </div>
          </AnimatedSection>
        </Suspense>
      </div>

      {/* ✅ Dynamic Blog Section */}
      <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading...</div>}>
      <AnimatedSection direction="top">
          <div className="py-10 bg-gray-50">
            <h2 className="text-gray-800 text-3xl font-bold text-center mb-10">
              <span className="border-b-4 border-deepBlue pb-1">Our Blogs</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-6 md:px-12 xl:px-20">
              {blogs.length > 0 ? (
                blogs.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white shadow-md border border-gray-200 rounded-lg hover:shadow-lg transform hover:scale-105 transition-transform duration-300 overflow-hidden"
                    onClick={() => handleOpenModal(item)}
                  >
                    <div className="relative w-full h-48 sm:h-56 overflow-hidden rounded-t-lg">
                      <img
                        src={item.image}
                        loading="lazy"
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5">
                      <h6 className="mb-3 text-gray-900 text-lg font-bold hover:text-blue-600 transition-colors duration-300">
                        {item.title}
                      </h6>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {item.description.substring(0, 100)}...
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-6">No blogs available.</p>
              )}
            </div>
          </div>
        </AnimatedSection>
      </Suspense>

      {/* ✅ Blog Modal */}
      {modalOpen && selectedBlog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 md:p-8"
          onClick={handleBackdropClick}
        >
          <button
            onClick={handleCloseModal}
            className="absolute top-6 right-6 text-white p-3 transition-all focus:outline-none z-50"
          >
            ✖
          </button>
          <div className="relative bg-white rounded-lg w-full max-w-4xl shadow-lg overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* ✅ Image Section */}
              <div className="md:w-1/2 h-64 md:h-auto bg-gray-100">
                <img
                  src={`https://backend-production-cbe2.up.railway.app${selectedBlog.image}`}
                  alt={selectedBlog.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* ✅ Content Section */}
              <div className="md:w-1/2 p-6 overflow-y-auto max-h-[80vh]">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{selectedBlog.title}</h3>
                <p className="text-gray-600 leading-relaxed">{selectedBlog.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BlogPage
