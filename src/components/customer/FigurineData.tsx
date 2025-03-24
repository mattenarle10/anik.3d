import React from 'react';

// Define the interface for figurine props
export interface FigurineProps {
  className?: string;
  svgContent?: React.ReactNode;
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  size: {
    width: string;
    height: string;
  };
}

// Default figurines with PNG images
export const defaultFigurines: FigurineProps[] = [
  {
    position: { top: "15%", left: "10%" },
    size: { width: "120px", height: "120px" },
    className: "figurine1",
    svgContent: (
      <img 
        src="/images/popular-2.png" 
        alt="3D Anik Figurine" 
        className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
        style={{ filter: "brightness(1.2) contrast(1.2)" }}
      />
    )
  },
  {
    position: { bottom: "20%", right: "15%" },
    size: { width: "150px", height: "150px" },
    className: "figurine2",
    svgContent: (
      <img 
        src="/images/popular-3.png" 
        alt="3D Anik Figurine" 
        className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
        style={{ filter: "brightness(1.2) contrast(1.2)" }}
      />
    )
  },
  {
    position: { top: "30%", right: "30%" },
    size: { width: "120px", height: "120px" },
    className: "figurine3",
    svgContent: (
      <img 
        src="/images/popular-4.png" 
        alt="3D Anik Figurine" 
        className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
        style={{ transform: "scaleX(-1)", filter: "brightness(1.2) contrast(1.2)" }} 
      />
    )
  }
];

// Create custom figurines with your own images
export const createCustomFigurines = (imagePaths: string[]): FigurineProps[] => {
  return imagePaths.map((path, index) => ({
    position: index === 0 
      ? { top: "15%", left: "10%" } 
      : index === 1 
        ? { bottom: "20%", right: "15%" } 
        : { top: "30%", right: "30%" },
    size: { width: index === 1 ? "150px" : "120px", height: index === 1 ? "150px" : "120px" },
    className: `figurine${index + 1}`,
    svgContent: (
      <img 
        src={path} 
        alt="3D Anik Figurine" 
        className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
        style={{ 
          transform: index === 2 ? "scaleX(-1)" : "none", 
          filter: "brightness(1.1) contrast(1.2)" 
        }}
      />
    )
  }));
};