import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

const Branches: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const branches = [
    { name: 'Perumbakkam', type: 'Head Office', color: 'from-blue-600 to-blue-700' },
    { name: 'Adyar', type: 'Branch Office', color: 'from-emerald-600 to-emerald-700' },
    { name: 'Adambakkam', type: 'Branch Office', color: 'from-emerald-600 to-emerald-700' },
    { name: 'Oragadam', type: 'Branch Office', color: 'from-emerald-600 to-emerald-700' },
  ];

  return (
    <section id="branches" className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <MapPin className="w-10 h-10 text-green-600 " />
            <h3 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-[#0b2c6b] via-blue-600 to-green-600 bg-clip-text text-transparent">
              OUR BRANCHES
            </h3>
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-20 h-1 bg-gradient-to-r from-transparent to-blue-500 rounded-full"></div>
            <div className="w-16 h-1.5 bg-gradient-to-r from-blue-500 to-green-600 rounded-full"></div>
            <div className="w-20 h-1 bg-gradient-to-r from-green-600 to-transparent rounded-full"></div>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Serving you across multiple locations with excellence and dedication
          </p>
        </div>

        {/* Branches Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {branches.map((branch, index) => (
            <div
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{animationDelay: `${index * 100}ms`}}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 animate-fade-up"
            >
              {/* Hover Gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${branch.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              ></div>

              {/* Content */}
              <div className="relative p-8 text-center">
                {/* Icon */}
                <div className="mb-4 flex justify-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-white group-hover:bg-transparent transition-all duration-500`}>
                    <MapPin className={`w-8 h-8 text-green-600 group-hover:text-white transition-colors duration-500 animate-bounce `} />
                  </div>
                </div>

                {/* Branch Name */}
                <h4 className={`text-2xl font-bold text-[#0b2c6b] group-hover:text-white transition-colors duration-500 mb-2`}>
                  {branch.name}
                </h4>

                {/* Branch Type */}
                <p className={`text-sm text-gray-600 group-hover:text-white/90 transition-colors duration-500 mb-4`}>
                  {branch.type}
                </p>

                {/* Bottom Animated Line */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-green-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>

              {/* Corner Decoration */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-transparent rounded-bl-full transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fade-up 0.6s ease-out forwards; opacity: 0; }

        @media (max-width: 475px) {
          .group:hover .absolute { opacity: 1 !important; } /* Mobile hover fallback */
        }

        @keyframes pulse {
          0%,100%{transform:scale(1);opacity:0.2;}
          50%{transform:scale(1.1);opacity:0.3;}
        }
      `}} />
    </section>
  );
};

export default Branches;
