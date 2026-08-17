import React from "react";
import client1 from "../../../../assets/images/client/client1.png";
import client2 from "../../../../assets/images/client/client2.png";
import client3 from "../../../../assets/images/client/client3.jpg";
import client4 from "../../../../assets/images/client/client4.png";
import client5 from "../../../../assets/images/client/client5.jpg";
import client6 from "../../../../assets/images/client/client6.png";
import client7 from "../../../../assets/images/client/client7.png";
import client8 from "../../../../assets/images/client/client8.jpg";
import client9 from "../../../../assets/images/client/client9.png";
import client10 from "../../../../assets/images/client/client10.jpg";
import client11 from "../../../../assets/images/client/client11.png";
import client12 from "../../../../assets/images/client/client12.jpg";
import client13 from "../../../../assets/images/client/client13.png";
import client14 from "../../../../assets/images/client/client14.png";
import client15 from "../../../../assets/images/client/client15.png";
import client16 from "../../../../assets/images/client/client16.png";
import client17 from "../../../../assets/images/client/client17.png";
import client18 from "../../../../assets/images/client/client18.png";

const Clients: React.FC = () => {
  const handleReveal = (e: React.MouseEvent<HTMLImageElement>) => {
    const el = e.currentTarget as HTMLElement;
    if (!el.classList.contains("revealed")) {
      el.classList.add("revealed");
      el.style.pointerEvents = "none";
      setTimeout(() => (el.style.pointerEvents = ""), 800);
    }
  };

const clientImages = [
  client1, client2, client3, client4,
  client5, client6, client7, client8,
  client9, client10, client11, client12,
  client13, client14, client15, client16,
  client17, client18
];


  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* TITLE */}
        <h3 className="text-3xl font-bold text-[#0b2c6b] mb-2">
          <span className="section-title hero-section-title" role="button" tabIndex={0}>
            {Array.from("CLIENTS").map((ch, i) => (
              <span key={`ct-${i}`} className="section-title-letter" data-idx={i}>
                {ch}
              </span>
            ))}
          </span>
          <div className="w-16 h-1 bg-green-600 mt-2"></div>
        </h3>

        <p className="text-gray-600 mb-8 mt-4">
          <span className="section-subtext" role="button" tabIndex={0}>
            {Array.from("Our Prestigious Clients are").map((ch, i) => (
              <span key={`st-${i}`} className="section-subtext-letter" data-idx={i}>
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
          </span>
        </p>

        {/* SCROLLING CLIENT LOGOS */}
        <div className="relative overflow-hidden py-12">
          <div className="scroll-track flex items-center animate-scroll">
            {[...clientImages, ...clientImages].map((img, i) => (
              <img
                key={i}
                onClick={handleReveal}
                src={img} 
                alt={`Client ${i + 1}`}
                className="client-logo grayscale hover:grayscale-0 transition-all hover:scale-110"
              />
            ))}
          </div>
        </div>

        {/* STYLES */}
        <style>{`
          /* Create the scroll animation */
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
          }

          /* The scroll track now fits all 18 logos fully */
          .scroll-track {
            display: flex;
            align-items: center;
            gap: 3rem;
            width: calc(3600px); /* ensures all 18 images fit side by side */
          }

          .client-logo {
            height: 8rem;
            width: 10rem;
            object-fit: contain;
            flex-shrink: 0;
          }

          .animate-scroll {
            animation: scroll 40s linear infinite;
          }

          /* Responsive tuning */
          @media (max-width: 1280px) {
            .scroll-track {
              width: 3000px;
              gap: 2.5rem;
            }
            .client-logo {
              height: 7rem;
              width: 9rem;
            }
            .animate-scroll {
              animation: scroll 35s linear infinite;
            }
          }

          @media (max-width: 1024px) {
            .scroll-track {
              width: 2500px;
              gap: 2rem;
            }
            .client-logo {
              height: 6rem;
              width: 8rem;
            }
            .animate-scroll {
              animation: scroll 30s linear infinite;
            }
          }

          @media (max-width: 768px) {
            .scroll-track {
              width: 2200px;
              gap: 1.5rem;
            }
            .client-logo {
              height: 5rem;
              width: 7rem;
            }
            .animate-scroll {
              animation: scroll 22s linear infinite;
            }
          }

          @media (max-width: 480px) {
            .scroll-track {
              width: 1800px;
              gap: 1rem;
            }
            .client-logo {
              height: 4rem;
              width: 6rem;
            }
            .animate-scroll {
              animation: scroll 18s linear infinite;
            }
          }

          @media (min-width: 769px) {
            .animate-scroll:hover {
              animation-play-state: paused;
            }
          }

          .scroll-track, .client-logo {
            will-change: transform;
          }
        `}</style>
      </div>
    </section>
  );
};

export default Clients;
