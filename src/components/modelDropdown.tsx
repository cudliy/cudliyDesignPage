import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  const getDisplayText = (quality: string) => {
    switch (quality) {
      case 'fast': return 'Fast';
      case 'medium': return 'Medium';
      case 'good': return 'Good';
      default: return 'Medium';
    }
  };

  return (
    <>
      {/* Global CSS to ensure dropdown appears above everything */}
      <style>{`
        .model-dropdown-container {
          z-index: 9999999 !important;
          position: relative !important;
        }
        .model-dropdown-menu {
          z-index: 9999999 !important;
          position: absolute !important;
        }
      `}</style>
      
      <div className='relative text-left model-dropdown-container' style={{ zIndex: 999999 }} ref={containerRef}>
        {/*Dropdown Button*/}
        <Button 
          variant="outline" 
          className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border-none text-white px-2 py-0 text-[9px] sm:text-[10px] lg:text-[11px] font-medium transition-all duration-300 h-5 sm:h-6 lg:h-7 rounded-md" 
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
        >
          {getDisplayText(selectedQuality)}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`} />
        </Button>
        
        {/* Dropdown Menu - Simple approach with maximum z-index */}
        {open && (
          <div
            className="absolute mt-2 w-48 right-0 bg-[#414141] rounded-md shadow-2xl overflow-hidden model-dropdown-menu"
            style={{ 
              zIndex: 9999999,
              backgroundColor: '#414141',
              position: 'absolute'
            }}
            ref={dropdownRef}
          >
            <div className="py-1">
              <div 
                onClick={() => handleOptionClick('fast')}
                className={`px-3 py-2 text-[10px] sm:text-[11px] lg:text-[12px] cursor-pointer transition-colors duration-200 hover:bg-white/20 ${
                  selectedQuality === 'fast' ? 'bg-white/30 text-white font-medium' : 'text-white'
                }`}
              >
                Fast
              </div>
              <div 
                onClick={() => handleOptionClick('medium')}
                className={`px-3 py-2 text-[10px] sm:text-[11px] lg:text-[12px] cursor-pointer transition-colors duration-200 hover:bg-white/20 ${
                  selectedQuality === 'medium' ? 'bg-white/30 text-white font-medium' : 'text-white'
                }`}
              >
                Medium
              </div>
              <div 
                onClick={() => handleOptionClick('good')}
                className={`px-3 py-2 text-[10px] sm:text-[11px] lg:text-[12px] cursor-pointer transition-colors duration-200 hover:bg-white/20 ${
                  selectedQuality === 'good' ? 'bg-white/30 text-white font-medium' : 'text-white'
                }`}
              >
                Good
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}