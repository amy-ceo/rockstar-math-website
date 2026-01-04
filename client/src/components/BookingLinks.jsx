import React from "react";
import AnimatedSection from "./AnimatedSection";

function BookingLinks() {
  const sections = [
    {
      title: "Open Studio",
      subtitle: "Sunday · 2–8pm PST",
      items: [
        { name: "Rising Rockstars (30 min)", price: "$45", href: "https://calendly.com/rockstarmathtutoring/open-studio-rising-rockstars" },
        { name: "Rockstars (60 min)", price: "$60", href: "https://calendly.com/rockstarmathtutoring/open-studio-rockstars" },
        { name: "Superstars (60 min)", price: "$65", href: "https://calendly.com/rockstarmathtutoring/open-studio-superstars" },
        { name: "Legends (90 min)", price: "$90", href: "https://calendly.com/rockstarmathtutoring/open-studio-legends" },
      ],
    },
    {
      title: "Coffee Hour",
      subtitle: "Mon–Thu · Noon–2pm PST",
      items: [
        { name: "Rising Rockstars (30 min)", price: "$45", href: "https://calendly.com/rockstarmathtutoring/coffee-hour-rising-rockstars" },
        { name: "Rockstars (60 min)", price: "$60", href: "https://calendly.com/rockstarmathtutoring/coffee-hour-rising-rockstars" },
        { name: "Superstars (60 min)", price: "$60", href: "https://calendly.com/rockstarmathtutoring/coffee-hour-superstars" },
        { name: "Legends (90 min)", price: "$85", href: "https://calendly.com/rockstarmathtutoring/coffee-hour-legends" },
      ],
    },
    {
      title: "Prime Time",
      subtitle: "Mon–Thu · 6–8pm PST",
      items: [
        { name: "Rising Rockstars (30 min)", price: "$55", href: "https://calendly.com/rockstarmathtutoring/prime-time-rising-rockstars" },
        { name: "Rockstars (60 min)", price: "$70", href: "https://calendly.com/rockstarmathtutoring/prime-time-rockstars" },
        { name: "Superstars (60 min)", price: "$80", href: "https://calendly.com/rockstarmathtutoring/prime-time-rockstars" },
        { name: "Legends (90 min)", price: "$115", href: "https://calendly.com/rockstarmathtutoring/prime-time-legends" },
      ],
    },
  ];

  return (
    <AnimatedSection direction="bottom">
      <div className="w-full py-14 px-6 lg:px-20">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header */}
          <div className="w-full text-center lg:text-left mb-12">
            <h2 className="text-4xl font-bold text-gray-800">Book a Session</h2>
            <p className="mt-3 text-gray-600 max-w-3xl">
              Session Levels <br />
• Rising Rockstars: Grades K–5<br />
• Rockstars: Grades 6–Algebra 2 (includes Geometry)<br />
• Superstars: Pre-Calculus, Calculus, Statistics<br />
• Legends: Pre-Calculus, Calculus, Statistics (90-minute intensive)
            </p>
          </div>

          {/* 3 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {sections.map((sec) => (
              <div key={sec.title} className="p-6 rounded-lg shadow-sm border bg-white">
                <div className="mb-5">
                  <h3 className="text-2xl font-bold text-gray-800">{sec.title}</h3>
                  <p className="text-gray-600">{sec.subtitle}</p>
                </div>

                <div className="flex flex-col gap-3">
                  {sec.items.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="milestone-item p-4 flex items-center justify-between gap-4 transition-shadow border rounded-lg hover:shadow-md"
                    >
                      <div className="text-gray-800 font-medium">{item.name}</div>
                      <div className="text-gray-800 font-bold whitespace-nowrap">{item.price}</div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Small note */}
          <div className="mt-10 text-gray-600">
            <p className="text-lg">
              Coffee Hour is a great option for homeschool and online students.
            </p>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

export default BookingLinks;
