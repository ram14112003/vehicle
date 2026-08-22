import React, { useState } from "react";
import service1 from "../../../../assets/images/service/service1.jpeg";
import service2 from "../../../../assets/images/service/service2.jpeg";
import service3 from "../../../../assets/images/service/service3.jpeg";
import service4 from "../../../../assets/images/service/service4.jpeg";

const Services = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [modalIndex, setModalIndex] = useState<number | null>(null);

const services = [
  { 
    img: service1, // ✅ string path
    title: "Fleet Management System", 
    description: "The Fleet Management division of EasyRide today manages Fleet of approximate 400 Vehicles, which comprises of 150 Company owned fleet and 250 associates vehicle. These fleets include 135 Sedan Cabs, 75 SUV, 130 LMV and 60 Buses. Our fleet is Equipped with real-time GPS Tracking, Communication and Information System. Our Constant endeavour in pursuit of excellence is aimed." 
  },

  { 
    img: service2, 
    title: "Rent A Car", 
    description: "Trusted Car Rental Service With Over 20 Yrs Of Expertise." 
  },
  { 
    img: service3, 
    title: "Premium Fleet", 
    description: "Well-maintained transport-permit vehicles on road-worthy condition and not more than 48 months old are deployed on site. Vehicles are marked with company logo for identification."
  },
  { 
    img: service4, 
    title: "Professional Chauffeurs", 
    description: "Uniformed and experienced Chauffeurs with identity cards are appointed for each vehicle operating on a particular site."
  },
];


  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section id="services" className="py-24 bg-gradient-to-br from-blue-50 via-white to-green-50 relative overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-[#0b2c6b] via-blue-700 to-green-600 bg-clip-text text-transparent mb-6 animate-fade-in">
            Our Premium Services
          </h2>
          <p className="text-gray-700 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Experience world-class transportation solutions powered by innovation, reliability, and professional excellence
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {services.map((service, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <div 
                key={index}
                className="group relative bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 animate-slide-up"
              >
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={service.img} 
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-125 group-hover:rotate-2 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                </div>

                <div className="p-6 relative">
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-[#0b2c6b] group-hover:text-green-600 transition-colors duration-300 relative">
  {service.title.split(' ').map((word, idx) => (
    <div key={idx}>{word}</div>
  ))}
</h3>


                  {/* Content for mobile inline */}
                  <p className={`text-gray-600 text-sm md:text-base leading-relaxed transition-all duration-500 lg:hidden ${!isExpanded ? "line-clamp-4" : ""}`}>
                    {service.description}
                  </p>

                  {/* View More button */}
                  <button
                    onClick={() => {
                      if(window.innerWidth >= 1024){ // Desktop/Laptop only
                        setModalIndex(index);
                      } else {
                        toggleExpand(index);
                      }
                    }}
                    className="mt-3 text-green-600 font-semibold text-sm hover:text-green-700 transition-colors"
                  >
                    {isExpanded || modalIndex === index ? "View Less ▲" : "View More ▼"}
                  </button>

                  {/* Bottom hover line */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-green-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for desktop */}
      {modalIndex !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 relative shadow-2xl">
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 font-bold text-xl"
              onClick={() => setModalIndex(null)}
            >
              ×
            </button>
            <h3 className="text-2xl font-bold mb-4 text-[#0b2c6b]">
              {services[modalIndex].title}
            </h3>
            <p className="text-gray-700 text-base leading-relaxed">
              {services[modalIndex].description}
            </p>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.6s ease-out forwards; }
        .animate-fade-in { animation: fade-in 1s ease-out; }
        .line-clamp-4 { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
      `}} />
    </section>
  );
};

export default Services;
