import { useState, useEffect, useRef } from 'react';

interface DetailSelectorProps {
  selectedDetails: string[];
  onDetailChange: (details: string[]) => void;
}

export default function DetailSelector({ 
  selectedDetails, 
  onDetailChange 
}: DetailSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string>('infill');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const detailCategories = [
    { key: 'infill', label: 'Infill', options: ['upright', 'Sitting', 'Lying', 'Standing'] },
    { key: 'parts', label: 'Parts', options: ['dynamic', 'Neutral', 'Modular', 'Fixed'] },
    { key: 'pose', label: 'Pose', options: ['Jumping', 'Waving', 'Running', 'Sleeping'] },
    { key: 'strength', label: 'Strength', options: ['Strong', 'Flexible', 'Rigid', 'Soft'] },
    { key: 'complexity', label: 'Complexity', options: ['Simple', 'Detailed', 'Basic', 'Advanced'] },
    { key: 'lighting', label: 'Lighting', options: ['Natural', 'Studio', 'Dramatic', 'Soft'] }
  ];

  const handleDetailToggle = (detail: string) => {
    const newSelection = selectedDetails.includes(detail)
      ? selectedDetails.filter(d => d !== detail)
      : [...selectedDetails, detail];
    onDetailChange(newSelection);
  };

  const removeDetail = (detail: string) => {
    onDetailChange(selectedDetails.filter(d => d !== detail));
  };

  // Simple scroll handler
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;
    
    // Calculate which category should be active based on scroll position
    const categoryHeight = 50; // Approximate height of each category
    const activeIndex = Math.round(scrollTop / categoryHeight);
    const categoryKey = detailCategories[Math.min(activeIndex, detailCategories.length - 1)]?.key;
    
    if (categoryKey && categoryKey !== activeCategory) {
      setActiveCategory(categoryKey);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      
      // Debug info
        hasScroll: container.scrollHeight > container.clientHeight
      });
      
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className="flex flex-col items-center w-full h-full max-h-[400px]">
      {/* Selected Details Tags - Compact version */}
      {selectedDetails.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3 justify-center max-h-[60px] overflow-y-auto">
          {selectedDetails.map((detail) => (
            <div
              key={detail}
              className="flex items-center gap-1 px-2 py-1 bg-gray-800/50 border border-[#E70D57]/50 rounded-full text-xs text-white"
            >
              <span>{detail}</span>
              <button
                onClick={() => removeDetail(detail)}
                className="text-white/70 hover:text-white transition-colors text-sm"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Categories and Options Layout - Reduced height */}
      <div className="w-full max-w-[800px] flex-1 p-3">
        <div className="grid grid-cols-2 gap-6 h-full">
          {/* Left Column - Scrollable Categories */}
          <div className="h-full">
            <div 
              ref={scrollContainerRef}
              className="h-full overflow-y-auto pr-2"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#E70D57 #333'
              }}
            >
              <div className="space-y-1">
                {detailCategories.map((category) => (
                  <div
                    key={category.key}
                    className={`min-h-[30px] flex items-center px-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/5 ${
                      activeCategory === category.key
                        ? 'text-[#E70D57]'
                        : 'text-white/70 hover:text-white/90'
                    }`}
                    onClick={() => setActiveCategory(category.key)}
                  >
                    <span className="text-lg font-thin">{category.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Options for Active Category */}
          <div className="h-full">
            <div className="h-full overflow-y-auto pr-2">
              <div className="space-y-1">
                {detailCategories.find(cat => cat.key === activeCategory)?.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleDetailToggle(option)}
                    className={`w-full text-left p-2 rounded-lg transition-all duration-200 hover:bg-white/5 ${
                      selectedDetails.includes(option)
                        ? 'text-[#E70D57]'
                        : 'text-white/70 hover:text-white/90'
                    }`}
                  >
                    <span className="text-sm font-thin">{option}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}