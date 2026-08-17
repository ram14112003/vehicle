import React from 'react';
import Quote from '../../assets/md-section/quote.png';
import mdphoto from '../../assets/md-section/md-photo.png';
import line from '../../assets/md-section/left-curve.png';
import "./About.css";

const MDMessageSection: React.FC = () => {
  return (
    <div className="w-full flex justify-center items-center px-3 sm:px-6 pb-0 lg:pb-0 md-section">

      <div
        className="relative w-full max-w-[1500px] bg-[#F5F5F5] rounded-2xl lg:rounded-3xl shadow-md p-4 sm:p-6 lg:px-10 lg:pt-10 pb-0"
      >
        {/* QUOTE ICON */}
        <div className="hidden lg:block absolute -top-24 left-60 w-24">
          <img src={Quote} alt="Quote" className="w-full" />
        </div>

        {/* MD PHOTO */}
        <div className="absolute md-photo-wrap -top-12 left-1/2 -translate-x-1/2 sm:-top-16 sm:left-8 sm:translate-x-0 lg:-top-20 lg:left-[19.5rem]">
          <img
            src={mdphoto}
            alt="MD"
            className="md-photo-image w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-lg object-cover shadow-md"
          />
        </div>

        {/* CONTENT WRAPPER */}
        <div
          className="
            flex flex-col lg:flex-row gap-6 lg:gap-20 mt-12 sm:mt-16 
            max-[1023px]:mt-6 lg:mt-20 
            max-[1023px]:items-center max-[1023px]:justify-center max-[1023px]:text-center
            tab-md:items-center tab-md:justify-center tab-md:text-center
            tab-md:px-0 tab-md:overflow-hidden md-wrapper "
          
        >

          {/* LEFT AREA */}
<div className="w-full lg:w-1/3 flex flex-col relative md:-mb-65 md-left-section">

            {/* LINE IMAGE */}
            <div className="hidden lg:block pl-10">
              <img
                src={line}
                alt="line"
                className="h-full min-h-[130px]"
                style={{ position: "relative", top: "-95px", left: "-16px" }}
              />
            </div>

            {/* TITLE */}
            <div className="md-title text-center sm:text-left lg:pl-15 lg:relative lg:-top-[400px] max-[1023px]:text-center max-[1023px]:mt-4">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                Message from <br /> Managing Director
              </h2>
            </div>

            {/* INFO BOX */}
            <div
              className="md-info-box bg-[#DFE8FF] rounded-xl shadow-sm p-4 sm:p-6 w-full sm:max-w-[350px] lg:w-[350px] mt-4 sm:mt-6 lg:mt-0 mx-auto sm:mx-0 lg:relative lg:-top-[348px] lg:left-[40px]"
            >
              <p className="text-[#0D0C22] italic text-base sm:text-lg leading-relaxed font-Mona Sans">
                We look forward to building lasting relationships with you and
                assisting you in seamless travel experiences.
              </p>
            </div>

          </div>

          {/* RIGHT CONTENT */}
<div className="md-right-block w-full lg:w-2/3 pb-2 mt-6 lg:mt-0">
<div className="md-name-block mb-6 lg:mb-8">
  <h3 className="text-lg sm:text-xl font-bold text-blue-900">
    Dr. Robert Jayakumar
  </h3>
  <p className="text-sm text-slate-600 font-medium">Managing Director</p>
  <p className="text-xs text-slate-500">Grace Cabs Private Limited</p>
</div>

           

            <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
              <p >
                On behalf of the entire team at Grace Cabs Private Limited, I am
                thrilled to welcome you to our world of exceptional travel
                experiences.
              </p>
              <p >
                We are a premier travel company dedicated to crafting unforgettable
                journeys tailored to your unique preferences and desires.
              </p>
             
              <p>
                Grace Cabs Private Limited is the leading provider of premium
                integrated end-to-end transportation solutions for the corporate
                sector across the metro cities in Southern India. Since its
                establishment in 2003, Grace Cabs has been committed to providing
                unparalleled travel arrangements that cater to the individual needs
                and preferences of our clients.
              </p>
              <p>
                We provide a wide range of services covering most needs of
                corporates — car rentals, business transport solutions, long term
                rentals, and daily & monthly packages. With passenger safety and
                comfort as our top priorities, we have invested in technology and
                provide several unique value-added offerings.
              </p>
              <p>
                As we move forward, we are excited to continue expanding our
                offerings and enhancing our services.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default MDMessageSection;
