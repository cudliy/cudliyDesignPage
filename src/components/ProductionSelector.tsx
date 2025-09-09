
interface ProductionSelectorProps {
  selectedProduction: string;
  onProductionChange: (production: string) => void;
}

export default function ProductionSelector({ 
  selectedProduction, 
  onProductionChange 
}: ProductionSelectorProps) {
  const productionOptions = [
    { 
      key: 'handmade', 
      label: 'Handmade', 
      icon: '/style1.png', // Pill-shaped input field image
      description: 'Handmade'
    },
    { 
      key: 'digital', 
      label: 'Digitally Made', 
      icon: '/style2.png', // 3D printer image
      description: 'Digitally Made'
    }
  ];

  return (
    <div className="flex flex-col items-center w-full mb-8">
      {/* Production Options */}
      <div className="flex items-center justify-center gap-8 mb-8">
        {productionOptions.map((option) => (
          <div key={option.key} className="flex flex-col items-center">
            <button
              onClick={() => onProductionChange(option.key)}
              className={`transition-all duration-300 hover:scale-110 relative ${
                selectedProduction === option.key ? 'scale-110' : ''
              }`}
            >
              {/* Selection Badge */}
              {selectedProduction === option.key && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#E70D57] rounded-full flex items-center justify-center z-10">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
                             <div 
                 className={`rounded-full border flex items-center justify-center text-2xl transition-all duration-300 ${
                   selectedProduction === option.key 
                     ? 'border-white shadow-lg' 
                     : 'border-white/30 hover:border-white/50'
                 }`}
                                   style={{
                    width: '164px',
                    height: '164px',
                    backgroundColor: '#D9D9D9',
                    boxShadow: selectedProduction === option.key 
                      ? '0 4px 20px rgba(255, 255, 255, 0.3)' 
                      : 'none',
                    borderWidth: '0.5px'
                  }}
                >
                                   <img 
                    src={option.icon} 
                    alt={option.label}
                    style={{
                      width: '124px',
                      height: '124px',
                      objectFit: 'contain'
                    }}
                  />
              </div>
            </button>
                         <span className={`text-sm font-medium mt-3 text-center ${
               selectedProduction === option.key ? 'text-[#E70D57]' : 'text-[#CCCCCC]'
             }`}>
               {option.label}
             </span>
          </div>
        ))}
      </div>

      {/* Selected Production Display */}
      {selectedProduction && (
        <div className="flex items-center gap-3 mb-6">
                     <div 
             className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center text-sm"
             style={{ 
               backgroundColor: selectedProduction === 'handmade' ? '#BB4D4B' : '#4ECDC4'
             }}
           >
             <img 
               src={selectedProduction === 'handmade' ? '/style1.png' : '/style2.png'}
               alt={selectedProduction === 'handmade' ? 'Handmade' : 'Digital'}
               className="w-4 h-4 object-contain"
             />
          </div>
          <span className="text-white/90 text-sm font-medium">
            {productionOptions.find(opt => opt.key === selectedProduction)?.label}
          </span>
        </div>
      )}
    </div>
  );
}
