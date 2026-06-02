interface IslamicPatternProps {
  className?: string;
  opacity?: number;
}

export function IslamicPattern({ className = '', opacity = 0.06 }: IslamicPatternProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="islamic-star" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <g fill="currentColor">
              {/* 8-pointed Islamic star */}
              <path d="M40 5 L43.5 24 L60 15 L51 31.5 L70 35 L51 38.5 L60 55 L43.5 46 L40 65 L36.5 46 L20 55 L29 38.5 L10 35 L29 31.5 L20 15 L36.5 24 Z" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-star)" />
      </svg>
    </div>
  );
}

export function IslamicBorder({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 400 20" preserveAspectRatio="none" className="w-full h-4" aria-hidden="true">
        <path
          d="M0,10 Q10,0 20,10 Q30,20 40,10 Q50,0 60,10 Q70,20 80,10 Q90,0 100,10 Q110,20 120,10 Q130,0 140,10 Q150,20 160,10 Q170,0 180,10 Q190,20 200,10 Q210,0 220,10 Q230,20 240,10 Q250,0 260,10 Q270,20 280,10 Q290,0 300,10 Q310,20 320,10 Q330,0 340,10 Q350,20 360,10 Q370,0 380,10 Q390,20 400,10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-primary/30"
        />
      </svg>
    </div>
  );
}
