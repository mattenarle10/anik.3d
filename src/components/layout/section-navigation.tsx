'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Icons for the navigation
const PopularIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const AboutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16v-4"/>
    <path d="M12 8h.01"/>
  </svg>
);

const DevelopersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );

const ContactIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
  </svg>
);

// Wrapper component to handle conditional rendering
export function SectionNavigationWrapper() {
  const pathname = usePathname();
  
  // Only show on the landing page (root path)
  if (pathname !== '/') {
    return null;
  }
  
  return <SectionNavigation />;
}

export default function SectionNavigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  
  useEffect(() => {
    const handleScroll = () => {
      // Check if scrolled past hero section (adjust 300 based on your hero height)
      setIsScrolled(window.scrollY > 300);
      
      // Determine active section based on scroll position
      const sections = ['hero', 'popular', 'about', 'developers', 'contact'];
      const sectionElements = sections.map(id => 
        id === 'hero' ? document.body : document.getElementById(id)
      );
      
      const currentPosition = window.scrollY + 200; // Offset for better detection
      
      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const element = sectionElements[i];
        if (element && element.offsetTop <= currentPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Bottom navigation for hero section
  if (!isScrolled) {
    return (
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 transition-all duration-500">
        <div className="bg-black rounded-full px-10 py-2.5 shadow-lg flex items-center gap-12 font-montreal">
          <Link href="#popular" className="text-white hover:text-gray-300 transition-colors text-xs uppercase tracking-widest font-light">Popular</Link>
          <Link href="#about" className="text-white hover:text-gray-300 transition-colors text-xs uppercase tracking-widest font-light">About</Link>
          <Link href="#developers" className="text-white hover:text-gray-300 transition-colors text-xs uppercase tracking-widest font-light">Team</Link>
          <Link href="#contact" className="text-white hover:text-gray-300 transition-colors text-xs uppercase tracking-widest font-light">Contact</Link>
        </div>
      </div>
    );
  }
  
  // Side navigation for scrolled state
  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-30 transition-all duration-500">
      <div className="bg-black rounded-full py-4 px-3 shadow-lg flex flex-col items-center gap-8 font-montreal">
        <Link 
          href="#popular" 
          className={`text-white hover:text-gray-300 transition-colors p-2 rounded-full ${activeSection === 'popular' ? 'bg-white/10' : ''}`}
          aria-label="Popular Section"
          title="Popular"
        >
          <PopularIcon />
        </Link>
        <Link 
          href="#about" 
          className={`text-white hover:text-gray-300 transition-colors p-2 rounded-full ${activeSection === 'about' ? 'bg-white/10' : ''}`}
          aria-label="About Section"
          title="About"
        >
          <AboutIcon />
        </Link>
        <Link 
          href="#developers" 
          className={`text-white hover:text-gray-300 transition-colors p-2 rounded-full ${activeSection === 'developers' ? 'bg-white/10' : ''}`}
          aria-label="Developers Section"
          title="Developers"
        >
          <DevelopersIcon />
        </Link>
        <Link 
          href="#contact" 
          className={`text-white hover:text-gray-300 transition-colors p-2 rounded-full ${activeSection === 'contact' ? 'bg-white/10' : ''}`}
          aria-label="Contact Section"
          title="Contact"
        >
          <ContactIcon />
        </Link>
      </div>
    </div>
  );
}