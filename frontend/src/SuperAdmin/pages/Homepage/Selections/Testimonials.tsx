import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      text: "Good service and friendly drivers. Would use their service again. The sedan was comfortable and the driver was punctual.",
      author: "Santosh",
    },
    {
      text: "Always a joy to interact with drivers. Quite safe. A lot of my office mates use this service for official trips. It's very economical compared to Uber.",
      author: "Pradeep",
    },
    {
      text: "I would like to say it is exceptional service provided by Grace Cab. Keep up the good work.",
      author: "John",
    },
  ];

  const [active, setActive] = useState(0);

  const next = () => setActive((prev) => (prev + 1) % testimonials.length);
  const prev = () => setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  // Auto-slide every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <section className="py-12 sm:py-14 md:py-16 bg-white overflow-hidden">
      <div className="container mx-auto px-3 sm:px-6">
        {/* Heading */}
        <h3 className="text-2xl sm:text-3xl font-bold text-[#0b2c6b] text-center mb-6">
          TESTIMONIALS
          <div className="w-16 h-1 bg-green-600 mx-auto mt-2"></div>
        </h3>

        {/* Desktop (3 cards visible) */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 mt-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-gray-50 p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow duration-300"
            >
              <p className="text-gray-700 text-sm md:text-base italic mb-4 leading-relaxed">
                "{t.text}"
              </p>
              <p className="text-green-600 font-semibold text-sm md:text-base">- {t.author}</p>
            </div>
          ))}
        </div>

        {/* Mobile Slider (1 card visible, auto sliding) */}
        <div className="relative md:hidden max-w-sm mx-auto mt-6">
          <div
            className="transition-all duration-700 ease-in-out"
            key={active}
          >
            <div className="bg-gray-50 px-5 py-6 rounded-lg shadow-md text-center">
              <p className="text-gray-700 text-[13px] sm:text-sm italic leading-relaxed mb-3">
                "{testimonials[active].text}"
              </p>
              <p className="text-green-600 font-semibold text-[13px] sm:text-sm">
                - {testimonials[active].author}
              </p>
            </div>
          </div>

          {/* Prev / Next buttons */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-all"
          >
            <ChevronRight className="w-4 h-4 text-gray-700" />
          </button>

          {/* Dots */}
          <div className="flex justify-center mt-4 space-x-2">
            {testimonials.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === active ? "bg-green-600" : "bg-gray-300"
                }`}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
