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
    <div className="w-screen h-screen bg-gray-50 overflow-hidden flex">
      {/* Left Sidebar */}
      <aside className={`absolute bg-[#2B2B2B] ${
        isLoaded ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform -translate-x-8'
      } transition-all duration-500`} style={{ 
        minWidth: '458px',
        width: 'auto',
        height: '850px',
        top: '14px',
        left: '16px',
        borderRadius: '40px'
      }}>
        
        {/* Vertical CUDLIY Brand Text */}
        <div className="absolute left-2 top-[800px] z-10">
          <div className="transform -rotate-90 origin-top-left whitespace-nowrap">
            <span className="font-['Arial'] text-[100px] font-black tracking-tight" style={{
              color: 'transparent',
              WebkitTextStroke: '1px rgba(255, 255, 255, 0.2)'
            }}>
              Cudliy
            </span>
          </div>
        </div>

        {/* Main Sidebar Content */}
        <div className="relative pt-12 px-8 pb-8 text-white h-full">
          {/* Title */}
          <h1 className="font-['Georgia'] text-4xl leading-tight text-left mb-6 font-normal">
            Design<br />Dashboard
          </h1>

          {/* Navigation Container - Adjusted spacing for CUDLIY text */}
          <div className="ml-36 space-y-2">
            {/* Explore Section */}
            <div>
              <h3 className="text-white/60 text-sm font-semibold mb-2 uppercase tracking-wide">Explore</h3>
              <div className="space-y-0.5">
                {navigationItems.explore.map((item, index) => (
                  <button
                    key={index}
                    className={`w-full flex items-center gap-4 p-3 text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all text-left ${
                      item.active ? 'bg-white/10 text-white' : ''
                    }`}
                  >
                    <span className="text-lg opacity-70">{item.icon}</span>
                    <span className="font-medium text-sm">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* My Creations Section */}
            <div>
              <h3 className="text-white/60 text-sm font-semibold mb-2 uppercase tracking-wide">My Creations</h3>
              <div className="space-y-0.5">
                {navigationItems.creations.map((item, index) => (
                  <button
                    key={index}
                    className={`w-full flex items-center gap-4 p-3 text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all text-left ${
                      item.active ? 'bg-[#E91E63] text-white shadow-lg shadow-[#E91E63]/20' : ''
                    }`}
                    onClick={() => setActiveSection(item.name.toLowerCase().replace(' ', ''))}
                  >
                    <span className="text-lg opacity-70">{item.icon}</span>
                    <span className="font-medium text-sm">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subscription Section */}
            <div>
              <h3 className="text-white/60 text-sm font-semibold mb-2 uppercase tracking-wide">Subscription</h3>
              <div className="space-y-0.5">
                {navigationItems.subscription.map((item, index) => (
                  <button
                    key={index}
                    className={`w-full flex items-center gap-4 p-3 text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all text-left ${
                      item.active ? 'bg-white/10 text-white' : ''
                    }`}
                  >
                    <span className="text-lg opacity-70">{item.icon}</span>
                    <span className="font-medium text-sm">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto bg-white rounded-[40px]" style={{ 
        marginLeft: '490px' // minWidth + left + gap
      }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 pb-4">
          <div></div>
          <div className="flex items-center gap-4 sm:gap-6">
            <button className="px-3 sm:px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors font-medium text-sm sm:text-base">
              Design
            </button>
            <button className="px-6 sm:px-8 py-2 sm:py-3 bg-[#E91E63] text-white rounded-full font-semibold hover:bg-[#d81b60] transition-colors shadow-lg text-sm sm:text-base">
              New Design
            </button>
            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-[#FF9800] rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg">
              GP
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 sm:px-8 pb-6 sm:pb-8 overflow-y-auto">
          <h2 className="font-['Georgia'] text-3xl sm:text-4xl lg:text-5xl font-normal text-black mb-6 sm:mb-8">Recent</h2>

          <div className="mb-8 sm:mb-10">
            <input
              type="text"
              placeholder="Search"
              className="w-full max-w-md sm:max-w-lg px-4 sm:px-6 py-3 sm:py-4 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#E91E63] focus:border-transparent bg-white shadow-sm text-base sm:text-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl">
            {designCards.map((card, index) => (
              <div
                key={card.id}
                className={`bg-white border-2 ${card.borderColor} rounded-2xl p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 ${
                  isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
                } relative group`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="flex justify-end mb-3 sm:mb-4">
                  <button className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-all">
                    <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>

                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="w-24 sm:w-32 h-24 sm:h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-20 sm:w-24 h-20 sm:h-24 object-contain"
                    />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="font-semibold text-black text-lg sm:text-xl mb-1 sm:mb-2">{card.title}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm font-medium">{card.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}