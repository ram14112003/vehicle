import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import Img1 from "../../assets/user1.png";
import Img2 from "../../assets/user2.png";

const Testimonials = () => {
  const data = [
    {
      name: "Santosh",
      img: Img1,
      msg: "Good service and friendly drivers. Would use their service again. The sedan was comfortable and the driver was punctual.",
    },
    {
      name: "Pradeep",
      img: Img2,
      msg: "Always a joy to interact with drivers. Quite safe. Many of my office mates use this service. Very economical compared to Uber!",
    },
  ];

  const [index, setIndex] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(2);

  useEffect(() => {
    const updateSlides = () => {
      if (window.innerWidth < 768) setItemsPerSlide(1);
      else setItemsPerSlide(2);
    };

    updateSlides();
    window.addEventListener("resize", updateSlides);
    return () => window.removeEventListener("resize", updateSlides);
  }, []);

  const totalSlides = Math.ceil(data.length / itemsPerSlide);

  const nextSlide = () => setIndex((p) => (p + 1 < totalSlides ? p + 1 : 0));
  const prevSlide = () => setIndex((p) => (p - 1 >= 0 ? p - 1 : totalSlides - 1));

  const visibleItems = data.slice(
    index * itemsPerSlide,
    index * itemsPerSlide + itemsPerSlide
  );

  return (
    <section className="w-full pb-14 pt-10 md:pt-20">
      {/* Heading */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-[#5F5F93] uppercase tracking-widest text-xs sm:text-sm font-semibold">
          TESTIMONIALS
        </p>
        <h2 className="text-xl sm:text-2xl md:text-5xl font-bold text-[#151531]">
          What Our Customers Says
        </h2>
      </div>

      {/* DESKTOP / TABLET */}
      <div className="hidden md:flex w-full max-w-[1200px] mx-auto items-center gap-6 px-4">
        <button onClick={prevSlide} className="opacity-60 hover:opacity-100 transition">
          <ArrowLeft size={32} />
        </button>

        <div className="flex w-full justify-between gap-6">
          {visibleItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-6 bg-[#F5F5F5] p-6 rounded-2xl 
              w-[48%] min-h-[170px]"
            >
              <img
                src={item.img}
                className="w-16 h-16 rounded-full object-cover"
              />

              <div>
                <p className="text-sm text-[#30304F] leading-snug">“{item.msg}”</p>
                <p className="mt-3 font-semibold text-[#151531]">- {item.name}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={nextSlide} className="opacity-60 hover:opacity-100 transition">
          <ArrowRight size={32} />
        </button>
      </div>

      {/* MOBILE VIEW (320px – 425px) */}
      <div className="md:hidden flex items-center justify-center gap-3 px-3 mt-4">

        {/* LEFT */}
        <button
          onClick={prevSlide}
          className="opacity-70 flex items-center justify-center w-8 h-8"
        >
          <ArrowLeft size={22} />
        </button>

        {/* CARD */}
        <div
          className="
          w-full 
          max-w-[280px]      /* 320px, 325px join match */
          xxs:max-w-[300px]  /* custom for 350px phones */
          sm:max-w-[340px]   /* 375px */
          bg-[#F5F5F5] 
          p-4               /* padding reduce */
          rounded-2xl 
          shadow-sm 
          min-h-[150px]     /* card height reduce */
          flex flex-col 
          items-center 
          text-center 
          gap-1.5
        "
        >

          <img
            src={visibleItems[0].img}
            className="w-12 h-12 rounded-full object-cover"  // image size smaller
          />

          <p className="text-xs text-[#30304F] leading-snug px-1">
            “{visibleItems[0].msg}”
          </p>

          <p className="font-semibold text-[#151531] text-xs">
            - {visibleItems[0].name}
          </p>
        </div>

        {/* RIGHT */}
        <button
          onClick={nextSlide}
          className="opacity-70 flex items-center justify-center w-8 h-8"
        >
          <ArrowRight size={22} />
        </button>
      </div>
    </section>
  );
};

export default Testimonials;
