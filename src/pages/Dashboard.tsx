import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [, setActiveSection] = useState('recent');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const navigationItems = {
    explore: [
      { name: 'Tutorial', icon: '🎓', active: false },
      { name: 'Community', icon: '👥', active: false }
    ],
    creations: [
      { name: 'Recent', icon: '📄', active: true },
      { name: 'All Files', icon: '📄', active: false },
      { name: 'Order history', icon: '🕐', active: false },
      { name: 'Trash', icon: '🗑️', active: false }
    ],
    subscription: [
      { name: 'Credit balance', icon: '💳', active: false },
      { name: 'Upgrade to Pro', icon: '⚡', active: false },
      { name: 'EDU License', icon: '🧭', active: false }
    ]
  };

  const designCards = [
    {
      id: 1,
      title: 'Cute Dinosaur',
      category: '3D Toys',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRkY2B0I4Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjE1IiBmaWxsPSIjRkZGIi8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPGVsbGlwc2UgY3g9IjUwIiBjeT0iNzAiIHJ4PSIyMCIgcnk9IjEwIiBmaWxsPSIjRkZGIi8+Cjx0ZXh0IHg9IjUwIiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkRpbm88L3RleHQ+Cjwvc3ZnPgo=',
      borderColor: 'border-pink-300'
    },
    {
      id: 2,
      title: 'Cute Dino bird',
      category: '3D Toys',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjOERDQjk3Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjE1IiBmaWxsPSIjRkZGIi8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPGVsbGlwc2UgY3g9IjUwIiBjeT0iNzAiIHJ4PSIyMCIgcnk9IjEwIiBmaWxsPSIjRkZGIi8+Cjx0ZXh0IHg9IjUwIiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJpcmQ8L3RleHQ+Cjwvc3ZnPgo=',
      borderColor: 'border-gray-300'
    },
    {
      id: 3,
      title: 'Spiky Creature',
      category: '3D Toys',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjQjA4NEVEIi8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjE1IiBmaWxsPSIjRkZGIi8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPGVsbGlwc2UgY3g9IjUwIiBjeT0iNzAiIHJ4PSIyMCIgcnk9IjEwIiBmaWxsPSIjRkZGIi8+Cjx0ZXh0IHg9IjUwIiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlNwaWt5PC90ZXh0Pgo8L3N2Zz4K',
      borderColor: 'border-purple-300'
    },
    {
      id: 4,
      title: 'Cool Sunglasses',
      category: '3D Toys',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNDBFMEQwIi8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjE1IiBmaWxsPSIjRkZGIi8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPGVsbGlwc2UgY3g9IjUwIiBjeT0iNzAiIHJ4PSIyMCIgcnk9IjEwIiBmaWxsPSIjRkZGIi8+Cjx0ZXh0IHg9IjUwIiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkNvb2w8L3RleHQ+Cjwvc3ZnPgo=',
      borderColor: 'border-teal-300'
    }
  ];

  return (
    <div className="w-full h-screen bg-gray-50 overflow-hidden flex p-2 sm:p-4">
      {/* Left Sidebar */}
      <aside className={`bg-[#2B2B2B] ${
        isLoaded ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform -translate-x-8'
      } transition-all duration-500 relative flex-shrink-0`} 
      style={{ 
        width: 'clamp(320px, 35vw, 458px)',
        borderRadius: 'clamp(20px, 4vw, 40px)',
        minHeight: '0'
      }}>
        
        {/* Vertical CUDLIY Brand Text */}
        <div className="absolute left-4 bottom-2 z-50 pointer-events-none">
          <div className="transform -rotate-90 origin-top-left whitespace-nowrap">
            <span className="font-['Manrope'] font-extrabold" style={{
              width: '305px',
              height: '131px',
              fontSize: '96px',
              lineHeight: '100%',
              letterSpacing: '0%',
              color: 'transparent',
              WebkitTextStroke: '1px #686868',
              opacity: 1
            }}>
              CUDLIY
            </span>
          </div>
        </div>

        {/* Main Sidebar Content */}
        <div className="relative h-full flex flex-col text-white overflow-hidden">
          {/* Title */}
          <div className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-12 pb-4 sm:pb-6">
            <h1 className="font-['Georgia'] leading-tight text-left font-normal" 
                style={{ fontSize: 'clamp(24px, 4vw, 36px)' }}>
              Design<br />Dashboard
            </h1>
          </div>

          {/* Navigation Container - Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
            <div className="space-y-4 sm:space-y-6" style={{ marginLeft: 'clamp(60px, 12vw, 144px)' }}>
              {/* Explore Section */}
              <div>
                <h3 className="text-white/60 text-xs sm:text-sm font-semibold mb-2 uppercase tracking-wide">Explore</h3>
                <div className="space-y-0.5">
                  {navigationItems.explore.map((item, index) => (
                    <button
                      key={index}
                      className={`w-full flex items-center gap-3 sm:gap-4 p-2 sm:p-3 text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all text-left ${
                        item.active ? 'bg-white/10 text-white' : ''
                      }`}
                    >
                      <span className="text-sm sm:text-lg opacity-70">{item.icon}</span>
                      <span className="font-medium text-xs sm:text-sm">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* My Creations Section */}
              <div>
                <h3 className="text-white/60 text-xs sm:text-sm font-semibold mb-2 uppercase tracking-wide">My Creations</h3>
                <div className="space-y-0.5">
                  {navigationItems.creations.map((item, index) => (
                    <button
                      key={index}
                      className={`w-full flex items-center gap-3 sm:gap-4 p-2 sm:p-3 text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all text-left ${
                        item.active ? 'bg-[#E91E63] text-white shadow-lg shadow-[#E91E63]/20' : ''
                      }`}
                      onClick={() => setActiveSection(item.name.toLowerCase().replace(' ', ''))}
                    >
                      <span className="text-sm sm:text-lg opacity-70">{item.icon}</span>
                      <span className="font-medium text-xs sm:text-sm">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subscription Section */}
              <div>
                <h3 className="text-white/60 text-xs sm:text-sm font-semibold mb-2 uppercase tracking-wide">Subscription</h3>
                <div className="space-y-0.5">
                  {navigationItems.subscription.map((item, index) => (
                    <button
                      key={index}
                      className={`w-full flex items-center gap-3 sm:gap-4 p-2 sm:p-3 text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all text-left ${
                        item.active ? 'bg-white/10 text-white' : ''
                      }`}
                    >
                      <span className="text-sm sm:text-lg opacity-70">{item.icon}</span>
                      <span className="font-medium text-xs sm:text-sm">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col bg-white ml-2 sm:ml-4" 
           style={{ borderRadius: 'clamp(20px, 4vw, 40px)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 lg:p-8 pb-2 sm:pb-4 flex-shrink-0">
          <div></div>
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
            <button className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-gray-500 hover:text-gray-700 transition-colors font-medium text-xs sm:text-sm lg:text-base">
              Design
            </button>
            <button className="px-3 sm:px-6 lg:px-8 py-1.5 sm:py-2 lg:py-3 bg-[#E91E63] text-white rounded-full font-semibold hover:bg-[#d81b60] transition-colors shadow-lg text-xs sm:text-sm lg:text-base">
              New Design
            </button>
            <div className="w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 bg-[#FF9800] rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base lg:text-lg shadow-lg">
              GP
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
          <h2 className="font-['Georgia'] font-normal text-black mb-4 sm:mb-6 lg:mb-8" 
              style={{ fontSize: 'clamp(28px, 5vw, 48px)' }}>
            Recent
          </h2>

          <div className="mb-6 sm:mb-8 lg:mb-10">
            <input
              type="text"
              placeholder="Search"
              className="w-full max-w-md sm:max-w-lg px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#E91E63] focus:border-transparent bg-white shadow-sm text-sm sm:text-base lg:text-lg"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-4xl">
            {designCards.map((card, index) => (
              <div
                key={card.id}
                className={`bg-white border-2 ${card.borderColor} rounded-2xl p-3 sm:p-4 lg:p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 ${
                  isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
                } relative group`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="flex justify-end mb-2 sm:mb-3 lg:mb-4">
                  <button className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-all">
                    <svg className="w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>

                <div className="flex justify-center mb-3 sm:mb-4 lg:mb-6">
                  <div className="w-16 sm:w-20 lg:w-24 xl:w-32 h-16 sm:h-20 lg:h-24 xl:h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-14 sm:w-16 lg:w-20 xl:w-24 h-14 sm:h-16 lg:h-20 xl:h-24 object-contain"
                    />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="font-semibold text-black mb-1 sm:mb-2" 
                      style={{ fontSize: 'clamp(14px, 2.5vw, 20px)' }}>
                    {card.title}
                  </h3>
                  <p className="text-gray-400 font-medium" 
                     style={{ fontSize: 'clamp(10px, 2vw, 14px)' }}>
                    {card.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}