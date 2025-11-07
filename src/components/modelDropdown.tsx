import { useState, useRef, useEffect } from 'react';
import { Sliders } from 'lucide-react';

export interface ModelDropdownProps {
  selectedQuality: string;
  onQualityChange: (quality: string) => void;
}

export default function ModelDropdown({ selectedQuality, onQualityChange }: ModelDropdownProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      // Add event listener with a small delay to prevent immediate closing
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Also close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleOptionClick = (quality: string) => {
    onQualityChange(quality);
    setOpen(false);
  };

  return (
    <>
      {/* Global CSS to ensure dropdown appears above everything and is fully opaque */}
      <style>{`
        .model-dropdown-container {
          z-index: 9999999 !important;
          position: relative !important;
        }
        .model-dropdown-menu {
          z-index: 9999999 !important;
          position: absolute !important;
          background-color: #414141 !important;
          opacity: 1 !important;
        }
      `}</style>
      
      <div className='relative text-left model-dropdown-container' style={{ zIndex: 999999 }} ref={containerRef}>
        {/*Dropdown Button - Settings/Sliders Icon Only*/}
        <button 
          className="flex items-center justify-center bg-transparent hover:opacity-70 border-none text-gray-400 p-0 transition-all duration-300" 
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
        >
          <Sliders className="w-4 h-4" />
        </button>
        
        {/* Dropdown Menu - Solid Overlay */}
        {open && (
          <div
            className="fixed inset-0 z-[99999]"
            onClick={() => setOpen(false)}
          >
            <div
              className="absolute w-36 shadow-xl"
              style={{ 
                right: '0px',
                top: '60px',
                backgroundColor: '#414141',
                zIndex: 99999
              }}
              ref={dropdownRef}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-2">
                <div 
                  onClick={() => handleOptionClick('fast')}
                  style={{
                    backgroundColor: selectedQuality === 'fast' ? '#E70D57' : '#414141'
                  }}
                  className={`px-4 py-2.5 text-[13px] cursor-pointer flex items-center justify-between transition-all duration-200 ${
                    selectedQuality === 'fast' 
                      ? 'text-white font-medium' 
                      : 'text-gray-300'
                  }`}
                  onMouseEnter={(e) => {
                    if (selectedQuality !== 'fast') {
                      e.currentTarget.style.backgroundColor = '#525252';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedQuality !== 'fast') {
                      e.currentTarget.style.backgroundColor = '#414141';
                    }
                  }}
                >
                  <span>Fast</span>
                  {selectedQuality === 'fast' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div 
                  onClick={() => handleOptionClick('medium')}
                  style={{
                    backgroundColor: selectedQuality === 'medium' ? '#E70D57' : '#414141'
                  }}
                  className={`px-4 py-2.5 text-[13px] cursor-pointer flex items-center justify-between transition-all duration-200 ${
                    selectedQuality === 'medium' 
                      ? 'text-white font-medium' 
                      : 'text-gray-300'
                  }`}
                  onMouseEnter={(e) => {
                    if (selectedQuality !== 'medium') {
                      e.currentTarget.style.backgroundColor = '#525252';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedQuality !== 'medium') {
                      e.currentTarget.style.backgroundColor = '#414141';
                    }
                  }}
                >
                  <span>Medium</span>
                  {selectedQuality === 'medium' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div 
                  onClick={() => handleOptionClick('good')}
                  style={{
                    backgroundColor: selectedQuality === 'good' ? '#E70D57' : '#414141'
                  }}
                  className={`px-4 py-2.5 text-[13px] cursor-pointer flex items-center justify-between transition-all duration-200 ${
                    selectedQuality === 'good' 
                      ? 'text-white font-medium' 
                      : 'text-gray-300'
                  }`}
                  onMouseEnter={(e) => {
                    if (selectedQuality !== 'good') {
                      e.currentTarget.style.backgroundColor = '#525252';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedQuality !== 'good') {
                      e.currentTarget.style.backgroundColor = '#414141';
                    }
                  }}
                >
                  <span>Good</span>
                  {selectedQuality === 'good' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}