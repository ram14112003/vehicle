import React from 'react';
import Logo1 from "../../assets/clientlogo/1.png";
import Logo2 from "../../assets/clientlogo/2.png";
import Logo3 from "../../assets/clientlogo/3.png";
import Logo4 from "../../assets/clientlogo/4.png";
import Logo5 from "../../assets/clientlogo/5.png";
import Logo6 from "../../assets/clientlogo/6.png";
import Logo7 from "../../assets/clientlogo/7.png";
import Logo8 from "../../assets/clientlogo/8.png";
import Logo9 from "../../assets/clientlogo/9.png";
import Logo10 from "../../assets/clientlogo/10.png";
import Logo11 from "../../assets/clientlogo/11.png";
import Logo12 from "../../assets/clientlogo/12.png";
import Logo13 from "../../assets/clientlogo/13.png";
import Logo14 from "../../assets/clientlogo/14.png";
import Logo15 from "../../assets/clientlogo/15.png";
import Logo16 from "../../assets/clientlogo/16.png";
import Logo17 from "../../assets/clientlogo/17.png";
import Logo18 from "../../assets/clientlogo/18.png";
import Logo19 from "../../assets/clientlogo/19.png";
import Logo20 from "../../assets/clientlogo/20.png";
import Logo21 from "../../assets/clientlogo/21.png";

// Define the interface for the client data
interface Client {
  id: number;
  name: string;
  logoSrc: string; // Replace this with your actual image paths
}

// Data array matching the logos in your image (Left to Right, Top to Bottom)
const clients: Client[] = [
  { id: 1, name: "Client 1", logoSrc: Logo1 },
  { id: 2, name: "Client 2", logoSrc: Logo2 },
  { id: 3, name: "Client 3", logoSrc: Logo3 },
  { id: 4, name: "Client 4", logoSrc: Logo4 },
  { id: 5, name: "Client 5", logoSrc: Logo5 },
  { id: 6, name: "Client 6", logoSrc: Logo6 },
  { id: 7, name: "Client 7", logoSrc: Logo7 },
  { id: 8, name: "Client 8", logoSrc: Logo8 },
  { id: 9, name: "Client 9", logoSrc: Logo9 },
  { id: 10, name: "Client 10", logoSrc: Logo10 },
  { id: 11, name: "Client 11", logoSrc: Logo11 },
  { id: 12, name: "Client 12", logoSrc: Logo12 },
  { id: 13, name: "Client 13", logoSrc: Logo13 },
  { id: 14, name: "Client 14", logoSrc: Logo14 },
  { id: 15, name: "Client 15", logoSrc: Logo15 },
  { id: 16, name: "Client 16", logoSrc: Logo16 },
  { id: 17, name: "Client 17", logoSrc: Logo17 },
  { id: 18, name: "Client 18", logoSrc: Logo18 },
  { id: 19, name: "Client 19", logoSrc: Logo19 },
  { id: 20, name: "Client 20", logoSrc: Logo20 },
  { id: 21, name: "Client 21", logoSrc: Logo21 },
];


const ClientLogos: React.FC = () => {
  return (
    <section className="w-full py-16 px-4 bg-white">
      <div className="max-w-[1400px] mx-auto text-center">
        
        {/* Header Section */}
        <div className="mb-12 md:mb-16 space-y-4">
          <h3 className="text-indigo-900 font-semibold tracking-widest uppercase text-sm md:text-base">
            Clients
          </h3>
          
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900">
            Our Most Valuable Clients
          </h2>
          
          <p className="text-slate-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Experience world-class transportation solutions powered by innovation, reliability, and professional excellence
          </p>
        </div>

        {/* Logo Grid */}
        {/* Grid Breakdown:
            - grid-cols-2: Mobile (2 items per row)
            - md:grid-cols-4: Tablets (4 items per row)
            - xl:grid-cols-[repeat(7,minmax(0,1fr))]: Large Screens (Exactly 7 items per row to match design)
        */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-[repeat(7,minmax(0,1fr))] gap-8 md:gap-12 items-center justify-items-center">
          {clients.map((client) => (
            <div 
              key={client.id} 
              className="w-full h-20 flex items-center justify-center p-2 group transition-transform duration-300 hover:scale-105"
            >
              {/* Image Tag */}
              <img
                src={client.logoSrc}
                alt={`${client.name} logo`}
                className="max-h-16 max-w-full object-contain filter grayscale-0 hover:grayscale-0 transition-all duration-300"
                // NOTE: Remove the onError below when you have real images. 
                // This creates a placeholder text if image fails to load.
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `<span class="text-xs font-bold text-gray-400 border border-gray-200 p-2 rounded">${client.name}</span>`;
                }}
              />
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
};

export default ClientLogos;