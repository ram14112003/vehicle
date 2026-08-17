import Img1 from "../../assets/services/1.png";
import Img2 from "../../assets/services/2.png";
import Img3 from "../../assets/services/3.png";
import Img4 from "../../assets/services/4.png";

import HeadingPng from "../../assets/services/text.png";
import HeadingPng2 from "../../assets/services/text2.png";

const services = [
  { id: 1, img: Img1, title: "Fleet Management System" },
  { id: 2, img: Img2, title: "Rent a Car" },
  { id: 3, img: Img3, title: "Premium Fleet" },
  { id: 4, img: Img4, title: "Professional Chauffeurs" },
];

// FULL backside details
const details = [
  "The Fleet Management division of Grace Cabs manages approx 400 Vehicles: 150 company-owned and 250 associate vehicles. Includes 135 Sedan cabs, 75 SUVs, 130 LMVs, 60 Buses. Fleet equipped with GPS tracking, communication & information system.",
  "Trusted Car Rental Service with over 20 years of expertise.",
  "Transport-permit vehicles in road-worthy condition, not older than 48 months, deployed with company logo for identification.",
  "Uniformed and experienced chauffeurs with identity cards appointed for all operating sites.",
];

const PremiumServices: React.FC = () => {
  return (
    <section className="w-full bg-white pt-5 relative">

      {/* TOP HEADING */}
      <div className="text-center mb-28 relative">
        <h4 className="text-[#49386D] font-semibold text-sm uppercase tracking-widest">
          Services
        </h4>

        <h2 className="text-3xl md:text-5xl font-bold text-[#0D0C22] mt-2">
          Our Premium Services
        </h2>

        <p className="text-gray-600 max-w-2xl mx-auto mt-4 text-sm md:text-base leading-relaxed">
          Experience world-class transportation solutions powered by innovation,
          reliability, and professional excellence
        </p>
      </div>

      {/* BLUE SECTION */}
      <div className="w-full bg-[#243B7B] pt-16 pb-28 rounded-t-[55px] relative">

        {/* CARDS */}
        <div className="flex justify-center gap-8 px-6 flex-wrap -mt-28">

       {services.map((item, index) => (
  <div
    key={item.id}
 className={`
  perspective 
  w-[230px] h-[310px]
  cursor-pointer 
  ${index === 0 ? "-mt-6" : ""}
  ${index === 1 ? "mt-6 mb-6" : ""}
  ${index === 2 ? "mb-6" : ""}
  ${index === 3 ? "mt-6" : ""}
`}
  >
    <div className="
      relative w-full h-full 
      transition-transform duration-700 
      preserve-3d group 
      hover:[transform:rotateY(180deg)]
    ">

      {/* FRONT SIDE */}
      <div className="
        absolute inset-0 
        backface-hidden 
        rounded-2xl overflow-hidden shadow-lg
      ">
        <img
          src={item.img}
          className="w-full h-full object-cover duration-300 group-hover:scale-105"
        />
        <div className="absolute bottom-0 left-0 w-full h-[40%] bg-gradient-to-t from-[#312782] to-transparent"></div>
        <h3 className="absolute bottom-6 left-4 text-white font-semibold text-[18px]">
          {item.title}
        </h3>
      </div>

      {/* BACK SIDE */}
      <div className="
        absolute inset-0 
        rounded-2xl shadow-xl p-5 
        bg-[#312782] text-white text-sm 
        leading-relaxed 
        backface-hidden 
        [transform:rotateY(180deg)]
        overflow-y-auto
      ">
        {details[index]}
      </div>

    </div>
  </div>
))}


        </div>

        {/* PNG HEADING */}
        <img
          src={HeadingPng}
          className="mx-auto mt-12 w-[90%] md:w-[70%] lg:w-[55%]"
        />

        <img
          src={HeadingPng2}
          className="mx-auto mt-12 w-[70%] md:w-[60%] lg:w-[45%]"
        />
      </div>
    </section>
  );
};

export default PremiumServices;
