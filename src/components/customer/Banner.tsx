'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FigurineProps, defaultFigurines } from './FigurineData';

interface BannerProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  bgColorFrom?: string;
  bgColorVia?: string;
  bgColorTo?: string;
  textGradientFrom?: string;
  textGradientTo?: string;
  customFigurines?: FigurineProps[];
}

export default function Banner({
  title = "Discover 3D Aniks",  
  subtitle = "Make your 3D Anik unique",
  ctaText = "Customize Now",
  ctaLink = "/customize",
  bgColorFrom = "gray-900",
  bgColorVia = "black",
  bgColorTo = "gray-800",
  textGradientFrom = "white",
  textGradientTo = "gray-400",
  customFigurines
}: BannerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Use custom figurines if provided, otherwise use defaults
  const figurinesToRender = customFigurines || defaultFigurines;

  return (
    <div className="relative w-full h-[400px] mb-10 overflow-hidden rounded-sm">
      {/* Dark Background with Subtle Texture */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-800 animate-gradient-x">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="stars"></div>
        </div>
        
        {/* 3D Grid Lines */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iODAiIGhlaWdodD0iODAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gODAgMCBMIDAgMCAwIDgwIiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjAuNSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-20"></div>
      </div>
      
      {/* Figurine-Style Elements */}
      <div className="absolute w-full h-full overflow-hidden">
        {figurinesToRender.map((figurine, index) => (
          <div 
            key={index}
            className={`absolute ${figurine.className} animate-float-${index + 1}`}
            style={{
              top: figurine.position.top,
              bottom: figurine.position.bottom,
              left: figurine.position.left,
              right: figurine.position.right,
              width: figurine.size.width,
              height: figurine.size.height,
              opacity: 0.9
            }}
          >
            {figurine.svgContent}
          </div>
        ))}
      </div>
      
      {/* Content */}
      <div className={`relative z-10 flex flex-col items-center justify-center h-full text-center px-4 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <h1 className="text-5xl md:text-6xl font-bold mb-4 font-montreal tracking-tight">
          <span className="block text-white">Discover</span>
          <span className="block text-6xl md:text-7xl bg-clip-text bg-gradient-to-r from-white to-gray-400 text-transparent">3D Aniks</span>
        </h1>
        <p className="text-lg md:text-xl text-white mb-8 max-w-2xl font-montreal">{subtitle}</p>
        <Link 
          href={ctaLink}
          className="px-8 py-3 bg-white text-black font-medium rounded-sm hover:bg-opacity-90 transition-all font-montreal transform hover:scale-105"
        >
          {ctaText}
        </Link>
        
        {/* View All Products Button */}
        <Link 
          href="/products?filter=popular"
          className="absolute bottom-6 flex items-center space-x-2 text-white hover:text-gray-200 transition-colors group"
        >
          <span className="text-white text-sm font-montreal">View Popular Products</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white animate-bounce group-hover:animate-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </Link>
      </div>
      
      {/* Subtle Glow Effect */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-blue-900/10 to-transparent"></div>
      
      {/* 3D Model Decorative Element */}
      <div className="absolute -right-16 bottom-0 opacity-20 hidden md:block">
        <svg width="300" height="300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22L3 17V7L12 2L21 7V17L12 22Z" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 22V12" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 12L21 7" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 12L3 7" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}