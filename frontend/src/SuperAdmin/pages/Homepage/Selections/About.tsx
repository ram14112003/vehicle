import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, Target, Award, Users, Phone, Mail, MapPin } from 'lucide-react';
import about from "../../../../assets/images/about1.jpg";

const About = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState({
    stats: false,
    md: false,
    vision: false,
    fleet: false,
    contact: false
  });

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const img = el.querySelector('.about-img') as HTMLElement | null;
    const txt = el.querySelector('.about-txt') as HTMLElement | null;

    let rafId: number | null = null;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      rafId = window.requestAnimationFrame(() => {
        ticking = false;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;

        const start = vh * 1.2;
        const end = vh * 0.15;
        const raw = (start - rect.top) / (start - end);
        const progress = Math.max(0, Math.min(1, raw));

        const maxTranslate = 180;
        const translate = maxTranslate * (1 - progress);
        const opacity = Math.min(1, Math.max(0, progress * 1.1));

        if (img) {
          img.style.transform = `translateY(${translate}px)`;
          img.style.opacity = `${opacity}`;
        }
        if (txt) {
          txt.style.transform = `translateY(${translate}px)`;
          txt.style.opacity = `${opacity}`;
        }

        if (progress >= 1) {
          window.removeEventListener('scroll', onScroll);
          window.removeEventListener('resize', onScroll);
          if (rafId) {
            window.cancelAnimationFrame(rafId);
            rafId = null;
          }
        }
      });
    };

    if (img) {
      img.style.transform = 'translateY(180px)';
      img.style.opacity = '0';
      img.style.transition = 'transform 0.9s ease-out, opacity 0.9s ease-out';
    }
    if (txt) {
      txt.style.transform = 'translateY(180px)';
      txt.style.opacity = '0';
      txt.style.transition = 'transform 0.9s ease-out, opacity 0.9s ease-out';
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target.getAttribute('data-section');
            if (target) {
              setIsVisible(prev => ({ ...prev, [target]: true }));
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    const sections = document.querySelectorAll('[data-section]');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-white">
      <style>{`
        @keyframes zoomInOut {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideFromLeft {
          from { transform: translateX(-100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideFromRight {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideFromBottom {
          from { transform: translateY(80px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-zoom { animation: zoomInOut 0.8s ease-out forwards; }
        .animate-left { animation: slideFromLeft 1s ease-out forwards; }
        .animate-right { animation: slideFromRight 1s ease-out forwards; }
        .animate-bottom { animation: slideFromBottom 1s ease-out forwards; }
      `}</style>

      {/* Hero About Section */}
      <section id="about" ref={sectionRef} className="relative py-16 overflow-hidden bg-white">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(39,89,129,0.1) 0%, transparent 50%)' }}></div>
        </div>
        <div className="container mx-auto px-6 lg:px-16 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="about-img relative">
              <div className="absolute -inset-4 bg-white rounded-3xl blur-xl"></div>
             <img
  src={about}
  alt="Highway Traffic"
  className="relative w-full h-72 md:h-96 rounded-2xl object-cover"
/>

              <div className="absolute -bottom-4 -right-4 bg-white text-[#275981] p-4 rounded-xl shadow-2xl border-2 border-[#275981]">
                <div className="text-2xl font-bold">20+</div>
                <div className="text-xs font-semibold">Years Experience</div>
              </div>
            </div>
            <div className="about-txt space-y-4 text-gray-800">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-[#275981]">
                Easy <span className="text-green-600">Ride</span>
              </h2>
              <div className="w-20 h-1 bg-green-600"></div>
              <p className="text-lg md:text-xl font-semibold text-green-600">
                Affordable car travels and rentals in Chennai
              </p>
              <p className="text-gray-700 leading-relaxed">
                EasyRide is an affordable Car travels and car rentals service provider in Chennai, Tamil Nadu. With a variety of the latest cars and high petrol-efficiency cabs, we are your perfect choice when it comes to renting or hiring cars for pleasant vacations, tours and happy trips in Chennai or elsewhere in Tamil Nadu.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We have a skilled and experienced team of drivers who are friendly, caring and professional, making them the perfect first-class drivers for your family and official trips. We specialize in renting and providing cars for hire in Chennai, Tamil Nadu.
              </p>
            </div>
          </div>
        </div>
      </section>

      

      {/* Message from MD Section */}
      <section data-section="md" className="py-12 bg-white">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="max-w-5xl mx-auto">
            <h2 className={`text-3xl md:text-4xl font-bold text-center mb-8 ${isVisible.md ? 'animate-zoom' : 'opacity-0'}`} style={{ color: '#275981' }}>
              Message from Managing Director
            </h2>
            <div className={`bg-gray-50 rounded-2xl shadow-xl p-6 md:p-8 border-l-4 ${isVisible.md ? 'animate-bottom' : 'opacity-0'}`} style={{ borderColor: '#275981', animationDelay: '0.3s' }}>
              <div className="flex items-center gap-3 mb-5">
                <Users className="w-7 h-7" style={{ color: '#275981' }} />
                <h3 className="text-xl font-bold" style={{ color: '#275981' }}>Dr. Robert Jayakumar</h3>
              </div>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p className="italic text-gray-800 border-l-4 border-green-500 pl-4 bg-green-50 py-2">
                  On behalf of the entire team at EasyRide Private Limited, I am thrilled to welcome you to our world of exceptional travel experiences. We are a premier travel company dedicated to crafting unforgettable journeys tailored to your unique preferences and desires.
                </p>
                <p>
                  EasyRide Private Limited is the leading provider of premium integrated end-to-end transportation solutions for the corporate sector across the metro cities in Southern India. Since its establishment in 2003, EasyRide has been committed to providing unparalleled travel arrangements that cater to the individual needs and preferences of our clients.
                </p>
                <p>
                  We provide a wide range of services covering most needs of corporates — car rentals, business transport solutions, long term rentals, and daily & monthly packages. With passenger safety and comfort as our top priorities, we have invested in technology and provide several unique value-added offerings. Some of these include real-time tracking and updates on cab booking, GPS based trip tracking, transparent billing, user friendly App and 24 X 7 customer service.
                </p>
                <p>
                  As we move forward, we are excited to continue expanding our offerings and enhancing our services. We are committed to staying at the forefront of the travel industry, embracing innovation and constantly seeking new ways to elevate your travel experiences.
                </p>
                <p className="font-medium text-gray-800">
                  We look forward to building lasting relationships with you and assisting you in seamless travel experiences.
                </p>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="italic text-gray-600">Sincerely,</p>
                  <p className="font-bold mt-2" style={{ color: '#275981' }}>Dr. Robert Jayakumar</p>
                  <p className="text-sm text-gray-600">Managing Director</p>
                  <p className="text-xs text-gray-500">EasyRide Private Limited</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Vision, Mission and Values Section */}
      <section data-section="vision" className="py-16 relative overflow-hidden bg-gray-50">
        <div className="container mx-auto px-6 lg:px-16 relative z-10">
          <h2 className={`text-3xl md:text-4xl font-bold text-center mb-3 ${isVisible.vision ? 'animate-zoom' : 'opacity-0'}`} style={{ color: '#275981' }}>
            Vision, Mission and Values
          </h2>
          <div className={`w-24 h-1 mx-auto mb-12 ${isVisible.vision ? 'animate-zoom' : 'opacity-0'}`} style={{ background: '#275981', animationDelay: '0.2s' }}></div>
          
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            {/* Vision Card */}
            <div className={`bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300 border-2 ${isVisible.vision ? 'animate-left' : 'opacity-0'}`} style={{ borderColor: '#275981', animationDelay: '0.4s' }}>
              <div className="flex flex-col items-center text-center mb-4">
                <Target className="w-16 h-16 mb-3" style={{ color: '#275981', strokeWidth: 1.5 }} />
                <h3 className="text-xl font-bold" style={{ color: '#275981' }}>Vision</h3>
              </div>
              <p className="text-gray-700 leading-relaxed text-center text-sm">
                Our vision is to be recognized as best option for one stop solution in regards of transport and Transport related services by offering adequate, prompt, professional, complied, safe and time bound travel solutions. End to end transport solution for cooperates is one of our USP.
              </p>
            </div>

            {/* Mission Card */}
            <div className={`bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300 border-2 border-green-600 ${isVisible.vision ? 'animate-bottom' : 'opacity-0'}`} style={{ animationDelay: '0.6s' }}>
              <div className="flex flex-col items-center text-center mb-4">
                <Award className="w-16 h-16 text-green-600 mb-3" style={{ strokeWidth: 1.5 }} />
                <h3 className="text-xl font-bold text-green-600">Mission</h3>
              </div>
              <p className="text-gray-700 leading-relaxed text-center text-sm">
                The mission is to be the leading cab service provider in corporate transport services (monthly contracts and on call requirements) by using most progressive available technology, efficient & trained chauffeurs, decently maintained fleet, and time honoured deliverable.
              </p>
            </div>

            {/* Values Card */}
            <div className={`bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300 border-2 border-purple-600 ${isVisible.vision ? 'animate-right' : 'opacity-0'}`} style={{ animationDelay: '0.8s' }}>
              <div className="flex flex-col items-center text-center mb-4">
                <CheckCircle className="w-16 h-16 text-purple-600 mb-3" style={{ strokeWidth: 1.5 }} />
                <h3 className="text-xl font-bold text-purple-600">Values</h3>
              </div>
              <div className="space-y-2 text-gray-700">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-xs leading-relaxed">Smiling & happy people working for us ensuring maximum satisfaction to clients</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-xs leading-relaxed">We promise to deliver a quality experience superior to any other</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-xs leading-relaxed">To provide our clients best cost effective transport solutions as per market standard</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-xs leading-relaxed">Transparent and ethical association with our manpower as well as our clients</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-xs leading-relaxed">Best wave off money spent on our services</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      
    </div>
  );
};

export default About;




