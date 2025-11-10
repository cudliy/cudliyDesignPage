import { useTheme } from '../contexts/ThemeContext';

/**
 * DarkModeShowcase - A component demonstrating dark mode implementation
 * This can be used as a reference for implementing dark mode in other components
 */
export default function DarkModeShowcase() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg-primary transition-colors duration-300 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#212121] dark:text-dark-text-primary mb-4">
            Dark Mode Showcase
          </h1>
          <p className="text-gray-600 dark:text-dark-text-secondary">
            Current theme: <span className="font-semibold">{theme}</span>
          </p>
        </div>

        {/* Toggle Button */}
        <div className="flex justify-center">
          <button
            onClick={toggleTheme}
            className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 flex items-center gap-2"
          >
            {theme === 'light' ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                Switch to Dark Mode
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Switch to Light Mode
              </>
            )}
          </button>
        </div>

        {/* Color Palette */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#212121] dark:text-dark-text-primary">
            Color Palette
          </h2>
          
          {/* Backgrounds */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-dark-bg-primary border border-gray-200 dark:border-dark-border-primary rounded-lg p-4">
              <div className="text-sm font-semibold text-[#212121] dark:text-dark-text-primary mb-2">
                Primary BG
              </div>
              <div className="text-xs text-gray-600 dark:text-dark-text-secondary">
                Main background
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border-primary rounded-lg p-4">
              <div className="text-sm font-semibold text-[#212121] dark:text-dark-text-primary mb-2">
                Secondary BG
              </div>
              <div className="text-xs text-gray-600 dark:text-dark-text-secondary">
                Cards, panels
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border-primary rounded-lg p-4">
              <div className="text-sm font-semibold text-[#212121] dark:text-dark-text-primary mb-2">
                Tertiary BG
              </div>
              <div className="text-xs text-gray-600 dark:text-dark-text-secondary">
                Hover states
              </div>
            </div>
          </div>

          {/* Text Colors */}
          <div className="bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border-primary rounded-lg p-6 space-y-2">
            <div className="text-lg font-bold text-[#212121] dark:text-dark-text-primary">
              Primary Text - Main headings and important content
            </div>
            <div className="text-base text-gray-600 dark:text-dark-text-secondary">
              Secondary Text - Body text and descriptions
            </div>
            <div className="text-sm text-gray-400 dark:text-dark-text-tertiary">
              Tertiary Text - Muted text and captions
            </div>
          </div>
        </div>

        {/* Components */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#212121] dark:text-dark-text-primary">
            Components
          </h2>

          {/* Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border-primary rounded-lg p-6 hover:shadow-lg dark:hover:shadow-2xl transition-all">
              <h3 className="text-lg font-semibold text-[#212121] dark:text-dark-text-primary mb-2">
                Card Title
              </h3>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                This is a card component with hover effects
              </p>
            </div>
            <div className="bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border-primary rounded-lg p-6 hover:shadow-lg dark:hover:shadow-2xl transition-all">
              <h3 className="text-lg font-semibold text-[#212121] dark:text-dark-text-primary mb-2">
                Another Card
              </h3>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                Cards adapt beautifully to dark mode
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4">
            <button className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
              Primary Button
            </button>
            <button className="px-4 py-2 bg-gray-100 dark:bg-dark-bg-tertiary text-[#212121] dark:text-dark-text-primary rounded-lg hover:bg-gray-200 dark:hover:bg-dark-bg-primary transition-colors">
              Secondary Button
            </button>
            <button className="px-4 py-2 bg-[#FF9CB5] text-white rounded-lg hover:bg-[#FA7072] transition-colors">
              Accent Button
            </button>
            <button className="px-4 py-2 border border-gray-300 dark:border-dark-border-secondary text-[#212121] dark:text-dark-text-primary rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors">
              Outline Button
            </button>
          </div>

          {/* Input Fields */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Text input"
              className="w-full px-4 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border-secondary rounded-lg text-[#212121] dark:text-dark-text-primary placeholder-gray-400 dark:placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-[#FF9CB5] transition-colors"
            />
            <textarea
              placeholder="Textarea"
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border-secondary rounded-lg text-[#212121] dark:text-dark-text-primary placeholder-gray-400 dark:placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-[#FF9CB5] transition-colors"
            />
          </div>
        </div>

        {/* Lists */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#212121] dark:text-dark-text-primary">
            Lists
          </h2>
          <div className="bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border-primary rounded-lg divide-y divide-gray-200 dark:divide-dark-border-primary">
            {['Item 1', 'Item 2', 'Item 3'].map((item, index) => (
              <div
                key={index}
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors cursor-pointer"
              >
                <div className="text-sm font-medium text-[#212121] dark:text-dark-text-primary">
                  {item}
                </div>
                <div className="text-xs text-gray-600 dark:text-dark-text-secondary mt-1">
                  Description for {item.toLowerCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
