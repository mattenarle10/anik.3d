// CustomizationPanel.tsx
import React, { useState } from 'react';
import ColorPicker from './ColorPicker';
import PartSelector, { Part } from './PartSelector';

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
  basePrice: number;
  additionalPrice: number;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  parts,
  onPartColorChange,
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

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <h2 className="text-xl font-bold font-montreal mb-6 text-black">Customize Your Model</h2>
      
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
          <span className="font-montreal text-black">${basePrice.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <span className="font-montreal text-gray-600">Customization:</span>
          <span className="font-montreal text-black">+${additionalPrice.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="font-montreal font-bold text-black">Total Price:</span>
          <span className="font-montreal font-bold text-black">${(basePrice + additionalPrice).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default CustomizationPanel;