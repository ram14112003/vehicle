import React, { useState } from "react";
import { Menu, X, Mail, Phone } from "lucide-react";
import gracelogo from "../../../../assets/images/gracelogo.png";

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  // 🔹 Scroll to section smoothly
  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      const headerOffset = 80; // approximate header height (adjust if needed)
      const elementPosition = section.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerOffset;

      // mobile menu close aagitu apram scroll pannum
      setIsOpen(false);

      // thodarum scroll with small delay for menu close
      setTimeout(() => {
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }, 100); // 100ms delay enough
    }
  };


  return (
    <header className="w-full sticky top-0 z-50 bg-white shadow-sm">
      {/* 🔹 Top Contact Bar */}
      <div className="w-full bg-[#f8f9fa] border-b border-gray-200 text-sm">
        <div className="container mx-auto px-4 py-1 flex flex-col sm:flex-row justify-between items-center text-gray-700">
          {/* Left side - email */}
          <div className="flex items-center space-x-2 mb-1 sm:mb-0">
            <Mail size={14} className="text-green-600" />
            <a
              href="mailto:traveldesk@gracecabs.com"
              className="hover:text-green-600 text-[13px]"
            >
              traveldesk@gracecabs.com
            </a>
          </div>

          {/* Right side - phone numbers */}
          <div className="flex items-center space-x-2">
            <Phone size={14} className="text-green-600" />
            <a
              href="tel:9841722675"
              className="hover:text-green-600 text-[13px]"
            >
              +91 98417 22675
            </a>
            <span className="text-gray-400">/</span>
            <a
              href="tel:9003241571"
              className="hover:text-green-600 text-[13px]"
            >
              +91 90032 41571
            </a>
          </div>
        </div>
      </div>

      {/* 🔹 Main Header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo + Name */}
          <div className="flex items-center space-x-2">
            <img
              src={gracelogo}
              alt="Grace Cab Logo"
              className="pr-8 w-24 h-15 object-contain"
            />
            <h1 className="text-xl font-bold text-gray-800">
              GRACE <span className="text-green-600">CABS</span>
            </h1>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => scrollToSection("home")}
              className="text-gray-600 hover:text-green-600"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="text-gray-600 hover:text-green-600"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("services")}
              className="text-gray-600 hover:text-green-600"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection("portfolio")}
              className="text-gray-600 hover:text-green-600"
            >
              Portfolio
            </button>
            <button
              onClick={() => scrollToSection("branches")}
              className="text-gray-600 hover:text-green-600"
            >
              Branches
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-gray-600 hover:text-green-600"
            >
              Contact
            </button>
            <button
              onClick={() => window.location.href = "/adminlogin"}
              className="ml-4 bg-gradient-to-r from-[#275981] to-[#1e4565] hover:from-[#1e4565] hover:to-[#16344d] text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              Login
            </button>

          </nav>

          {/* Mobile Toggle Button */}
          <button
            className="md:hidden text-gray-800 focus:outline-none"
            onClick={toggleMenu}
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

  {isOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={toggleMenu}
            ></div>
            
            {/* Sliding Menu from Left - Auto Height */}
            <div
              className={`fixed top-0 left-0 right-0 bg-white text-black transform transition-transform duration-300 ease-in-out shadow-lg ${isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
              {/* Logo + GRACE CABS */}
              <div className="flex items-center justify-start p-4 border-b border-gray-200 space-x-3">
                <img src={gracelogo} alt="Logo" className="w-20 h-auto object-contain" />
                <h1 className="text-xl font-extrabold text-black">
                  GRACE <span className="text-green-600">CABS</span>
                </h1>
              </div>

              {/* Close button */}
              <div className="absolute top-4 right-4">
                <button onClick={toggleMenu}>
                  <X size={28} className="text-black" />
                </button>
              </div>

              {/* Menu Items */}
              <nav className="flex flex-col mt-6 space-y-4 text-lg font-bold px-4 pb-6">
                <button onClick={() => scrollToSection("home")} className="hover:text-green-600 text-left">Home</button>
                <button onClick={() => scrollToSection("about")} className="hover:text-green-600 text-left">About Us</button>
                <button onClick={() => scrollToSection("services")} className="hover:text-green-600 text-left">Services</button>
                <button onClick={() => scrollToSection("portfolio")} className="hover:text-green-600 text-left">Portfolio</button>
                <button onClick={() => scrollToSection("branches")} className="hover:text-green-600 text-left">Branches</button>
                <button onClick={() => scrollToSection("contact")} className="hover:text-green-600 text-left">Contact</button>
                 <button
              onClick={() => window.location.href = "/login"}
              className="bg-gradient-to-r from-[#275981] to-[#1e4565] hover:from-[#1e4565] hover:to-[#16344d] text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              Login
            </button>
              </nav>
            </div>
          </div>
        )}



      </div>
    </header>
  );
};

export default Header;
