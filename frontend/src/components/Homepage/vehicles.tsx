import React from "react";

// 👉 Real imports
import img6 from "../../assets/vehicles/img1.png";
import img3 from "../../assets/vehicles/img2.png";
import img2 from "../../assets/vehicles/img3.png";
import img5 from "../../assets/vehicles/img4.png";
import img4 from "../../assets/vehicles/img5.png";
import img1 from "../../assets/vehicles/img6.png";

const vehicles = [
  { title: "Sedan Cars", img: img1, bg: "#CAD7F5" },
  { title: "SUV Cars", img: img2, bg: "#BCDCC0" },
  { title: "Luxury Cars", img: img3, bg: "#E0CEBE" },
  { title: "Premium Traveler Van", img: img4, bg: "#CED9D6" },
  { title: "Traveler Van", img: img5, bg: "#F4E7C9" },
  { title: "Bus", img: img6, bg: "#DCE7F3" },
];

export default function PremiumVehicles() {
  return (
    <div className="w-full mx-auto px-4 mt-20">

      {/* ⭐ Heading */}
      <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
        <h3 className="text-[#352E6B] font-semibold tracking-widest uppercase text-sm md:text-base">
          Our Portfolio
        </h3>

        <h2 className="text-3xl md:text-5xl font-bold text-slate-900">
          Our Premium Vehicles
        </h2>

        <p className="text-slate-600 text-lg md:text-xl leading-relaxed">
          We have a diverse fleet, ranging from sedans, SUVs, and travelers to luxury coaches,
          ensuring convenience for your transportation needs.
        </p>
      </div>

      {/* ⭐ Responsive Vehicle Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {vehicles.map((v, i) => (
         <div
  key={i}
  style={{ backgroundColor: v.bg }}
  className="
    group 
    rounded-3xl
    p-5 
    h-[200px] 
    sm:h-[220px]
    lg:h-[240px]
    flex 
    flex-col 
    justify-between
    overflow-hidden
    relative
    transition-all 
    duration-300 
    cursor-pointer
  "
>
  <h3 className="text-lg sm:text-xl font-semibold">{v.title}</h3>

  <img
    src={v.img}
    alt={v.title}
    className="
      w-[160px]
      sm:w-[190px]
      lg:w-[230px]
      absolute
      bottom-2
      right-2
      transition-all duration-500

      /* ⭐ Animation ALL SCREEN SIZES */
      group-hover:-translate-x-10
      group-hover:scale-[1.10]
    "
  />
</div>

        ))}
      </div>

{/* ⭐ Blue Section – Full width but with small side margins */}
{/* <div className="w-full px-2 sm:px-6 lg:px-10 mt-24 mb-20">

  <div className="bg-[#DFE8FF] rounded-3xl py-20 max-w-7xl mx-auto px-6 text-center shadow-sm">
    <h2 className="text-4xl md:text-6xl font-bold text-[#0F0F2D]">
      Wide Range Of Cars
    </h2>

    <p className="text-gray-700 mt-6 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
      Grace Cab offers a wide range of makes and models across our service locations.
      Choose comfort, style, and safety — all at competitive prices.
    </p>
  </div>

</div> */}


    </div>
  );
}
