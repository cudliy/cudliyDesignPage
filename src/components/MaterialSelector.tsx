import { useState } from 'react';

interface MaterialSelectorProps {
  selectedMaterial: string;
  onMaterialChange: (material: string) => void;
}
export default function MaterialSelector({ 
  selectedMaterial, 
  onMaterialChange 
}: MaterialSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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

  const handleCategoryClick = (categoryKey: string) => {
    console.log('MaterialSelector: Category clicked:', categoryKey);
    setSelectedCategory(categoryKey);
  };

  const handleBackToCategories = () => {
    console.log('MaterialSelector: Back button clicked');
    setSelectedCategory(null);
  };

  const handleSubcategoryClick = (subcategoryKey: string) => {
    console.log('Subcategory clicked:', subcategoryKey);
    onMaterialChange(subcategoryKey);
  };

  // If a category is selected, show subcategories with back button
  if (selectedCategory) {
    const category = materialCategories.find(cat => cat.key === selectedCategory);
    if (!category) return null;

    return (
      <div className="flex flex-col items-center w-full">
        {/* Breadcrumb Navigation */}
        <div className="mb-4 flex items-center gap-1 text-base font-thin">
          <button 
            onClick={handleBackToCategories}
            className="text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            Material
          </button>
          <span className="text-white/30">{'>'}</span>
          <span className="text-white/90">{category.label}</span>
        </div>

        {/* Subcategories List */}
        <div className="w-full max-w-[360px] space-y-3">
          {category.subcategories.map((subcategory) => (
            <button
              key={subcategory.key}
              onClick={() => handleSubcategoryClick(subcategory.key)}
              className="w-full text-left py-3 px-4 rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/10 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium block leading-tight ${
                    selectedMaterial === subcategory.key ? 'text-white' : 'text-white/70'
                  }`}>
                    {subcategory.label}
                  </span>
                  <p className="text-xs text-white/60 leading-none mt-1.5">{subcategory.description}</p>
                </div>
                {selectedMaterial === subcategory.key && (
                  <div className="w-2.5 h-2.5 rounded-full bg-white ml-3 flex-shrink-0"></div>
                )}
              </div>
            </button>
          ))}
        </div>


      </div>
    );
  }

  // Default view - show categories
  return (
    <div className="flex flex-col items-center w-full">
      {/* Material Categories Grid */}
      <div className="w-full max-w-[420px] mb-3 relative pt-4">
        <div className="grid grid-cols-3 gap-x-6 gap-y-3">
          {materialCategories.map((category) => (
            <div key={category.key} className="relative group">
              {/* Category Circle */}
              <div 
                className="w-20 h-20 rounded-full cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg flex items-center justify-center relative z-10 mx-auto"
                style={{ backgroundColor: category.color }}
                onClick={() => handleCategoryClick(category.key)}
              >
              </div>
              
              {/* Category Label */}
              <div className="text-center mt-2">
                <span className="text-white/90 text-sm font-thin">{category.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Material Display - Fixed z-index issue */}
      {selectedMaterial && (
        <div className="flex items-center gap-3 mt-2 relative z-10">
          <div className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white"></div>
          </div>
          <span className="text-white/90 text-sm font-medium">
            {materialCategories.flatMap(cat => cat.subcategories).find(sub => sub.key === selectedMaterial)?.label}
          </span>
        </div>
      )}
    </div>
  );
}