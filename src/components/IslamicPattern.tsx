import React from 'react';

interface IslamicPatternProps {
  className?: string;
  opacity?: number;
}

export const IslamicPattern: React.FC<IslamicPatternProps> = ({
  className = '',
  opacity = 0.05,
}) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden ${className}`}
      style={{ opacity }}
    >
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <pattern
            id="islamic-stars"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            {/* Draw a beautiful 8-pointed star pattern */}
            <path
              d="M 40,0 L 48,12 L 60,8 L 52,20 L 64,28 L 50,32 L 40,45 L 30,32 L 16,28 L 28,20 L 20,8 L 32,12 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              className="text-emerald-700 dark:text-amber-500"
            />
            <circle
              cx="40"
              cy="22"
              r="4"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              className="text-emerald-700 dark:text-amber-500"
            />
            {/* Corner connecting elements */}
            <path
              d="M 0,0 Q 20,10 40,0"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              className="text-emerald-700 dark:text-amber-500"
              strokeDasharray="2,2"
            />
            <path
              d="M 40,0 Q 60,10 80,0"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              className="text-emerald-700 dark:text-amber-500"
              strokeDasharray="2,2"
            />
            <path
              d="M 0,80 Q 20,70 40,80"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              className="text-emerald-700 dark:text-amber-500"
              strokeDasharray="2,2"
            />
            <path
              d="M 40,80 Q 60,70 80,80"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              className="text-emerald-700 dark:text-amber-500"
              strokeDasharray="2,2"
            />
            {/* Vertical connections */}
            <path
              d="M 0,0 L 0,80"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-emerald-800 dark:text-amber-600"
            />
            <path
              d="M 80,0 L 80,80"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-emerald-800 dark:text-amber-600"
            />
            {/* Center secondary small stars */}
            <path
              d="M 0,40 L 5,43 L 10,40 L 5,37 Z"
              fill="currentColor"
              className="text-amber-500 opacity-60 dark:text-emerald-400"
            />
            <path
              d="M 80,40 L 75,43 L 70,40 L 75,37 Z"
              fill="currentColor"
              className="text-amber-500 opacity-60 dark:text-emerald-400"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-stars)" />
      </svg>
    </div>
  );
};
export default IslamicPattern;
