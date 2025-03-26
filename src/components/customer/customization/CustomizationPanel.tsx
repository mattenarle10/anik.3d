// CustomizationPanel.tsx
import React, { useState } from 'react';
import ColorPicker from './ColorPicker';
import PartSelector, { Part } from './PartSelector';

// Import preset colors from ColorPicker for randomization
import { defaultPresetColors } from './ColorPicker';

export interface CustomizablePart {
  id: string;
  name: string;
  color: string;
  price: number;
  icon?: React.ReactNode;
}

interface CustomizationPanelProps {
  parts: CustomizablePart[];
  onPartColorChange: (partId: string, color: string) => void;
  onRandomize?: (randomParts: { partId: string, color: string }[]) => void;
  basePrice: number;
  additionalPrice: number;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  parts,
  onPartColorChange,
  onRandomize,
  basePrice,
  additionalPrice
}) => {
  const [selectedPartId, setSelectedPartId] = useState(parts[0]?.id || '');
  const selectedPart = parts.find(part => part.id === selectedPartId);

  const handleColorChange = (color: string) => {
    if (selectedPart) {
      onPartColorChange(selectedPart.id, color);
    }
  };

  // Convert parts to the format expected by PartSelector
  const partOptions: Part[] = parts.map(part => ({
    id: part.id,
    name: part.name,
    icon: part.icon
  }));

  // Function to generate random colors for all parts
  const handleRandomize = () => {
    const randomizedParts = parts.map(part => {
      // Get a random color from the preset colors
      const randomColor = defaultPresetColors[Math.floor(Math.random() * defaultPresetColors.length)];
      return {
        partId: part.id,
        color: randomColor
      };
    });
    
    // Update all parts with random colors
    randomizedParts.forEach(({ partId, color }) => {
      onPartColorChange(partId, color);
    });
    
    // Call the onRandomize callback if provided
    if (onRandomize) {
      onRandomize(randomizedParts);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <h2 className="text-xl font-bold font-montreal mb-6 text-black">Customize Your Model</h2>
      
      {/* Randomize button */}
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-sm font-medium font-montreal text-gray-700">Customize Your Model</h3>
        <button
          onClick={handleRandomize}
          className="flex items-center px-3 py-1.5 bg-black text-white rounded-sm hover:bg-gray-800 transition-colors text-sm font-montreal"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Randomize
        </button>
      </div>
      
      {/* Part selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium font-montreal mb-3 text-gray-700">Select Part to Customize</h3>
        <PartSelector 
          parts={partOptions}
          selectedPartId={selectedPartId}
          onSelectPart={setSelectedPartId}
        />
      </div>
      
      {/* Color selection for selected part */}
      {selectedPart && (
        <div className="mb-6">
          <h3 className="text-sm font-medium font-montreal mb-3 text-gray-700">
            Choose Color for {selectedPart.name}
          </h3>
          <ColorPicker
            selectedColor={selectedPart.color}
            onChange={handleColorChange}
          />
        </div>
      )}
      
      {/* Price summary */}
      <div className="mt-8 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <span className="font-montreal text-gray-600">Base Price:</span>
          <span className="font-montreal text-black">₱{basePrice.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <span className="font-montreal text-gray-600">Customization:</span>
          <span className="font-montreal text-black">+₱{additionalPrice.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="font-montreal font-bold text-black">Total Price:</span>
          <span className="font-montreal font-bold text-black">₱{(basePrice + additionalPrice).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default CustomizationPanel;