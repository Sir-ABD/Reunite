import React from 'react'
import { FiSun, FiMoon } from 'react-icons/fi'
import { useTheme } from '../../context/ThemeContext'

function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark/light mode"
      title="Toggle dark/light mode"
      className={`
        relative flex items-center justify-center
        w-10 h-10 rounded-full
        bg-neutral-100 dark:bg-neutral-800
        hover:bg-neutral-200 dark:hover:bg-neutral-700
        transition-colors duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-accent
        ${className}
      `}
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon */}
        <FiSun
          size={20}
          className={`
            absolute top-0 left-0
            transition-all duration-300 ease-in-out
            ${isDark ? 'opacity-0 scale-90' : 'opacity-100 scale-100 text-yellow-500'}
          `}
        />

        {/* Moon Icon */}
        <FiMoon
          size={20}
          className={`
            absolute top-0 left-0
            transition-all duration-300 ease-in-out
            ${isDark ? 'opacity-100 scale-100 text-yellow-400' : 'opacity-0 scale-90'}
          `}
        />
      </div>
    </button>
  )
}

export default ThemeToggle
