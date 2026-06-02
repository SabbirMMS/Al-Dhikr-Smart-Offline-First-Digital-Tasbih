interface ProgressRingProps {
  progress: number; // 0–100
  size?: number;
  strokeWidth?: number;
  className?: string;
  isComplete?: boolean;
}

export function ProgressRing({
  progress,
  size = 240,
  strokeWidth = 6,
  className = '',
  isComplete = false,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className={`-rotate-90 ${className}`}
      aria-hidden="true"
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-primary/10"
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={isComplete ? 'text-accent transition-all duration-500' : 'text-primary transition-all duration-300'}
        style={{ filter: isComplete ? 'drop-shadow(0 0 4px var(--tasbih-gold))' : undefined }}
      />
    </svg>
  );
}
