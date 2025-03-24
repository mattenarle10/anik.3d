// ColorPicker.tsx
'use client';
import React, { useState } from 'react';

interface ColorPickerProps {
  selectedColor: string;
  onChange: (color: string) => void;
  presetColors?: string[];
}

const defaultPresetColors = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#008080', '#800000', '#008000', '#000080', '#FFC0CB'
];

const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onChange,
  presetColors = defaultPresetColors
}) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  return (
    <div className="color-picker">
      {/* Current color display */}
      <div className="flex items-center mb-3">
        <div 
          className="w-8 h-8 rounded-full border-2 border-white shadow-md mr-3"
          style={{ backgroundColor: selectedColor }}
        />
        <span className="text-sm font-montreal">{selectedColor.toUpperCase()}</span>
      </div>

      {/* Color presets */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {presetColors.map((color, index) => (
          <button
            key={index}
            className={`w-8 h-8 rounded-full shadow-sm transition-transform hover:scale-110 ${
              color === selectedColor ? 'ring-2 ring-offset-2 ring-black' : ''
            }`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
          />
        ))}
      </div>

      {/* Custom color picker toggle */}
      <button
        className="text-sm text-gray-600 hover:text-black transition-colors flex items-center"
        onClick={() => setShowCustomPicker(!showCustomPicker)}
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        {showCustomPicker ? 'Hide custom colors' : 'Custom color'}
      </button>

      {/* Custom color input */}
      {showCustomPicker && (
        <div className="mt-3">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-10 cursor-pointer rounded-md"
          />
        </div>
      )}
    </div>
  );
};

export default ColorPicker;