import React from 'react';

import DriverImage from '../../assets/driverbadge.jpeg';
import MdPhoto from '../../assets/md-section/md-photo.png';
import StarIcon from '../../assets/Frame.png';
import QuoteIcon from "../../assets/md-section/quote.png";
import "./About.css";

const About: React.FC = () => {
  return (
<div className="w-full bg-white overflow-hidden font-sans mt-[-20px]">
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0">


        <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-8 items-start">

          {/* Left Text Content (Span 4 cols) */}
          <div className="md:col-span-4 lg:col-span-4 space-y-8 pr-4">
            <span className="text-[#49386D] font-bold tracking-wider text-sm uppercase">
              About Grace Cabs
            </span>
            {/* LEFT TITLE TEXT – TAB VIEW FIXED */}
            <h2
              className="
    text-4xl lg:text-5xl 
    font-bold text-[#0D0C22]
    leading-[1.1]

    max-[1023px]:max-w-[200px]     /* TAB only width reduce */
    max-[1023px]:text-3xl          /* TAB heading smaller */
    max-[1023px]:leading-[1.05]    /* TAB line height reduce */
  "
            >

              We Ensure
              <br />

              <span className="text-[#49386D] whitespace-nowrap">
                Seamless Service
              </span>
              <br />

              at all times
            </h2>


            <p className="text-gray-600 text-sm leading-relaxed text-justify">
              Grace Cabs is an affordable Car travels and car rentals service
              provider in Chennai, Tamil Nadu. With a variety of the latest cars
              and high petrol-efficiency cabs, we are your perfect choice when
              it comes to renting or hiring cars for pleasant vacations, tours
              and happy trips in Chennai or elsewhere in Tamil Nadu.
            </p>
          </div>

          {/* Center Image (Span 4 cols) */}
          <div
            className="
    md:col-span-4 lg:col-span-4
    flex justify-center 
    relative

    md:-mt-4 
    md:scale-[0.9]
    md:-mr-2
    md:translate-x-6    /* ⭐ MOVE RIGHT IN TAB VIEW */

    lg:mt-0 
    lg:scale-100
    lg:ml-0
  "
          >

          <div
  className="
    about-driver  
    relative 
    flex items-center justify-center

    w-[280px] h-[380px]
    sm:w-[300px] sm:h-[420px]
    md:w-[330px] md:h-[460px]
    lg:w-[360px] lg:h-[500px]

    rounded-[40px]       /* soft rounded – no cutting */
    overflow-hidden
    
  "
>
  <img
    src={DriverImage}
    className="w-full h-full object-contain"
  />
</div>


            {/* 20 Years Badge */}

          </div>

          {/* Right Text Content (Span 4 cols) */}
          <div
            className="
    md:col-span-4 lg:col-span-4 
    space-y-6 
    pl-0 md:pl-4 lg:pl-10 
    md:-mt-2 lg:-mt-4 
    pt-15

    max-[1023px]:space-y-4          /* TAB: reduce spacing */
    max-[1023px]:max-w-[650px]      /* TAB: shrink width */
    max-[1023px]:text-[14px]        /* TAB: shrink font size */
    max-[1023px]:leading-[1.2]      /* TAB: tighten line height */
  "
          >
            <h3
              className="
    text-3xl font-bold text-[#1a1a1a] leading-tight
max-[1023px]:text-2xl  
    max-[1023px]:text-[20px]       /* ⭐ Mobile/Tab smaller */
    max-[1023px]:leading-[1.15]
    max-[1023px]:text-left       /* ⭐ Center align */

    max-[1023px]:max-w-[260px]     /* ⭐ Better width */
  "
            >
              Affordable Car Travels <br />& Rentals in Chennai
            </h3>


            <div className="relative">
              <p
                className="
       

        text-gray-600 text-sm leading-relaxed text-justify
      "
              >
                We have a skilled and experienced team of drivers who are friendly,
                caring and professional, making them the perfect first-class drivers
                for your family and official trips.
              </p>
            </div>

            <h4
              className="
      text-2xl font-bold text-[#2D1E4E]

      max-[1023px]:text-xl            /* TAB smaller */
      max-[1023px]:max-w-[200px]
    "
            >
              We have more than <br />20 years of experience
            </h4>

            <ul className="space-y-3 max-[1023px]:space-y-2">
              <li className="flex items-center gap-3">
                <img src={StarIcon} className="w-5 h-5" />
                <span className="text-[#312782] font-semibold text-lg max-[1023px]:text-base">
                  Best Rate Guaranteed
                </span>
              </li>

              <li className="flex items-center gap-3">
                <img src={StarIcon} className="w-5 h-5" />
                <span className="text-[#312782] font-semibold text-lg max-[1023px]:text-base">
                  Variety Of Vehicle
                </span>
              </li>

              <li className="flex items-center gap-3">
                <img src={StarIcon} className="w-5 h-5" />
                <span className="text-[#312782] font-semibold text-lg max-[1023px]:text-base">
                  24X7 Customer Support
                </span>
              </li>
            </ul>
          </div>

        </div>
      </div>

    </div>
  );
};

export default About;