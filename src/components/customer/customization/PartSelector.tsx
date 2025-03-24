// PartSelector.tsx
import React from 'react';

export interface Part {
  id: string;
  name: string;
  icon?: React.ReactNode;
}

interface PartSelectorProps {
  parts: Part[];
  selectedPartId: string;
  onSelectPart: (partId: string) => void;
}

const PartSelector: React.FC<PartSelectorProps> = ({
  parts,
  selectedPartId,
  onSelectPart
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {parts.map((part) => (
        <button
          key={part.id}
          className={`px-4 py-2 rounded-full text-sm font-montreal transition-all ${
            selectedPartId === part.id
              ? 'bg-black text-white shadow-md'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          onClick={() => onSelectPart(part.id)}
        >
          <div className="flex items-center">
            {part.icon && <span className="mr-2">{part.icon}</span>}
            {part.name}
          </div>
        </button>
      ))}
    </div>
  );
};

export default PartSelector;