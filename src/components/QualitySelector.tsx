import React from 'react';

interface QualitySelectorProps {
  selectedQuality: string;
  onQualityChange: (quality: string) => void;
}

const QualitySelector: React.FC<QualitySelectorProps> = ({ 
  selectedQuality, 
  onQualityChange 
}) => {
  const qualityOptions = [
    {
      id: 'fast',
      name: 'Fast',
      description: 'Quick generation with good quality',
      icon: '⚡'
    },
    {
      id: 'medium',
      name: 'Medium',
      description: 'Balanced quality and speed',
      icon: '⚖️'
    },
    {
      id: 'good',
      name: 'Good',
      description: 'Highest quality with detailed results',
      icon: '✨'
    }
  ];

  return (
    <div className="w-full max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-white mb-4 text-center">Quality Selection</h3>
      <div className="space-y-3">
        {qualityOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onQualityChange(option.id)}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
              selectedQuality === option.id
                ? 'border-[#E70D57] bg-[#E70D57]/10 text-white'
                : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10 text-white/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{option.icon}</span>
              <div>
                <div className="font-semibold">{option.name}</div>
                <div className="text-sm opacity-80">{option.description}</div>
              </div>
              {selectedQuality === option.id && (
                <div className="ml-auto">
                  <svg className="w-5 h-5 text-[#E70D57]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QualitySelector;
