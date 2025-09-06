interface MaterialSelectorProps {
  selectedMaterial: string;
  onMaterialChange: (material: string) => void;
}
export default function MaterialSelector({ 
  selectedMaterial, 
  onMaterialChange 
}: MaterialSelectorProps) {
  const materialCategories = [
    {
      key: 'soft',
      label: 'Soft',
      color: '#8B7355', // Brown/tan color
      subcategories: [
        { key: 'fabric-yarn', label: 'Fabric / Yarn', description: 'Knit, crochet, or sewn' },
        { key: 'special-finish-soft', label: 'Special Finish', description: 'Padded or stuffed effects' }
      ]
    },
    {
      key: 'texture',
      label: 'Texture',
      color: '#5C7A5C', // Green color
      subcategories: [
        { key: 'wood-textured', label: 'Wood', description: 'Grain, carved' },
        { key: 'fabric-yarn-textured', label: 'Fabric / Yarn', description: 'Knit, crochet' },
        { key: 'clay-ceramic-textured', label: 'Clay / Ceramic', description: 'Hand-molded texture' },
        { key: 'special-finish-textured', label: 'Special Finish', description: 'Embossed, hybrid mix' }
      ]
    },
    {
      key: 'size',
      label: 'Size',
      color: '#2A2A2A', // Dark color (like the image shows)
      subcategories: [
        { key: 'small', label: 'Small', description: 'Compact designs' },
        { key: 'medium', label: 'Medium', description: 'Standard size' },
        { key: 'large', label: 'Large', description: 'Bigger designs' },
        { key: 'custom', label: 'Custom', description: 'Custom dimensions' }
      ]
    },
    {
      key: 'hard',
      label: 'Hard',
      color: '#8B7355', // Brown/tan color (second row)
      subcategories: [
        { key: 'plastic-hard', label: 'Plastic', description: 'PLA, ABS, PETG, and Resin' },
        { key: 'wood', label: 'Wood', description: 'Carved or assembled wood' },
        { key: 'metal', label: 'Metal', description: 'Wire, sheet metal, and small cast metal' },
        { key: 'clay-ceramic', label: 'Clay / Ceramic', description: 'Kiln-fired clay or ceramic' }
      ]
    },
    {
      key: 'smooth',
      label: 'Smooth',
      color: '#5C7A5C', // Green color (second row)
      subcategories: [
        { key: 'plastic-smooth', label: 'Plastic', description: 'Resin and PETG' },
        { key: 'metal-smooth', label: 'Metal', description: 'Polished metal' },
        { key: 'special-finish-smooth', label: 'Special Finish', description: 'Painted or polished finishes' }
      ]
    },
    {
      key: 'flexible',
      label: 'Flexible',
      color: '#8B7355', // Brown/tan color (second row, third item)
      subcategories: [
        { key: 'plastic-flexible', label: 'Plastic', description: 'TPU and Nylon' },
        { key: 'fabric-yarn-flexible', label: 'Fabric / Yarn', description: 'Flexible fabric materials' },
        { key: 'paper-cardboard', label: 'Paper / Cardboard', description: 'Origami or folds' }
      ]
    }
  ];

  const handleSubcategoryClick = (subcategoryKey: string) => {
    console.log('Subcategory clicked:', subcategoryKey);
    onMaterialChange(subcategoryKey);
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Material Categories Grid */}
      <div className="w-full max-w-[350px] mb-20 relative pt-4">
        <div className="grid grid-cols-3 gap-4">
          {materialCategories.map((category) => (
            <div key={category.key} className="relative group">
              {/* Category Circle */}
              <div 
                className="w-20 h-20 rounded-full cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg flex items-center justify-center relative z-10"
                style={{ backgroundColor: category.color }}
              >
                {/* Hover Tooltip */}
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800/95 text-white text-xs px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-[9999] shadow-lg border border-white/20">
                  {category.label}
                </div>
              </div>
              
              {/* Hover Subcategories Panel - Appears above circles */}
              <div 
                className="absolute opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto bg-gray-900/98 backdrop-blur-lg rounded-xl p-1.5 shadow-2xl border border-white/40 z-[99999]"
                style={{
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: '8px',
                  minWidth: '220px',
                  maxWidth: '240px'
                }}
              >
                <div className="space-y-0.5">
                  {category.subcategories.map((subcategory) => (
                    <button
                      key={subcategory.key}
                      onClick={() => handleSubcategoryClick(subcategory.key)}
                      className={`w-full text-left py-0.5 px-2 rounded-md transition-all duration-200 cursor-pointer ${
                        selectedMaterial === subcategory.key
                          ? 'bg-[#E70D57]/20 border border-[#E70D57]/30'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium block leading-tight ${
                            selectedMaterial === subcategory.key ? 'text-[#E70D57]' : 'text-white/90'
                          }`}>
                            {subcategory.label}
                          </span>
                          <p className="text-xs text-white/60 leading-none truncate">{subcategory.description}</p>
                        </div>
                        {selectedMaterial === subcategory.key && (
                          <div className="w-2 h-2 rounded-full bg-[#E70D57] ml-2 flex-shrink-0"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Category Label */}
              <div className="text-center mt-2">
                <span className="text-white/90 text-sm font-medium">{category.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Material Display - Fixed z-index issue */}
      {selectedMaterial && (
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#E70D57]"></div>
          </div>
          <span className="text-white/90 text-sm font-medium">
            {materialCategories.flatMap(cat => cat.subcategories).find(sub => sub.key === selectedMaterial)?.label}
          </span>
        </div>
      )}
    </div>
  );
}