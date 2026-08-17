import React, { useState, useEffect, useRef } from 'react';
import { Phone, Mail, Check, Award, Shield, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';

const GraceTravelsHome: React.FC = () => {
  const [activeService, setActiveService] = useState<number>(0);
  const [currentTestimonial, setCurrentTestimonial] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [carPosition, setCarPosition] = useState<number>(0);
  const carScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    
    // Auto-scroll testimonials
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % 3);
    },5000);
   return () => clearInterval(testimonialInterval);
  },[]);

  const services = [
    { id: 0, name: 'Small Cars', image: 'small-car' },
    { id: 1, name: 'Budget Cars', image: 'budget-car' },
    { id: 2, name: 'Business Cars', image: 'business-car' },
    { id: 3, name: 'Premium Cars', image: 'premium-car' }
  ];

  const cars = [
    { 
      name: 'Corolla', 
      model: 'Model',
      image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop'
    },
    { 
      name: 'Etios', 
      model: 'Model',
      image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=300&fit=crop'
    },
    { 
      name: 'Fiesta', 
      model: 'Model',
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop'
    }
  ];

  const heroCars = [
    'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&h=400&fit=crop'
  ];

  const testimonials = [
    {
      name: 'Lina Mars',
      role: 'Commercial Director',
      text: 'I would like to record my appreciation for the quality of service. The standard of cars and the quality of the chauffeur was very much satisfactory.',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
    },
    {
      name: 'John Smith',
      role: 'Business Owner',
      text: 'Excellent service and professional drivers. Grace Cabs has been my go-to choice for all business trips.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
    },
    {
      name: 'Sarah Johnson',
      role: 'Travel Consultant',
      text: 'Reliable, comfortable, and always on time. The fleet is well-maintained and the prices are competitive.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop'
    }
  ];

  const clients = [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Grundfos_logo.svg/200px-Grundfos_logo.svg.png',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Danfoss_Logo.svg/200px-Danfoss_Logo.svg.png',
    'TATA',
    'infosoft',
    'VACON'
  ];

  const scrollCars = (direction: 'left' | 'right') => {
    if (carScrollRef.current) {
      const scrollAmount = 400;
      const newPosition = direction === 'left' 
        ? Math.max(0, carPosition - scrollAmount)
        : Math.min(carScrollRef.current.scrollWidth - carScrollRef.current.clientWidth, carPosition + scrollAmount);
      
      setCarPosition(newPosition);
      carScrollRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <style dangerouslySetInnerHTML={{__html: `
        .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
      `}} />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 bg-gray-700 rounded-full"></div>
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold">
                <span className="text-gray-700">GRACE </span>
                <span className="text-yellow-500">T</span>
                <span className="text-gray-700">RAVELS</span>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+91-9003241571</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Support@gracecabs.in</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-gray-100 to-white py-16 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className={`transition-all duration-1000 transform ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'}`}>
              <h1 className="text-5xl font-bold text-gray-700 mb-4 leading-tight">
                WIDE RANGE OF CARS
              </h1>
              <div className="bg-orange-500 text-white inline-block px-4 py-2 mb-6 text-sm font-bold">
                THIS IS WHAT YOU WERE LOOKING FOR!
              </div>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Grace Cabs offer a wide range of makes and models for you to choose from at all our service locations.
              </p>
              <button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded font-semibold transition-all duration-300 hover:shadow-lg">
                BOOK NOW
              </button>
            </div>
            
       <div className="relative h-96"> 
              {/* Car 1 - Top right - Toyota Corolla */} 
              <div  
                className={`absolute top-0 right-0 transition-all duration-700 ${ 
                  isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[150%] opacity-0' 
                }`} 
                style={{  
                  transitionDelay: '200ms',
                  transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                }} 
              > 
                <img  
                  src="/images/1.png"  
                  alt="Toyota Corolla"  
                  className="w-80 h-48 object-contain drop-shadow-2xl" 
                /> 
              </div> 
               
              {/* Car 2 - Middle left - Toyota Etios */} 
              <div  
                className={`absolute top-32 left-0 transition-all duration-700 ${ 
                  isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[150%] opacity-0' 
                }`} 
                style={{  
                  transitionDelay: '500ms',
                  transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                }} 
              > 
                <img  
                  src="/images/2.png"  
                  alt="Toyota Etios"  
                  className="w-80 h-48 object-contain drop-shadow-2xl" 
                /> 
              </div> 
               
              {/* Car 3 - Bottom right - Ford Fiesta */} 
              <div  
                className={`absolute bottom-0 right-8 transition-all duration-700 ${ 
                  isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[150%] opacity-0' 
                }`} 
                style={{  
                  transitionDelay: '800ms',
                  transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                }} 
              > 
                <img  
                  src="/images/3.png"  
                  alt="Ford Fiesta"  
                  className="w-80 h-48 object-contain drop-shadow-2xl" 
                /> 
              </div> 
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="relative mb-6 inline-block">
                <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Award className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-16 h-16 bg-orange-400 rounded-full opacity-20 animate-ping"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Quality</h3>
              <ul className="space-y-3 text-gray-600 text-left max-w-xs mx-auto">
                <li className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Well trained chauffeurs</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Young, well-maintained car fleet</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Amenities for comfort</span>
                </li>
              </ul>
            </div>

            <div className="text-center group">
              <div className="relative mb-6 inline-block">
                <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-16 h-16 bg-orange-400 rounded-full opacity-20 animate-ping"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Reliability</h3>
              <ul className="space-y-3 text-gray-600 text-left max-w-xs mx-auto">
                <li className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>India's largest car hire/rental company</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>In car GPS devices for extra safety</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Transparent pricing structure</span>
                </li>
              </ul>
            </div>

            <div className="text-center group">
              <div className="relative mb-6 inline-block">
                <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-16 h-16 bg-orange-400 rounded-full opacity-20 animate-ping"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Convenience</h3>
              <ul className="space-y-3 text-gray-600 text-left max-w-xs mx-auto">
                <li className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Available across major cities</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Book through web or phone</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Pay by cash or card</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Our Cars Section with Scrolling */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-2">Our Cars</h2>
              <p className="text-gray-600">
                Easy & convenient self-driven cars are available from Grace Cabs on daily, weekly & monthly basis.
              </p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => scrollCars('left')}
                className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <button 
                onClick={() => scrollCars('right')}
                className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
          
          <div 
            ref={carScrollRef}
            className="flex space-x-6 overflow-x-auto scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {[...cars, ...cars].map((car, idx) => (
              <div 
                key={idx} 
                className="flex-shrink-0 w-80 bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="overflow-hidden">
                  <img 
                    src={car.image} 
                    alt={car.name}
                    className="w-full h-56 object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-gray-800">{car.name}</h3>
                  <p className="text-gray-500 text-sm">{car.model}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services & Testimonials Side by Side */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Services */}
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-6">Services</h2>
              <div className="flex flex-wrap gap-2 mb-6">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setActiveService(service.id)}
                    className={`px-5 py-2 rounded transition-all duration-300 text-sm font-medium ${
                      activeService === service.id
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {service.name}
                  </button>
                ))}
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <img 
                    src="https://images.unsplash.com/photo-1590362891991-f776e747a588?w=200&h=150&fit=crop" 
                    alt="Service car"
                    className="w-32 h-24 object-cover rounded-lg"
                  />
                  <div>
                    <p className="text-gray-700 leading-relaxed mb-3 text-sm">
                      Cheap to hire and cheap to run, a smaller car saves you money in two ways. A wise choice like this can make a real difference to your trip. Days out, nights out - whatever your plans, hiring a small car gives you more money to spend!
                    </p>
                    <button className="text-orange-500 hover:text-orange-600 font-semibold text-sm">
                      Read more →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonials */}
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-6">Testimonials</h2>
              <div className="bg-white border border-gray-200 rounded-lg p-8 relative hover:shadow-lg transition-shadow">
                <div className="text-orange-500 text-6xl absolute top-4 right-6 opacity-10 font-serif">❝</div>
                <p className="text-gray-700 text-base mb-6 italic relative z-10 leading-relaxed">
                  {testimonials[currentTestimonial].text}
                </p>
                <div className="flex items-center space-x-4">
                  <img 
                    src={testimonials[currentTestimonial].image}
                    alt={testimonials[currentTestimonial].name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-gray-800">{testimonials[currentTestimonial].name}</h4>
                    <p className="text-gray-500 text-sm">{testimonials[currentTestimonial].role}</p>
                  </div>
                </div>
                <div className="flex justify-center space-x-2 mt-6">
                  {testimonials.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentTestimonial(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        currentTestimonial === idx ? 'bg-orange-500 w-8' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Our Clients</h2>
          <p className="text-gray-600 mb-8">List of Some Clients</p>
          <div className="flex flex-wrap justify-center items-center gap-12">
            {clients.map((client, idx) => (
              <div 
                key={idx} 
                className="grayscale hover:grayscale-0 transition-all duration-300 opacity-50 hover:opacity-100 hover:scale-110"
              >
                {client.startsWith('http') ? (
                  <img src={client} alt="Client" className="h-12 object-contain" />
                ) : (
                  <div className="text-xl font-bold text-gray-700">{client}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">About us</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Grace Cabs is an affordable Car travels and car rentals service provider in Chennai. Grace Cabs in Chennai is a highly professional company who provide reliable cars for your perfect hours where high petrol pricing makes owning cars less practical. We carry all trips in Chennai or elsewhere in Tamil Nadu. We have a skilled and experienced team of drivers who are friendly, caring and knowledgeable about the places they take you on. We will make your family and official trips. We specialize in renting and providing cars for hire in Chennai, Tamil Nadu.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4">Our Contacts</h3>
              <div className="space-y-2 text-gray-400 text-sm">
                <p>309 A, Radhakrishan Street, Perumbakkam</p>
                <p>Chennai,</p>
                <p>Tamil Nadu</p>
                <p>India - 600100</p>
                <p className="flex items-center space-x-2 pt-3">
                  <Phone className="w-4 h-4" />
                  <span>Phone: +91-9003241571</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email: support@Gracecabs.in</span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-wrap gap-6 mb-6">
              <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm">
                Terms And Conditions
              </a>
              <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm">
                Cancel Reservation
              </a>
            </div>
            <div className="text-center text-gray-500 text-xs">
              ©2025 © Gracecabs.in. All Rights Reserved. Page loaded in 0.001 seconds.
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default GraceTravelsHome;