import React, { useState, useRef, useEffect, Suspense, lazy } from 'react'
import { FaQuoteLeft } from 'react-icons/fa'

// Lazy Load Components
const BlogBanner = lazy(() => import('../components/banners/BlogBanner'))
const AnimatedSection = lazy(() => import('../components/AnimatedSection'))

function BlogPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedBlog, setSelectedBlog] = useState(null)

  const sputnikDescription = `Do you ever talk to your kids about when we went to the moon? Why was it so important? And what does that have to do with math education? Wars have always driven science forward, from the heat equation, to rockets, to computers, each was developed to keep a nation ahead of the game. After WW2 we thought we were ahead of the game but In 1957, the Soviet Union launched Sputnik, the first artificial satellite, sending shockwaves through the United States. This event exposed a gap in technological capability and created an urgent sense of competition. In response, the U.S. government made unprecedented investments in science, technology, engineering, and math (STEM) education through initiatives like the National Defense Education Act (NDEA) of 1958. The NDEA funded scholarships, improved curriculum standards, and supported teacher training to ensure that future generations were equipped to meet the challenges of an evolving world. This investment not only helped the U.S. regain its competitive edge but also laid the foundation for technological revolutions that shaped the modern world. From the Apollo program to the development of the internet, these advancements were made possible by a generation of scientists and engineers nurtured by improved math and science education. Today, the race for technological dominance has shifted to areas like AI, quantum computing, and biotechnology. Nations like China are heavily investing in STEM education, understanding that their future security and economic strength depend on a well-educated workforce. The U.S. must continue to prioritize math education to maintain its leadership.`
  const whyDidTheyStopDescription = `Scientists Nicolaus Copernicus, Johannes Kepler, Galileo Galilei, Albert Einstein and Sir Isaac Newton were all influenced by the Elements, and applied their knowledge of it to their work. Abraham Lincoln kept a copy of Euclid in his saddlebag, and studied it late at night by lamplight; he related that he said to himself, "You never can make a lawyer if you do not understand what demonstrate means; and I left my situation in Springfield, went home to my father's house, and stayed there till I could give any proposition in the six books of Euclid at sight". Edna St. Vincent Millay wrote in her sonnet Euclid alone has looked on Beauty bare, O blinding hour, O holy, terrible day, / When first the shaft into his vision shone / Of light anatomized!. Albert Einstein recalled a copy of the Elements and a magnetic compass as two gifts that had a great influence on him as a boy, referring to the Euclid as the holy little geometry book.  - Wikipedia What is this book that was so important to so many great minds?  A book written around 300 BCE, is one of the most influential math books ever. It shaped how math was taught for over 2,000 years and was a key part of education from ancient times to the 20th century. What Is The Elements? It’s a collection of 13 books covering geometry and basic number theory. Euclid started with a few basic rules, or axioms, and used logical steps to build up complex math ideas. The math proof. This approach became the foundation for how math is done today. Why Was It Used for So Long? Elements is a clear, logical, and easy to follow. For centuries, it was the go-to textbook for anyone learning math, from students in ancient Greece to those in medieval Europe and beyond. Universities and schools used it to teach geometry and logical reasoning. The question to me is, why did we stop?`
  const blogs = [
    {
      image: '/images/about1.png',
      title: 'Make Math a Daily Habit',
      description:
        'Incorporate 15 minutes of math practice into your child’s routine—just like brushing their teeth. Daily engagement reinforces existing skills and ensures consistency.',
    },
    {
      image: '/images/about2.png',
      title: 'Review Old Skills Regularly',
      description:
        "It's common for children to forget concepts they learned months ago if they aren't revisited. Set aside time to review past lessons—whether it's multiplication, decimals, or word problems.",
    },
    {
      image: '/images/about3.png',
      title: 'Leverage Real-Life Math Opportunities',
      description:
        'Math is everywhere! Involve your children in activities like cooking, budgeting, or grocery shopping. These real-world applications make math engaging and help children understand its practical importance.',
    },
    {
      image: '/images/about1.png',
      title: 'Join STEM Enrichment Programs',
      description:
        'Many schools and community centers offer math clubs, robotics teams, and STEM workshops. These programs make math exciting and give children opportunities to work collaboratively.',
    },
    {
      image: '/images/about2.png',
      title: 'Celebrate Progress',
      description:
        'Acknowledge and celebrate milestones—whether it’s mastering multiplication tables or solving their first algebra equation. Positive reinforcement boosts confidence.',
    },
    {
      image: '/images/2.jpg',
      title: 'The Sputnik Moment: A Historical Turning Point for math education',
      description: sputnikDescription,
    },
    {
      image: '/images/3.jpg',
      title: 'Don’t fall into the gap trap! How Parents can build a strong math foundation early',
      description:
        "Mathematics is often referred to as the language of the universe. From balancing a checkbook to solving complex engineering problems, math plays a pivotal role in shaping the way we think and solve problems. Yet, for many students, gaps in understanding early on can snowball into significant struggles later. By high school, concepts like algebra, geometry, and calculus become overwhelming if foundational skills from elementary and middle school are not strong. Unfortunately, without an early start, some students find themselves needing expensive tutoring to catch up. If your child is interested in science, nature, computers (yes, even video games!), being a doctor, or engineer and you want to support that dream, the best thing you can do is provide them with a solid math foundation.  I have seen too many college students either drop out or change their major over their math credits. Don’t fall into the gap trap! 1. Make Math a Daily Habit Incorporate 15 minutes of math practice into your child’s routine—just like brushing their teeth. Daily engagement reinforces existing skills and ensures consistency. Use flashcards for quick drills, play math-related games, or explore fun apps designed for math practice. Short, focused sessions work wonders in building long-term retention. 2. Review Old Skills Regularly It's common for children to forget concepts they learned months ago if they aren't revisited. Set aside time to review past lessons—whether it's multiplication, decimals, or word problems. Revisiting older material keeps these skills sharp and prevents gaps that can arise over time. 3. Leverage Real-Life Math Opportunities Math is everywhere! Involve your children in activities like cooking (measuring ingredients), budgeting (managing an allowance), or grocery shopping (calculating discounts). These real-world applications make math engaging and help children understand its practical importance. 4. Join STEM Enrichment Programs Many schools and community centers offer math clubs, robotics teams, and STEM workshops. These programs make math exciting and give children opportunities to work collaboratively, apply concepts, and explore advanced topics in a supportive environment. 5. Celebrate Progress Acknowledge and celebrate milestones—whether it’s mastering multiplication tables or solving their first algebra equation. Positive reinforcement boosts confidence and keeps children motivated to tackle new challenges. Parents don’t need to be math experts to support their children. You can be a math enthusiast! Talk about how much math changes the world and opens doors in life! ! The key is fostering curiosity, building routines, and creating an environment where math is seen as a challenge to embrace, not a subject to fear. A solid foundation today paves the way for limitless opportunities tomorrow.",
    },
    {
      image: '/images/1.jpg',
      title: 'Why Did They Stop?',
      description: whyDidTheyStopDescription,
    },
  ]

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
      <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading...</div>}>
        <BlogBanner />
      </Suspense>

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

      <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading...</div>}>
        <AnimatedSection direction="top">
          <div className="py-10 bg-gray-50">
            <h2 className="text-gray-800 text-3xl font-bold text-center mb-10">
              <span className="border-b-4 border-deepBlue pb-1">Our Blogs</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-6 md:px-12 xl:px-20">
              {blogs.map((item, index) => {
                const [isExpanded, setIsExpanded] = useState(false)
                const [showReadMore, setShowReadMore] = useState(false)
                const textRef = useRef(null)

                // ✅ Check if description exceeds 5 lines
                useEffect(() => {
                  if (textRef.current) {
                    const lineHeight = parseFloat(getComputedStyle(textRef.current).lineHeight)
                    const maxHeight = 5 * lineHeight // Height for 5 lines
                    setShowReadMore(textRef.current.scrollHeight > maxHeight)
                  }
                }, [])

                return (
                  <div
                    key={index}
                    className="flex flex-col cursor-pointer bg-white shadow-md border border-gray-200 rounded-lg hover:shadow-2xl transform hover:scale-105 transition-transform duration-300 overflow-hidden"
                    onClick={() => handleOpenModal(item)}
                  >
                    {/* ✅ Image Container */}
                    <div className="relative w-full h-56 overflow-hidden rounded-t-lg">
                      <img
                        src={item.image}
                        loading="lazy"
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* ✅ Content Section */}
                    <div className="p-6 flex flex-col justify-between h-auto">
                      <h6 className="mb-3 text-gray-900 text-lg font-bold hover:text-blue-600 transition-colors duration-300">
                        {item.title}
                      </h6>

                      {/* ✅ Limited Description with Conditional Read More */}
                      <p
                        ref={textRef}
                        className={`text-gray-600 text-sm leading-relaxed ${
                          isExpanded ? '' : 'line-clamp-5'
                        }`}
                      >
                        {item.description}
                      </p>

                      {/* ✅ Show "Read More" button only if text is longer than 5 lines */}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </AnimatedSection>
      </Suspense>

      {modalOpen && selectedBlog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 md:p-8"
          onClick={handleBackdropClick}
        >
         
          {/* ✅ Close Button (Now Outside the Modal) */}
          <button
            onClick={handleCloseModal}
            className="absolute top-6 right-6  text-white p-3   transition-all focus:outline-none z-50"
          >
           
            ✖
          </button>
          <div className="relative bg-white rounded-lg w-full max-w-4xl shadow-lg overflow-hidden">
           
            <div className="flex flex-col md:flex-row">
             
              {/* ✅ Image Section */}
              <div className="md:w-1/2 h-64 md:h-auto bg-gray-100">
               
                <img
                  src={selectedBlog.image}
                  alt={selectedBlog.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* ✅ Content Section */}
              <div className="md:w-1/2 p-6 overflow-y-auto max-h-[80vh]">
               
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                 
                  {selectedBlog.title}
                </h3>
                <p className="text-gray-600 leading-relaxed"> {selectedBlog.description} </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BlogPage
