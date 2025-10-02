import { BadgeCheck, Eye, Heart, MessageCircle } from "lucide-react";

type CreatorCardProps = {
  image: string;
  title: string;
  size?: 'small' | 'medium' | 'large';
};

const CreatorCard: React.FC<CreatorCardProps> = ({ image, title, size = "medium" }) => {
  const getCardHeight = () => {
    switch (size) {
      case 'large': return 'h-72 sm:h-80 md:h-96';
      case 'small': return 'h-48 sm:h-56 md:h-64';
      default: return 'h-60 sm:h-72 md:h-80';
    }
  };

  const getCardRounding = () => {
    // Slightly reduced, consistent rounding for a smoother, more subtle curve
    return 'rounded-[16px] sm:rounded-[20px]';
  };

  const getBottomRounding = () => {
    // Match the outer rounding on the bottom section
    return 'rounded-b-[16px] sm:rounded-b-[20px]';
  };

  const getInfoPadding = () => {
    switch (size) {
      case 'large': return 'p-4 sm:p-5';
      case 'small': return 'p-2 sm:p-2.5';
      default: return 'p-3 sm:p-4';
    }
  };

  return (
    <div className={`group cursor-pointer ${getCardRounding()} overflow-hidden border border-gray-200 bg-white shadow-sm transition-all duration-500 hover:shadow-xl hover:scale-105 hover:-translate-y-2 w-full transform`}>
      <div className={`${getCardHeight()} w-full overflow-hidden`}>
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
        />
      </div>
      <div className={`bg-neutral-900 text-white ${getInfoPadding()} ${getBottomRounding()} min-h-[56px] sm:min-h-[64px] transform transition-all duration-300`}>
        <h3 className="font-medium text-xs sm:text-sm leading-none truncate whitespace-nowrap flex items-center gap-1 pr-2 group-hover:text-[#E70A55] transition-colors duration-300">
          {title}
          <BadgeCheck className="text-yellow-300 h-3 w-3 sm:h-4 sm:w-4 shrink-0 animate-pulse" />
        </h3>
        <div className="mt-1.5 sm:mt-2 flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-neutral-400 whitespace-nowrap">
          <span className="inline-flex items-center gap-0.5 sm:gap-1 group-hover:text-white transition-colors duration-300">
            <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> 33k
          </span>
          <span className="inline-flex items-center gap-0.5 sm:gap-1 group-hover:text-red-400 transition-colors duration-300">
            <Heart className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> 238
          </span>
          <span className="inline-flex items-center gap-0.5 sm:gap-1 group-hover:text-blue-400 transition-colors duration-300">
            <MessageCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> 28
          </span>
        </div>
      </div>
    </div>
  );
};

export default CreatorCard;