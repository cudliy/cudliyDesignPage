import { useState } from 'react';

interface SizeSelectorProps {
  selectedSize: string;
  onSizeChange: (size: string) => void;
  customWidth: string;
  customHeight: string;
  onCustomSizeChange: (width: string, height: string) => void;
}

export default function SizeSelector({ 
  selectedSize, 
  onSizeChange, 
  customWidth, 
  customHeight, 
  onCustomSizeChange 
}: SizeSelectorProps) {
  const [localCustomWidth, setLocalCustomWidth] = useState(customWidth);
  const [localCustomHeight, setLocalCustomHeight] = useState(customHeight);

  const sizeOptions = [
    { key: 'S', label: 'S', size: 55, icon: '/arcticons_emoji-teddy-bear (2).png' },
    { key: 'M', label: 'M', size: 93, icon: '/arcticons_emoji-teddy-bear (1).png' },
    { key: 'L', label: 'L', size: 132, icon: '/arcticons_emoji-teddy-bear.png' }
  ];

  const handleCustomSizeChange = () => {
    onCustomSizeChange(localCustomWidth, localCustomHeight);
  };

  return (
    <div className="flex flex-col items-center w-full mb-8">
      {/* Size Guide Section */}
      <div className="flex items-center justify-center gap-6 mb-6">
        {/* Vertical Size Slider */}
        <div className="relative w-8 h-32 bg-gradient-to-b from-gray-600 to-pink-500 rounded-full flex flex-col justify-between p-1">
          <div className="text-white text-xs font-bold text-center">L</div>
          <div className="text-white text-xs font-bold text-center">M</div>
          <div className="text-white text-xs font-bold text-center">S</div>
        </div>

        {/* Teddy Bear Size Options */}
        <div className="flex items-center gap-4">
          {sizeOptions.map((option) => (
            <div key={option.key} className="flex flex-col items-center">
              <button
                onClick={() => onSizeChange(option.key)}
                className={`transition-all duration-300 hover:scale-110 relative ${
                  selectedSize === option.key ? 'scale-110' : ''
                }`}
              >
                {/* Selection Ring */}
                {selectedSize === option.key && (
                  <div className="absolute inset-0 rounded-full border-2 border-white animate-pulse" 
                       style={{ 
                         width: `${option.size + 8}px`, 
                         height: `${option.size + 8}px`,
                         top: '-4px',
                         left: '-4px'
                       }}
                  />
                )}
                {/* Selection Badge */}
                {selectedSize === option.key && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center z-10">
                    <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <img
                  src={option.icon}
                  alt={`Size ${option.label}`}
                  className="w-auto h-auto"
                  style={{ 
                    width: `${option.size}px`, 
                    height: `${option.size}px`,
                    filter: selectedSize === option.key ? 'brightness(1.2)' : 'brightness(1)'
                  }}
                />
              </button>
              <span className={`text-sm font-medium mt-2 ${
                selectedSize === option.key ? 'text-white' : 'text-white'
              }`}>
                {option.label}
              </span>
            </div>
          ))}
        </div>
      </div>

                                                       {/* Custom Size Input */}
         <div className="flex items-center gap-3 mb-12">
         <span className="text-white/70 text-[16px] mr-6">Custom size</span>
         <div className="flex items-center gap-2">
                     <input
             type="number"
             value={localCustomWidth}
             onChange={(e) => setLocalCustomWidth(e.target.value)}
             onBlur={handleCustomSizeChange}
             className="text-center bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-white/40"
             style={{
               width: '70px',
               height: '32px',
               borderRadius: '30px',
               borderWidth: '0.5px'
             }}
             placeholder="W"
           />
           <span className="text-white/50 text-sm">×</span>
           <input
             type="number"
             value={localCustomHeight}
             onChange={(e) => setLocalCustomHeight(e.target.value)}
             onBlur={handleCustomSizeChange}
             className="text-center bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-white/40"
             style={{
               width: '70px',
               height: '32px',
               borderRadius: '30px',
               borderWidth: '0.5px'
             }}
             placeholder="H"
           />
        </div>
      </div>
    </div>
  );
}
