import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface DarkModeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function DarkModeToggle({ className = '', size = 'md' }: DarkModeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const handleClick = () => {
    toggleTheme();
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all duration-300 bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-500 cursor-pointer pointer-events-auto shadow-lg hover:shadow-xl backdrop-blur-sm ${className}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      style={{ zIndex: 9999 }}
    >
      {theme === 'light' ? (
        <Moon size={iconSizes[size]} className="text-slate-600 hover:text-slate-800 transition-colors duration-300" />
      ) : (
        <Sun size={iconSizes[size]} className="text-yellow-500 hover:text-yellow-400 transition-colors duration-300" />
      )}
    </button>
  );
}
