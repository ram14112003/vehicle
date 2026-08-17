import React from "react";

import Img1 from "../../assets/whychoose/1.png";
import Img2 from "../../assets/whychoose/2.png";
import Img3 from "../../assets/whychoose/3.png";
import Img4 from "../../assets/whychoose/4.png";

import Icon1 from "../../assets/whychoose/icons/professional.png";
import Icon2 from "../../assets/whychoose/icons/punctual.png";
import Icon3 from "../../assets/whychoose/icons/custom.png";
import Icon4 from "../../assets/whychoose/icons/global.png";

const WhyChoose: React.FC = () => {
  return (
    <section className="w-full bg-white py-1 px-6 md:px-10 lg:px-16">
      <div className="max-w-[1400px] mx-auto">

        {/* TOP HEADING */}
        <div className="text-center mb-12">
          <h4 className="text-[#49386D] tracking-wider font-semibold uppercase text-sm">
            About Grace Cabs
          </h4>

          <h2 className="text-3xl md:text-5xl font-bold text-[#0D0C22] mt-2">
            Why Choose Grace Cabs
          </h2>
        </div>

        {/* MAIN GRID */}
<div className="hidden lg:grid grid-cols-3 gap-12">

          {/* LEFT IMAGE GRID */}
{/* LEFT IMAGE LAYOUT (Spanning 1 column for alignment, but using absolute/relative positioning internally) */}
          <div className="lg:col-span-1 relative h-[550px] mx-auto w-full max-w-[400px] pr-[100px]">

            {/* Decorative Shapes - Top Left */}
            {/* Large Blue Circle Outline */}
            <div className="absolute top-0 right-160 w-47 h-47 border-2 border-[#284580] rounded-full"></div>
            
            {/* Image 1: Top Left - Larger */}
            <img
              src={Img1}
              alt="Man working on laptop in car"
              className="absolute top-10 right-130 rounded-xl w-[240px] h-[290px] object-cover shadow-lg"
            />

            {/* Image 2: Top Right - Medium */}
            <img
              src={Img2}
              alt="Hand holding phone with app"
              className="absolute top-0 right-80 rounded-xl w-[160px] h-[200px] object-cover shadow-lg"
            />

            {/* Image 3: Bottom Left - Medium */}
            <img
              src={Img3}
              alt="Man talking on phone smiling"
              className="absolute bottom-0 right-130 rounded-xl w-[160px] h-[190px] object-cover shadow-lg"
            />

            {/* Image 4: Bottom Right - Larger */}
            <img
              src={Img4}
              alt="Man talking on phone laughing"
              className="absolute bottom-0 right-60 rounded-xl w-[220px] h-[290px] object-cover shadow-lg"
            />

            {/* Decorative Shapes - Bottom Left */}
            {/* Yellow Square Dots (Grid) */}
{/*             <div className="absolute bottom-[-15px] right-[20px] grid grid-cols-4 gap-1 transform rotate-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-2 h-2 bg-[#FFD700] rounded-sm opacity-80"></div>
              ))}
            </div> */}
          </div>


         

          {/* RIGHT FEATURE LIST */}
 <div className="space-y-10 -ml-34 ">


            {/* Feature Item */}
            <div className="flex gap-5 items-start ">
              <div className="p-4 bg-[#284580] border border-[#284580] rounded-xl">
                <img src={Icon1} className="w-7 h-7 object-contain" />
              </div>
              <div>
                <h3 className="text-[#0D0C22] font-bold text-xl">
                  Professionalism
                </h3>
                <p className="text-gray-600 mt-1 text-sm leading-relaxed">
                  Uniformed chauffeurs, discreet and strict confidentiality.
                </p>
              </div>
            </div>

            <div className="flex gap-5 items-start">
              <div className="p-4 bg-[#284580] border border-[#284580] rounded-xl">
                <img src={Icon2} className="w-7 h-7 object-contain" />
              </div>
              <div>
                <h3 className="text-[#0D0C22] font-bold text-xl">
                  Punctuality
                </h3>
                <p className="text-gray-600 mt-1 text-sm leading-relaxed">
                  Industry-leading on-time performance with proactive delay
                  management.
                </p>
              </div>
            </div>

            <div className="flex gap-5 items-start">
              <div className="p-4 bg-[#284580] border border-[#284580] rounded-xl">
                <img src={Icon3} className="w-7 h-7 object-contain" />
              </div>
              <div>
                <h3 className="text-[#0D0C22] font-bold text-xl">
                  Customization
                </h3>
                <p className="text-gray-600 mt-1 text-sm leading-relaxed">
                  Tailored service packages aligned with corporate travel
                  policies.
                </p>
              </div>
            </div>

            <div className="flex gap-5 items-start">
              <div className="p-4 bg-[#284580] border border-[#284580] rounded-xl">
                <img src={Icon4} className="w-7 h-7 object-contain" />
              </div>
              <div>
                <h3 className="text-[#0D0C22] font-bold text-xl">
                  Global Standards
                </h3>
                <p className="text-gray-600 mt-1 text-sm leading-relaxed">
                  Benchmarked against international transportation best
                  practices.
                </p>
              </div>
            </div>

          </div>
        </div>

         {/* ===================== MOBILE + TABLET (BELOW LG) ===================== */}
        <div className="lg:hidden space-y-12">

          {/* 2×2 IMAGE GRID */}
          <div className="grid grid-cols-2 gap-4">
            <img src={Img1} className="w-full h-44 object-cover rounded-xl shadow" />
            <img src={Img2} className="w-full h-44 object-cover rounded-xl shadow" />
            <img src={Img3} className="w-full h-44 object-cover rounded-xl shadow" />
            <img src={Img4} className="w-full h-44 object-cover rounded-xl shadow" />
          </div>

       <style>
  {`
    @media (max-width: 1024px) {
      .mobile-features {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .mobile-features .flex {
        justify-content: center;
      }
        .icon-box {
    width: 60px;
    height: 60px;
  }

  .icon-img {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }
    }
  `}
</style>

{/* CONTENT BELOW IMAGES */}
<div className="mobile-features space-y-8">

  <div className="flex gap-5">
    <div className="p-4 bg-[#284580] rounded-xl">
      <img src={Icon1} className="w-7 h-7 icon-img" />
    </div>
    <div>
      <h3 className="font-bold text-lg">Professionalism</h3>
      <p className="text-gray-600 text-sm">Uniformed chauffeurs.</p>
    </div>
  </div>

  <div className="flex gap-5">
    <div className="p-4 bg-[#284580] rounded-xl">
      <img src={Icon2} className="w-7 h-7 icon-img" />
    </div>
    <div>
      <h3 className="font-bold text-lg">Punctuality</h3>
      <p className="text-gray-600 text-sm">On-time performance.</p>
    </div>
  </div>

  <div className="flex gap-5">
    <div className="p-4 bg-[#284580] rounded-xl mr-3">
      <img src={Icon3} className="w-7 h-7 icon-img" />
    </div>
    <div>
      <h3 className="font-bold text-lg ">Customization</h3>
      <p className="text-gray-600 text-sm">Corporate needs.</p>
    </div>
  </div>

  <div className="flex gap-5">
    <div className="p-4 bg-[#284580] rounded-xl ml-3">
      <img src={Icon4} className="w-7 h-7 icon-img " />
    </div>
    <div>
      <h3 className="font-bold text-lg">Global Standards</h3>
      <p className="text-gray-600 text-sm">Worldwide quality.</p>
    </div>
  </div>

</div>

        </div>

      </div>
    </section>
  );
};

export default WhyChoose;
