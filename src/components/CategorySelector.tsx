import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CategorySelectorProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
}

const GIFT_CATEGORIES = [
  { value: '', label: 'Select...', color: '#9CA3AF' },
  { value: 'birthday', label: 'Birthday', color: '#3B82F6', theme: 'celebration', concepts: ['joy', 'surprise', 'milestone', 'wishes'] },
  { value: 'gender-reveal', label: 'Gender Reveal', color: '#EC4899', theme: 'anticipation', concepts: ['new life', 'excitement', 'family', 'future'] },
  { value: 'pet-memorial', label: 'Pet Memorial', color: '#6B7280', theme: 'remembrance', concepts: ['love', 'memory', 'companion', 'forever'] },
  { value: 'marriage-proposal', label: 'Marriage Proposal', color: '#DC2626', theme: 'romance', concepts: ['love', 'commitment', 'forever', 'dreams'] },
  { value: 'graduation', label: 'Graduation Gift', color: '#059669', theme: 'achievement', concepts: ['success', 'future', 'pride', 'accomplishment'] },
  { value: 'corporate', label: 'Corporate Gift', color: '#1F2937', theme: 'professional', concepts: ['appreciation', 'partnership', 'excellence', 'success'] },
  { value: 'others', label: 'Others', color: '#7C3AED', theme: 'personal', concepts: ['unique', 'special', 'thoughtful', 'meaningful'] }
];

export default function CategorySelector({ selectedCategory, onCategoryChange, className = '' }: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedCategoryData = GIFT_CATEGORIES.find(cat => cat.value === selectedCategory) || GIFT_CATEGORIES[0];

  const handleSelect = (category: string) => {
    onCategoryChange(category);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-[#E70D57] focus:border-transparent transition-colors"
        style={{
          borderRadius: '25px',
          height: '40px',
          paddingLeft: '20px',
          paddingRight: '20px',
          fontSize: '15px'
        }}
      >
        <span 
          className="flex-1 truncate"
          style={{ 
            color: selectedCategory ? '#111827' : '#9CA3AF'
          }}
        >
          {selectedCategoryData.label}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            {GIFT_CATEGORIES.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => handleSelect(category.value)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                  selectedCategory === category.value ? 'bg-gray-50' : ''
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-gray-900 text-sm">{category.label}</span>
                {selectedCategory === category.value && (
                  <div className="ml-auto w-2 h-2 bg-[#E70D57] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export { GIFT_CATEGORIES };