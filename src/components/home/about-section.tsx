import Image from 'next/image';

export default function AboutSection() {
  return (
    <section id="about" className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-5xl font-bold mb-16 text-center uppercase tracking-wider font-montreal text-black">About</h2>
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2 mb-8 md:mb-0 flex flex-col items-center">
            <div className="w-48 h-48 mb-8 relative">
              <Image 
                src="/images/logo-big.png" 
                alt="Anik.3D Logo" 
                fill
                sizes="(max-width: 768px) 100vw, 192px"
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
          </div>
          <div className="md:w-1/2">
            <h3 className="text-2xl font-medium mb-6 text-black">Our Story</h3>
            <p className="mb-6 text-lg leading-relaxed text-black">
              Founded in 2025, Anik.3D began as a passion project between friends with a shared love for 3D design. We&apos;ve quickly established ourselves as a cutting-edge 3D printing studio known for exceptional quality and innovative designs.
            </p>
            <p className="mb-6 text-lg leading-relaxed text-black">
              Our name reflects our commitment to creating unique pieces that stand out in both design and craftsmanship, bringing imagination to life through artistic vision and technical precision.
            </p>
            
            {/* Developer Links - Vercel-like buttons */}
            <div className="flex flex-wrap gap-4 mt-8">
              <a 
                href="https://anik3d-manual.vercel.app/main/pages" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium text-gray-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                Developer Manual
                <svg className="ml-1" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor"/>
                </svg>
              </a>
              
              <a 
                href="https://anik3d-manual.vercel.app/main/journal" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium text-gray-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Developer Journal
                <svg className="ml-1" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}