import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export function SmartImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#231917] via-[#17110F] to-[#120D0C] text-[#D4AF37]/70 p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <UtensilsCrossed className="w-8 h-8 mb-2 opacity-60" strokeWidth={1.5} />
        <span className="text-xs text-[#FAF6F0]/60 line-clamp-1">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
