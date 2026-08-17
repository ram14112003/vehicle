import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  heroImages: string[];
  currentSlide: number;
  setCurrentSlide: (i: number) => void;
  revealHeadline: () => void;
  headlineKeyDown: (e: React.KeyboardEvent<HTMLSpanElement>) => void;
}

const Hero: React.FC<Props> = ({ heroImages, currentSlide, setCurrentSlide, revealHeadline, headlineKeyDown }) => {
  return (
    <section id="home" className="relative h-[500px] overflow-hidden">
      {heroImages.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black opacity-40"></div>
        </div>
      ))}

      <div className="relative container mx-auto px-4 h-full flex items-center justify-center z-10">
        <div className="max-w-4xl w-full text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">
            <span className="hero-headline inline-block" aria-hidden onClick={revealHeadline} onKeyDown={headlineKeyDown} role="button" tabIndex={0}>
              {Array.from('Transport towards peace of mind').map((ch, i) => (
                <span key={`ch-${i}`} className="hero-letter" data-idx={i}>{ch === ' ' ? '\u00A0' : ch}</span>
              ))}
            </span>
            <span className="sr-only">Transport towards peace of mind</span>
          </h2>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? 'bg-green-500 w-8' : 'bg-white opacity-50'}`}
          />
        ))}
      </div>

      <button
        onClick={() => setCurrentSlide((currentSlide - 1 + heroImages.length) % heroImages.length)}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-30 hover:bg-opacity-50 p-3 rounded-full z-20 transition"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={() => setCurrentSlide((currentSlide + 1) % heroImages.length)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-30 hover:bg-opacity-50 p-3 rounded-full z-20 transition"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>
    </section>
  );
};

export default Hero;
