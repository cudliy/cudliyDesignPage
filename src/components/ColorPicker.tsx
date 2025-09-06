import { useEffect, useRef, useState } from 'react';
import iro from '@jaames/iro';

interface ColorPickerProps {
  onColorChange: (color: string) => void;
}

export default function ColorPicker({ onColorChange }: ColorPickerProps) {
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<any>(null);
  const onColorChangeRef = useRef(onColorChange);
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const [colors, setColors] = useState(['#D9F4FF', '#00FF00', '#0000FF']);

  useEffect(() => {
    if (colorPickerRef.current && !pickerRef.current) {
      // Create a new color picker instance
      const colorPicker = (iro as any).ColorPicker(colorPickerRef.current, {
        width: 260,
        colors: [
          "rgb(217, 244, 255)",
          "rgb(0, 255, 0)", 
          "rgb(0, 0, 255)",
        ],
        handleRadius: 9,
        borderWidth: 1,
        borderColor: "#fff",
      });

      // Handle color changes
      colorPicker.on(["mount", "color:change"], function() {
        const newColors = colorPicker.colors.map((color: any) => color.hexString);
        setColors(newColors);
        
        // Calculate aggregate color (average of all three)
        const aggregateColor = calculateAggregateColor(newColors);
        if (onColorChangeRef.current) {
          onColorChangeRef.current(aggregateColor);
        }
      });

      colorPicker.on(["mount", "color:setActive", "color:change"], function() {
        setActiveColorIndex(colorPicker.color.index);
      });

      pickerRef.current = colorPicker;
    }

    return () => {
      if (pickerRef.current && typeof pickerRef.current.destroy === 'function') {
        pickerRef.current.destroy();
        pickerRef.current = null;
      }
    };
  }, []);

  // Update callback ref when onColorChange changes
  useEffect(() => {
    onColorChangeRef.current = onColorChange;
  }, [onColorChange]);

  // Calculate aggregate color from three points
  const calculateAggregateColor = (colorArray: string[]) => {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const rgbToHex = (r: number, g: number, b: number) => {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

    const rgbValues = colorArray.map(hexToRgb).filter(Boolean);
    if (rgbValues.length === 0) return '#000000';

    const avgR = Math.round(rgbValues.reduce((sum, rgb) => sum + rgb!.r, 0) / rgbValues.length);
    const avgG = Math.round(rgbValues.reduce((sum, rgb) => sum + rgb!.g, 0) / rgbValues.length);
    const avgB = Math.round(rgbValues.reduce((sum, rgb) => sum + rgb!.b, 0) / rgbValues.length);

    return rgbToHex(avgR, avgG, avgB);
  };

  const setColor = (colorIndex: number) => {
    if (pickerRef.current) {
      pickerRef.current.setActiveColor(colorIndex);
    }
  };

  const aggregateColor = calculateAggregateColor(colors);

  return (
    <div className="flex w-full gap-4">
      {/* Left Side - Color Picker */}
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center mb-2">
          <div ref={colorPickerRef} className="flex-shrink-0"></div>
        </div>
        
        {/* Active Color Display */}
        <div className="flex items-center gap-1.5">
          <div 
            className="w-5 h-5 rounded-full border border-white/30"
            style={{ backgroundColor: colors[activeColorIndex] }}
          ></div>
          <span className="text-white/90 text-xs font-mono">
            {colors[activeColorIndex].toUpperCase()}
          </span>
        </div>
      </div>

      {/* Right Side - Ultra Compact Three Points Panel */}
      <div className="flex flex-col min-w-[140px] bg-white/5 rounded p-2 border border-white/10">
        <h3 className="text-white/90 text-xs font-semibold mb-2 text-center">3-Point</h3>
        
        {/* Color Points */}
        <div className="space-y-1.5 mb-2">
          {colors.map((color, index) => (
            <div 
              key={index}
              onClick={() => setColor(index)}
              className={`flex items-center gap-1.5 p-1 rounded cursor-pointer transition-all duration-200 ${
                index === activeColorIndex ? 'bg-white/10 scale-105' : 'hover:bg-white/5'
              }`}
            >
              <div 
                className="w-5 h-5 rounded-full border transition-all duration-200 flex-shrink-0"
                style={{ 
                  backgroundColor: color,
                  borderColor: index === activeColorIndex ? '#ffffff' : 'rgba(255,255,255,0.3)'
                }}
              ></div>
              <div className="flex flex-col min-w-0">
                <span className="text-white/90 text-xs truncate">P{index + 1}</span>
                <span className="text-white/70 text-xs font-mono truncate">{color.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Aggregate Color Display */}
        <div className="border-t border-white/10 pt-2">
          <div className="flex items-center gap-1.5 mb-1">
            <div 
              className="w-6 h-6 rounded-full border border-white/30 flex-shrink-0"
              style={{ backgroundColor: aggregateColor }}
            ></div>
            <div className="flex flex-col min-w-0">
              <span className="text-white/90 text-xs font-semibold">Agg</span>
              <span className="text-white/70 text-xs font-mono truncate">{aggregateColor.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

