import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  angle: number;
  velocity: number;
  opacity: number;
  rotation: number;
}

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

const COLORS = [
  '#d97706', // gold
  '#f59e0b', // amber
  '#10b981', // emerald
  '#34d399', // mint
  '#fbbf24', // yellow gold
  '#059669', // deep emerald
];

export const Confetti: React.FC<ConfettiProps> = ({ active, onComplete }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;

    // Generate burst of particles
    const newParticles: Particle[] = Array.from({ length: 80 }).map((_, idx) => {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 5 + Math.random() * 15;
      return {
        id: idx + Date.now(),
        x: 0,
        y: 0,
        size: 5 + Math.random() * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        angle,
        velocity,
        opacity: 1,
        rotation: Math.random() * 360,
      };
    });

    setParticles(newParticles);

    // Animate particles
    let animationFrameId: number;
    const startTime = Date.now();
    const duration = 2500; // 2.5 seconds

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        setParticles([]);
        if (onComplete) onComplete();
        return;
      }

      setParticles((prev) =>
        prev.map((p) => {
          // Physics calculation
          const speed = p.velocity * (1 - progress);
          const dx = Math.cos(p.angle) * speed;
          // Gravity pull downwards
          const dy = Math.sin(p.angle) * speed + progress * 8; 

          return {
            ...p,
            x: p.x + dx,
            y: p.y + dy,
            opacity: 1 - progress,
            rotation: p.rotation + p.velocity,
          };
        })
      );

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [active]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden flex items-center justify-center">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            width: `${p.size}px`,
            height: `${p.size * (0.6 + Math.random() * 0.8)}px`,
            backgroundColor: p.color,
            transform: `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.rotation}deg)`,
            opacity: p.opacity,
            boxShadow: p.color === '#d97706' || p.color === '#f59e0b' ? '0 0 8px rgba(217, 119, 6, 0.4)' : 'none',
            transition: 'transform 0.05s linear',
          }}
        />
      ))}
    </div>
  );
};
export default Confetti;
