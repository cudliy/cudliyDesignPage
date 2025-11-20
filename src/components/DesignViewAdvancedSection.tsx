import React, { useState } from 'react';
import { 
  ColorIcon, 
  MaterialIcon, 
  SizeIcon, 
  StyleIcon, 
  ProductionIcon, 
  DetailIcon 
} from './AdvancedSectionIcons';

interface DesignViewAdvancedSectionProps {
  onBack: () => void;
}

export const DesignViewAdvancedSection: React.FC<DesignViewAdvancedSectionProps> = ({ onBack }) => {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>({
    color: false,
    material: false,
    size: false,
    style: false,
    production: false,
    detail: false
  });

  const sections = {
    color: {
      title: 'Color',
      icon: <StyleIcon />
    },
    material: {
      title: 'Material',
      icon: <SizeIcon />
    },
    size: {
      title: 'Size',
      icon: <MaterialIcon />
    },
    style: {
      title: 'Style',
      icon: <ColorIcon />
    },
    production: {
      title: 'Production',
      icon: <DetailIcon />
    },
    detail: {
      title: 'Detail',
      icon: <ProductionIcon />
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedSection(category);
    setSelectedCategories(prev => ({
      ...prev,
      [category]: true
    }));
  };

  const handleBackToCategories = () => {
    setSelectedSection(null);
  };

  const renderCategoryContent = () => {
    if (!selectedSection) return null;

    return (
      <div className="flex flex-col items-center text-center w-full px-3">
        {/* Breadcrumb Navigation */}
        <div className="mb-4 flex items-center gap-1 text-[10px]">
          <button 
            onClick={handleBackToCategories}
            className="text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            {sections[selectedSection as keyof typeof sections]?.title}
          </button>
          <span className="text-white/30">{'>'}</span>
          <span className="text-white/90">Select Options</span>
        </div>

        {/* Placeholder content for each category */}
        <div className="text-white/70 text-sm mb-6">
          {selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1)} options will appear here
        </div>

        {/* Back and Create Buttons */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button 
            onClick={handleBackToCategories}
            className="w-10 h-10 rounded-full border border-white/20 hover:border-white/40 text-white transition-all duration-300 ease-out hover:scale-105 flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            className="px-6 py-3 w-[133px] h-[39px] rounded-[40px] font-medium text-sm transition-all duration-300 ease-out hover:scale-105 shadow-lg bg-[#313131] hover:bg-[#414141] text-white"
          >
            Create
          </button>
        </div>
      </div>
    );
  };

  const renderAdvancedCategories = () => {
    return (
      <div className="flex flex-col items-center justify-center text-center w-full h-full">
        {/* Category Icons Grid */}
        <div className="grid grid-cols-3 gap-x-10 gap-y-8 w-full max-w-[320px] mx-auto">
          {Object.entries(sections).map(([key, section], index) => {
            const isSelected = selectedCategories[key];
            return (
              <div
                key={key}
                className={`flex flex-col items-center gap-3 p-3 transition-all duration-300 hover:scale-105 cursor-pointer relative group ${
                  isSelected ? 'rounded-lg' : ''
                }`}
                style={{ transitionDelay: `${400 + index * 50}ms` }}
                onClick={() => handleCategoryClick(key)}
              >
                {isSelected && (
                  <div className="absolute -top-1 right-1 w-3 h-3 bg-[#313131] rounded-full flex items-center justify-center">
                    <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div className="w-9 h-9 mx-auto transition-all duration-300 hover:scale-110">
                  {section.icon}
                </div>
                <span className="text-[12px] font-normal text-white/70">
                  {section.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Back Button */}
        <div className="mt-12 flex items-center justify-center">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full border border-white/20 hover:border-white/40 text-white transition-all duration-300 ease-out hover:scale-105 flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      {selectedSection ? renderCategoryContent() : renderAdvancedCategories()}
    </div>
  );
};
