import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import img1 from "../../assets/team.jpg";
import img2 from "../../assets/team2.jpg";
import img3 from "../../assets/team3.jpg";

const images = [img1, img2, img3];

const TeamSection = () => {
  const [index, setIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // auto update on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const nextSlide = () => setIndex((prev) => (prev + 1) % images.length);
  const prevSlide = () => setIndex((prev) => (prev - 1 + images.length) % images.length);

  const visibleImages = isMobile
    ? [images[index]]
    : [images[index], images[(index + 1) % images.length]];

  return (
    <div className="w-full bg-white px-0 sm:px-6 md:px-16 lg:px-24 py-2 md:py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-center">

        {/* LEFT SECTION */}
        <div>
          {/* SUBTITLE */}
          <p className="
            text-xs sm:text-sm 
            tracking-widest font-semibold mb-2 
            text-center md:text-left 
            text-[#49386D]
          ">
            OUR TEAM
          </p>

          {/* MAIN HEADING */}
          <h2 className="
            font-bold text-gray-900 leading-snug
            text-2xl
            sm:text-3xl
            md:text-5xl
            text-center md:text-left
          ">
            We are the people<br />
            who make up<br />
            growth
          </h2>

          {/* DESKTOP ARROWS */}
          <div className="hidden md:flex gap-4 mt-10">
            <button
              onClick={prevSlide}
              className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow hover:scale-105 transition"
            >
              <ArrowLeft size={22} className="text-black" />
            </button>
            <button
              onClick={nextSlide}
              className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow hover:scale-105 transition"
            >
              <ArrowRight size={22} className="text-black" />
            </button>
          </div>
        </div>

        {/* RIGHT IMAGES */}
        <div className="w-full flex justify-center gap-3 sm:gap-4">
          {visibleImages.map((img, i) => (
            <div
              key={i}
              className="
                rounded-xl overflow-hidden shadow-xl
                w-[85%] 
                sm:w-[80%]
                md:w-[45%]
                h-[180px]
                sm:h-[210px]
                md:h-[260px]
              "
            >
              <img src={img} className="w-full h-full object-cover" alt="team" />
            </div>
          ))}
        </div>

        {/* MOBILE ARROWS */}
        <div className="flex md:hidden justify-center gap-5 mt-4">
          <button
            onClick={prevSlide}
            className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow hover:scale-105 transition"
          >
            <ArrowLeft size={20} className="text-black" />
          </button>

          <button
            onClick={nextSlide}
            className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow hover:scale-105 transition"
          >
            <ArrowRight size={20} className="text-black" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default TeamSection;
