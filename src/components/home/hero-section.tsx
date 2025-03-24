'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Import the 3D model viewer with dynamic loading to prevent SSR issues
const HeroModelViewer = dynamic(
  () => import('../ui/hero-model-viewer'),
  { ssr: false }
);

export default function HeroSection() {
  return (
    <section className="relative py-16 px-4 min-h-[90vh] flex items-center justify-center bg-white">
      {/* 3D Model directly in the section with absolute positioning */}
      <div className="absolute right-0 bottom-0 md:right-[5%] w-[400px] h-[600px] md:w-[600px] md:h-[800px] pointer-events-none z-10">
        <HeroModelViewer />
      </div>
      
      <div className="container mx-auto max-w-6xl relative z-20">
        <div className="flex flex-col items-start">
          {/* Text content */}
          <div className="md:w-1/2 text-center md:text-left">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-medium text-black font-montreal mb-10 tracking-wider uppercase">
              MAKE YOUR OWN.
            </h1>
            
            {/* Sleek call to action button with arrow */}
            <div className="flex justify-center md:justify-start">
              <Link 
                href="/login" 
                className="group flex items-center gap-3 px-6 py-3 border-b-2 border-black text-black hover:gap-5 transition-all duration-300"
              >
                <span className="text-lg font-medium">Get Started</span>
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
      </div>
      
     
    </section>
  );
}