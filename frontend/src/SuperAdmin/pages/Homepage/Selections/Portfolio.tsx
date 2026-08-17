import React, { useEffect, useRef, useState } from 'react';
import PORTFOLIO1 from "../../../../assets/images/PORTFOLIO/PORTFOLIO1.jpg";
import PORTFOLIO2 from "../../../../assets/images/PORTFOLIO/PORTFOLIO2.jpg";
import PORTFOLIO3 from "../../../../assets/images/PORTFOLIO/PORTFOLIO3.jpg";
import PORTFOLIO4 from "../../../../assets/images/PORTFOLIO/PORTFOLIO4.png";
import PORTFOLIO5 from "../../../../assets/images/PORTFOLIO/PORTFOLIO5.png";

const vehicles = [
  { img: PORTFOLIO1, name: 'Ertiga' },
  { img: PORTFOLIO2, name: 'Tempo Traveller' },
  { img: PORTFOLIO3, name: 'XUV 500' },
  { img: PORTFOLIO4, name: 'Innova' },
  { img: PORTFOLIO5, name: 'Sedan' },
  { img: PORTFOLIO4, name: 'Innova' }, 
];


const Portfolio: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} id="portfolio" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h3 className="text-3xl font-bold text-[#0b2c6b] mb-2">
          OUR PORTFOLIO - VEHICLES
          <div className="w-16 h-1 bg-green-600 mt-2"></div>
        </h3>
        <p className="text-gray-600 mb-12 mt-4">We offer vehicles across all segments</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
          {vehicles.map((v, i) => (
            <div 
              key={i} 
              className="text-center group cursor-pointer"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(80px)',
                transition: `all 0.6s ease-out ${i * 0.1}s`
              }}
            >
              <div className="transition-transform duration-300 ease-out group-hover:-translate-y-3">
               <img 
  src={v.img} 
  alt={v.name} 
  className="w-full h-48 md:h-56 object-contain" 
/>

              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;