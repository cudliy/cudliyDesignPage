
interface StyleSelectorProps {
  selectedStyle: string;
  onStyleChange: (style: string) => void;
}

export default function StyleSelector({ 
  selectedStyle, 
  onStyleChange 
}: StyleSelectorProps) {
  const styleOptions = [
    { 
      key: 'sci-fi', 
      label: 'Sci Fi', 
      icon: '/labu1.png'
    },
    { 
      key: 'low-poly', 
      label: 'Low Poly', 
      icon: '/labu2.png'
    },
    { 
      key: 'realistic', 
      label: 'Realistic', 
      icon: '/labu3.png'
    },
    { 
      key: 'playful', 
      label: 'Playful', 
      icon: '/labu4.png'
    },
    { 
      key: 'retro', 
      label: 'Retro', 
      icon: '/labu5.png'
    }
  ];

  return (
         <div className="flex flex-col items-center w-full -mb-4">
                    {/* Style Options */}
       <div className="flex flex-col gap-6 mb-6">
         {/* First row - 3 items */}
         <div className="grid grid-cols-3 gap-6">
           {styleOptions.slice(0, 3).map((option) => (
             <div key={option.key} className="flex flex-col items-center">
            <button
              onClick={() => onStyleChange(option.key)}
              className={`transition-all duration-300 hover:scale-110 relative ${
                selectedStyle === option.key ? 'scale-110' : ''
              }`}
            >
              {/* Selection Badge */}
              {selectedStyle === option.key && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#E70D57] rounded-full flex items-center justify-center z-10">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <div 
                className={`rounded-full border flex items-center justify-center transition-all duration-300 ${
                  selectedStyle === option.key 
                    ? 'border-white shadow-lg' 
                    : 'border-white/30 hover:border-white/50'
                }`}
                                 style={{
                   width: '95px',
                   height: '95px',
                   backgroundColor: '#D9D9D9',
                   boxShadow: selectedStyle === option.key 
                     ? '0 4px 20px rgba(255, 255, 255, 0.3)' 
                     : 'none',
                   borderWidth: '0.5px'
                 }}
              >
                                 <img 
                   src={option.icon} 
                   alt={option.label}
                   style={{
                     width: '70px',
                     height: '70px',
                     objectFit: 'contain'
                   }}
                 />
              </div>
            </button>
                                      <span className={`text-sm font-thin mt-2 text-center ${
                 selectedStyle === option.key ? 'text-[#E70D57]' : 'text-[#CCCCCC]'
               }`}>
               {option.label}
             </span>
           </div>
         ))}
         </div>
         
         {/* Second row - 2 items centered */}
         <div className="flex justify-center gap-6">
           {styleOptions.slice(3, 5).map((option) => (
             <div key={option.key} className="flex flex-col items-center">
               <button
                 onClick={() => onStyleChange(option.key)}
                 className={`transition-all duration-300 hover:scale-110 relative ${
                   selectedStyle === option.key ? 'scale-110' : ''
                 }`}
               >
                 {/* Selection Badge */}
                 {selectedStyle === option.key && (
                   <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#E70D57] rounded-full flex items-center justify-center z-10">
                     <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                     </svg>
                   </div>
                 )}
                 <div 
                   className={`rounded-full border flex items-center justify-center transition-all duration-300 ${
                     selectedStyle === option.key 
                       ? 'border-white shadow-lg' 
                       : 'border-white/30 hover:border-white/50'
                   }`}
                   style={{
                     width: '95px',
                     height: '95px',
                     backgroundColor: '#D9D9D9',
                     boxShadow: selectedStyle === option.key 
                       ? '0 4px 20px rgba(255, 255, 255, 0.3)' 
                       : 'none',
                     borderWidth: '0.5px'
                   }}
                 >
                   <img 
                     src={option.icon} 
                     alt={option.label}
                     style={{
                       width: '70px',
                       height: '70px',
                       objectFit: 'contain'
                     }}
                   />
                 </div>
               </button>
               <span className={`text-sm font-thin mt-2 text-center ${
                 selectedStyle === option.key ? 'text-[#E70D57]' : 'text-[#CCCCCC]'
               }`}>
                 {option.label}
               </span>
             </div>
           ))}
         </div>
       </div>

      {/* Selected Style Display */}
      {selectedStyle && (
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center text-sm"
            style={{ 
              backgroundColor: '#BB4D4B'
            }}
          >
            <img 
              src={styleOptions.find(opt => opt.key === selectedStyle)?.icon}
              alt={selectedStyle}
              className="w-4 h-4 object-contain"
            />
          </div>
          <span className="text-white/90 text-sm font-thin">
            {styleOptions.find(opt => opt.key === selectedStyle)?.label}
          </span>
        </div>
      )}
    </div>
  );
}
