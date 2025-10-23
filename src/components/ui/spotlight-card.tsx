import React, { ReactNode } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
}

// Lightweight wrapper to replace the previous heavy "glow" implementation.
// Kept for compatibility with existing imports; it simply forwards children and
// applies className. If you want a lightweight CSS glow in the future we can
// add a small Tailwind-based utility instead.
const GlowCard: React.FC<GlowCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`rounded-2xl overflow-hidden bg-card/80 ${className}`}>
      {children}
    </div>
  );
};

export { GlowCard };
