import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ModelDropdownProps {
  selectedQuality: string;
  onQualityChange: (quality: string) => void;
  use3DIcon?: boolean;
  renderDown?: boolean; // New prop to control dropdown direction
}

export default function ModelDropdown({ selectedQuality, onQualityChange, use3DIcon = false, renderDown = false }: ModelDropdownProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate dropdown position when opened - position based on renderDown prop
  useEffect(() => {
    if (open && buttonRef.current && dropdownRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 240; // Approximate height of dropdown
      
      if (renderDown) {
        // Position BELOW the button
        setPosition({
          top: rect.bottom + 8, // Position below button with 8px gap
          left: rect.right - 220 // 220px is dropdown width, align right edge
        });
      } else {
        // Position ABOVE the button (default)
        setPosition({
          top: rect.top - dropdownHeight - 8, // Position above button with 8px gap
          left: rect.right - 220 // 220px is dropdown width, align right edge
        });
      }
    }
  }, [open, renderDown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Close on escape key
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

  const qualityOptions = [
    { value: 'fast', label: 'Fast', description: 'Quick generation' },
    { value: 'medium', label: 'Medium', description: 'Balanced quality' },
    { value: 'good', label: 'High', description: 'Best quality' }
  ];

  return (
    <>
      <style>{`
        .model-dropdown-container {
          z-index: 9999999 !important;
          position: relative !important;
        }
        .model-dropdown-menu {
          z-index: 9999999 !important;
          position: absolute !important;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .dropdown-animate {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
      
      <div className='relative text-left model-dropdown-container' style={{ zIndex: 999999 }} ref={containerRef}>
        {/* 3D Box Icon Button */}
        <button 
          ref={buttonRef}
          className="flex items-center justify-center bg-transparent hover:opacity-80 border-none text-gray-300 hover:text-white p-0 transition-all duration-200" 
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          title="Model Quality"
        >
          {use3DIcon ? (
            // 3D Box Icon
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          ) : (
            // Sliders Icon
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          )}
        </button>
        
        {/* Professional Elegant Dropdown Menu - Using Portal */}
        {open && createPortal(
          <div
            className="dropdown-animate model-dropdown-menu"
            style={{ 
              position: 'fixed',
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: '220px',
              backgroundColor: '#313131',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              zIndex: 999999999,
              overflow: 'hidden',
              pointerEvents: 'auto'
            }}
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
          >
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/10">
                <h3 className="text-xs font-semibold text-white/90 uppercase tracking-wider">Model Quality</h3>
              </div>

              {/* Options */}
              <div className="py-2">
                {qualityOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleOptionClick(option.value)}
                    className="px-4 py-3 cursor-pointer transition-all duration-200 group"
                    style={{
                      backgroundColor: selectedQuality === option.value ? '#FFFFFF' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedQuality !== option.value) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedQuality !== option.value) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className={`text-sm font-medium mb-0.5 ${
                          selectedQuality === option.value ? 'text-[#313131]' : 'text-white'
                        }`}>
                          {option.label}
                        </div>
                        <div className={`text-xs ${
                          selectedQuality === option.value ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {option.description}
                        </div>
                      </div>
                      {selectedQuality === option.value && (
                        <div className="ml-3">
                          <svg className="w-5 h-5 text-[#313131]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer with current selection indicator */}
              <div className="px-4 py-2 border-t border-white/10 bg-black/20">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Current:</span>
                  <span className="text-white font-medium capitalize">{selectedQuality}</span>
                </div>
              </div>
            </div>,
          document.body
        )}
      </div>
    </>
  );
}
