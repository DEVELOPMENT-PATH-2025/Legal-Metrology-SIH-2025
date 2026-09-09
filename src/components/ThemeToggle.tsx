import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 cursor-pointer
        ${isDark 
          ? 'bg-slate-800/90 hover:bg-slate-800 text-[#F28C28] border border-slate-700 shadow-sm' 
          : 'bg-[#F7F9FC] hover:bg-[#E2E8F0] text-[#123B5D] border border-[#D9E2EC] shadow-sm'} 
        ${className}`}
    >
      <div className="flex items-center space-x-1.5">
        {isDark ? (
          <Sun className="w-4 h-4 text-[#F28C28] transition-transform duration-300 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-[#123B5D] transition-transform duration-300 -rotate-12 hover:rotate-0" />
        )}
        {showLabel && (
          <span className="text-xs font-semibold select-none">
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </span>
        )}
      </div>
    </button>
  );
};
