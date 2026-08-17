import React, { useEffect, useState } from "react";
import {
  Header,
  About,
  Services,
  Clients,
  Portfolio,
  Testimonials,
  Branches,
  Contact,
  Footer,
} from "./Selections";
import './home.css';
import car1 from "../../../assets/images/home/car1.png";
import car2 from "../../../assets/images/home/car2.png";
import car3 from "../../../assets/images/home/car3.png";
import car4 from "../../../assets/images/home/car4.png";

const GraceCab: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const images = [car4, car3, car2, car1];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

  return (
    <div className="bg-white scroll-smooth">
      <Header />
      <div id="home" />

      {/* Hero Section */}
      <section className="relative w-full overflow-hidden hero-section">
        {/* Slides */}
        <div className="absolute inset-0">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                currentSlide === idx
                  ? "opacity-100 z-10"
                  : "opacity-0 z-0 pointer-events-none"
              }`}
              aria-hidden={currentSlide !== idx}
            >
              <img
                src={img}
                alt={`Car ${idx + 1}`}
                className="w-full h-full object-cover object-center"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/60"></div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="absolute inset-0 z-20 flex items-center justify-start">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-2xl text-left hero-content">
              <h2
                className={`hero-heading text-white font-extrabold mb-3 transform translate-x-6 opacity-0 animate-slideRight`}
                style={{ ...delay(200) }}
              >
                WIDE RANGE OF CARS
              </h2>

              <div
                className={`hero-sub inline-block px-5 py-2 mb-3 rounded-md font-semibold shadow-lg opacity-0 transform translate-x-6 animate-slideRight`}
                style={{ ...delay(500) }}
              >
                THIS IS WHAT YOU WERE LOOKING FOR!
              </div>

              <p
                className={`hero-text text-white opacity-0 transform translate-x-6 animate-slideRight`}
                style={{ ...delay(850) }}
              >
                Grace Cab offers a wide range of makes and models across our
                service locations. Choose comfort, style, and safety — all at
                competitive prices.
              </p>
            </div>
          </div>
        </div>

        {/* Slider Dots */}
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 z-30 flex space-x-2">
          {images.map((_, idx) => (
            <span
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ${
                currentSlide === idx ? "bg-blue-500 scale-110" : "bg-gray-300"
              }`}
            ></span>
          ))}
        </div>
      </section>

      {/* Sections */}
      <section id="about" className="pt-8"><About /></section>
      <section id="services" className="pt-8"><Services /></section>
      <section id="clients" className="pt-8"><Clients /></section>
      <section id="portfolio" className="pt-8"><Portfolio /></section>
      <section id="testimonials" className="pt-8"><Testimonials /></section>
      <section id="branches" className="pt-8"><Branches /></section>
      <section id="contact" className="pt-8"><Contact /></section>
      <Footer />
    </div>
  );
};

export default GraceCab;
