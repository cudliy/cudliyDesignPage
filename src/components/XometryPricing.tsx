// XometryPricing Component - Commented out for now
// Remove this comment block and restore the original file when ready to use Xometry API

interface XometryPricingProps {
  modelUrl: string;
  className?: string;
}

export default function XometryPricing({ modelUrl, className = '' }: XometryPricingProps) {
  return (
    <div className={`bg-gray-800 text-white p-4 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Manufacturing Quote</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-xs text-gray-300">Disabled</span>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-lg text-gray-400">Xometry integration disabled</div>
        <div className="text-xs text-gray-500 mt-1">
          Enable in code when ready to use
        </div>
      </div>
      
      <div className="text-xs text-gray-400">
        <div>Model URL: {modelUrl ? 'Available' : 'Not available'}</div>
        <div>Status: Xometry service disabled</div>
      </div>
    </div>
  );
}