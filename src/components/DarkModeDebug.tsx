import { useTheme } from '../contexts/ThemeContext';
import { useEffect } from 'react';

export default function DarkModeDebug() {
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Debug component mounted
  }, [theme]);

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-slate-800 border-2 border-black dark:border-white p-4 rounded-lg shadow-lg">
      <div className="space-y-2">
        <div className="text-sm font-bold text-black dark:text-white">
          Dark Mode Debug
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300">
          Current: <span className="font-mono font-bold">{theme}</span>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300">
          HTML: <span className="font-mono text-[10px]">{document.documentElement.className}</span>
        </div>
        <button
          onClick={() => {
            toggleTheme();
          }}
          className="w-full px-3 py-2 bg-black dark:bg-white text-white dark:text-black rounded text-sm font-medium hover:opacity-80 transition-opacity"
        >
          Toggle Theme
        </button>
        <div className="mt-2 p-2 bg-gray-100 dark:bg-slate-700 rounded">
          <div className="text-[10px] text-gray-600 dark:text-gray-300">
            This box should change color
          </div>
        </div>
      </div>
    </div>
  );
}
