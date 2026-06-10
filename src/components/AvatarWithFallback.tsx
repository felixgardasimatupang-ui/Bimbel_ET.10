import { useState } from 'react';

interface AvatarWithFallbackProps {
  src: string | undefined;
  alt: string;
  className?: string;
}

export default function AvatarWithFallback({ src, alt, className = '' }: AvatarWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    const name = alt.replace(/^Foto\s+/i, '');
    const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
    return (
      <span
        className={`${className} bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]`}
        aria-hidden="true"
      >
        {initials}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}