'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function PopularSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  
  // Mock data for popular 3D models
  const popularModels = [
    { id: 1, name: "Tina", image: "/images/popular-4.png" },
    { id: 2, name: "Annika", image: "/images/popular-2.png" },
    { id: 3, name: "Cachet", image: "/images/popular-3.png" },
  ];

  const nextSlide = () => {
    setDirection('right');
    setActiveIndex((current) => (current === popularModels.length - 1 ? 0 : current + 1));
  };

  const prevSlide = () => {
    setDirection('left');
    setActiveIndex((current) => (current === 0 ? popularModels.length - 1 : current - 1));
  };

  const goToSlide = (index: number) => {
    setDirection(index > activeIndex ? 'right' : 'left');
    setActiveIndex(index);
  };

  return (
    <section id="popular" className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-5xl font-bold mb-16 text-center uppercase tracking-wider font-montreal text-black">Popular</h2>
        
        <div className="relative max-w-4xl mx-auto">
          {/* Carousel without container */}
          <div className="relative aspect-[16/9] mb-12">
            <div className="relative h-full">
              {popularModels.map((model, index) => (
                <div 
                  key={model.id} 
                  className={`absolute inset-0 transition-all duration-700 flex items-center justify-center
                    ${index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}
                    ${index === activeIndex && direction === 'right' ? 'animate-slide-in-right' : ''}
                    ${index === activeIndex && direction === 'left' ? 'animate-slide-in-left' : ''}
                  `}
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Image with transparent background */}
                    <div className="relative w-3/5 h-4/5 transform transition-all duration-700 hover:scale-105">
                      <Image
                        src={model.image}
                        alt={model.name}
                        fill
                        sizes="(max-width: 768px) 80vw, 60vw"
                        style={{ objectFit: 'contain' }}
                        priority={index === activeIndex}
                        className="drop-shadow-md"
                      />
                    </div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
                      <h3 className="text-2xl font-medium text-black">{model.name}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Navigation arrows - simple text */}
          <button 
            onClick={prevSlide}
            className="absolute top-1/2 left-4 -translate-y-1/2 z-20 text-4xl font-light text-black hover:scale-110 transition-all"
            aria-label="Previous slide"
          >
            &lt;
          </button>
          
          <button 
            onClick={nextSlide}
            className="absolute top-1/2 right-4 -translate-y-1/2 z-20 text-4xl font-light text-black hover:scale-110 transition-all"
            aria-label="Next slide"
          >
            &gt;
          </button>
          
          {/* Indicators */}
          <div className="flex justify-center gap-3 mb-12">
            {popularModels.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex ? 'bg-black w-8' : 'bg-gray-300 w-2 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Single call to action button - matching hero section style */}
          <div className="flex justify-center">
            <Link 
              href="/products" 
              className="group flex items-center gap-3 px-6 py-3 border-b-2 border-black text-black hover:gap-5 transition-all duration-300"
            >
              <span className="text-lg font-medium">View Products</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}