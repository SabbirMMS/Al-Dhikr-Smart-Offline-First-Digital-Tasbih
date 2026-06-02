import React from 'react';

interface TargetProgressProps {
  count: number;
  target: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

export const TargetProgress: React.FC<TargetProgressProps> = ({
  count,
  target,
  size = 260,
  strokeWidth = 10,
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(100, Math.max(0, (count / target) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Gold indicator if goal is completed
  const isCompleted = count >= target;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow shadow rings underneath */}
      <div 
        className={`absolute inset-4 rounded-full transition-all duration-500 ease-out -z-10 ${
          isCompleted 
            ? 'bg-amber-500/10 shadow-[0_0_50px_10px_rgba(245,158,11,0.2)]' 
            : 'bg-emerald-500/5 shadow-[0_0_40px_5px_rgba(16,185,129,0.1)]'
        }`}
      />

      <svg width={size} height={size} className="transform -rotate-90 select-none">
        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200/60 dark:text-emerald-950/70 transition-colors"
        />

        {/* Progress trace circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="url(#progress-gradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
        
        {/* Dynamic gradient definition for stroke */}
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            {isCompleted ? (
              <>
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </>
            )}
          </linearGradient>
        </defs>
      </svg>

      {/* Embedded central content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
        {children}
      </div>
    </div>
  );
};
export default TargetProgress;
