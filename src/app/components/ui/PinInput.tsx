import { useState, useRef } from 'react';
import { Delete } from 'lucide-react';
import { motion } from 'motion/react';

interface PinInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  error?: string;
  title?: string;
}

export function PinInput({ length = 4, onComplete, error, title = 'Enter PIN' }: PinInputProps) {
  const [digits, setDigits] = useState<string[]>([]);

  const handleDigit = (d: string) => {
    if (digits.length >= length) return;
    const next = [...digits, d];
    setDigits(next);
    if (next.length === length) {
      setTimeout(() => onComplete(next.join('')), 100);
    }
  };

  const handleDelete = () => {
    setDigits(prev => prev.slice(0, -1));
  };

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-muted-foreground">{title}</p>

      {/* Dots */}
      <div className="flex gap-4">
        {Array.from({ length }).map((_, i) => (
          <motion.div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-colors ${
              i < digits.length ? 'bg-primary border-primary' : 'border-muted-foreground/40'
            }`}
            animate={{ scale: i === digits.length - 1 ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.2 }}
          />
        ))}
      </div>

      {error && (
        <motion.p
          className="text-destructive text-sm"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {KEYS.map((key, idx) => {
          if (key === '') return <div key={idx} />;
          if (key === '⌫') {
            return (
              <button
                key={idx}
                onClick={handleDelete}
                className="flex items-center justify-center h-14 rounded-2xl bg-muted text-foreground active:scale-95 transition-transform"
                aria-label="Delete"
              >
                <Delete size={20} />
              </button>
            );
          }
          return (
            <button
              key={idx}
              onClick={() => handleDigit(key)}
              className="flex items-center justify-center h-14 rounded-2xl bg-card border border-border text-foreground active:scale-95 transition-transform hover:bg-secondary/50 shadow-sm"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
