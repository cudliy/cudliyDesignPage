import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';

export default function DarkModeDebugPanel() {
  const { theme, toggleTheme } = useTheme();
  const [htmlClass, setHtmlClass] = useState('');
  const [localStorageTheme, setLocalStorageTheme] = useState('');

  useEffect(() => {
    const updateDebugInfo = () => {
      setHtmlClass(document.documentElement.className);
      setLocalStorageTheme(localStorage.getItem('theme') || 'not set');
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 500);
    return () => clearInterval(interval);
  }, [theme]);

  return (
    <div className="fixed bottom-4 left-4 z-[10000] bg-white dark:bg-slate-800 border-2 border-black dark:border-white p-4 rounded-lg shadow-2xl max-w-xs">
      <h3 className="font-bold text-black dark:text-white mb-2">🐛 Dark Mode Debug</h3>
      <div className="space-y-2 text-xs">
        <div className="text-black dark:text-white">
          <strong>Context Theme:</strong> {theme}
        </div>
        <div className="text-black dark:text-white">
          <strong>HTML Class:</strong> {htmlClass}
        </div>
        <div className="text-black dark:text-white">
          <strong>localStorage:</strong> {localStorageTheme}
        </div>
        <button
          onClick={() => {
            toggleTheme();
          }}
          className="w-full mt-2 px-3 py-2 bg-black dark:bg-white text-white dark:text-black rounded font-medium hover:opacity-80 transition-opacity"
        >
          Toggle Theme
        </button>
        <button
          onClick={() => {
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
          }}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded text-xs hover:opacity-80 transition-opacity"
        >
          Force Dark
        </button>
        <button
          onClick={() => {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
            localStorage.setItem('theme', 'light');
          }}
          className="w-full px-3 py-2 bg-gray-200 text-black rounded text-xs hover:opacity-80 transition-opacity"
        >
          Force Light
        </button>
      </div>
    </div>
  );
}
