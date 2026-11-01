import React from 'react';

interface SankalpLogoProps {
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  textLayout?: 'horizontal' | 'vertical';
  className?: string;
  glow?: boolean;
}

export const SankalpLogo: React.FC<SankalpLogoProps> = ({
  size = 'md',
  showText = false,
  textLayout = 'horizontal',
  className = '',
  glow = true,
}) => {
  // Determine pixel size
  let pixelSize = 40;
  if (typeof size === 'number') {
    pixelSize = size;
  } else {
    switch (size) {
      case 'xs':
        pixelSize = 24;
        break;
      case 'sm':
        pixelSize = 32;
        break;
      case 'md':
        pixelSize = 40;
        break;
      case 'lg':
        pixelSize = 56;
        break;
      case 'xl':
        pixelSize = 88;
        break;
      case '2xl':
        pixelSize = 130;
        break;
    }
  }

  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <div
      className={`inline-flex items-center ${
        textLayout === 'vertical' ? 'flex-col justify-center text-center' : 'flex-row gap-3'
      } ${className}`}
    >
      {/* =================================================================== */}
      {/* SANKALP EMBLEM (Open Book + S + Graduation Cap + Halo)             */}
      {/* =================================================================== */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: pixelSize, height: pixelSize }}
      >
        {/* Soft Ambient Cyan/Blue Glow */}
        {glow && (
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#00D9FF]/30 to-[#087BFF]/20 blur-md pointer-events-none transform scale-110"
          />
        )}

        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-[0_0_12px_rgba(0,217,255,0.45)]"
        >
          <defs>
            {/* Primary Cyan-to-Blue Linear Gradient */}
            <linearGradient id={`bookGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D9FF" />
              <stop offset="50%" stopColor="#00A2FF" />
              <stop offset="100%" stopColor="#085ED6" />
            </linearGradient>

            {/* Glowing Accent Gradient */}
            <linearGradient id={`haloGrad-${uniqueId}`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#085ED6" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#00D9FF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#00F0FF" />
            </linearGradient>

            {/* Letter S Bright Metallic Gradient */}
            <linearGradient id={`sGrad-${uniqueId}`} x1="30%" y1="0%" x2="70%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="25%" stopColor="#00E5FF" />
              <stop offset="70%" stopColor="#0088FF" />
              <stop offset="100%" stopColor="#004FB8" />
            </linearGradient>

            {/* Graduation Cap Deep Academic Blue */}
            <linearGradient id={`capGrad-${uniqueId}`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#00D9FF" />
              <stop offset="40%" stopColor="#0084FF" />
              <stop offset="100%" stopColor="#063D94" />
            </linearGradient>

            {/* Book Pages Layer Gradient */}
            <linearGradient id={`pageGrad-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="60%" stopColor="#0080FF" />
              <stop offset="100%" stopColor="#022152" />
            </linearGradient>

            {/* Under-spine Shadow Gradient */}
            <linearGradient id={`spineGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0072FF" />
              <stop offset="50%" stopColor="#00E1FF" />
              <stop offset="100%" stopColor="#0072FF" />
            </linearGradient>
          </defs>

          {/* 1. TOP DOME / HALO ARC */}
          <path
            d="M17 48 C 17 22, 83 22, 83 48"
            stroke={`url(#haloGrad-${uniqueId})`}
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />

          {/* 2. GRADUATION CAP (MORTARBOARD) */}
          {/* Diamond Top Cap */}
          <path
            d="M50 18 L77 28.5 L50 39 L23 28.5 Z"
            fill={`url(#capGrad-${uniqueId})`}
            stroke="#00D9FF"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Cap Skullcap Base underneath */}
          <path
            d="M36 33.5 C 36 33.5, 36 43, 50 43 C 64 43, 64 33.5, 64 33.5 Z"
            fill={`url(#capGrad-${uniqueId})`}
            stroke="#00A2FF"
            strokeWidth="0.8"
            opacity="0.9"
          />
          {/* Tassel cord and fringe */}
          <path
            d="M50 28.5 C 57 28.5, 75 30, 76 36 L 76 43"
            stroke="#00E5FF"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="76" cy="44" r="1.5" fill="#FFFFFF" />

          {/* 3. OPEN BOOK SYMBOL */}
          {/* Left Main Curved Page */}
          <path
            d="M19 46.5 C 31 43.5, 43 47, 49 53 L 49 76 C 43 70, 31 67.5, 19 70.5 Z"
            fill={`url(#pageGrad-${uniqueId})`}
            stroke="#00D9FF"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Right Main Curved Page */}
          <path
            d="M81 46.5 C 69 43.5, 57 47, 51 53 L 51 76 C 57 70, 69 67.5, 81 70.5 Z"
            fill={`url(#pageGrad-${uniqueId})`}
            stroke="#00D9FF"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Left Wing Lower Page Trim / Depth */}
          <path
            d="M15 51 C 26 49, 39 51, 46 56 L 46 78 C 39 74, 26 72, 15 74 Z"
            fill="#031A40"
            stroke="#0072FF"
            strokeWidth="0.9"
            opacity="0.85"
          />

          {/* Right Wing Lower Page Trim / Depth */}
          <path
            d="M85 51 C 74 49, 61 51, 54 56 L 54 78 C 61 74, 74 72, 85 74 Z"
            fill="#031A40"
            stroke="#0072FF"
            strokeWidth="0.9"
            opacity="0.85"
          />

          {/* Book Spine / Cover Base Ribbons */}
          <path
            d="M17 73.5 C 31 70, 43 72.5, 49 78 C 55 72.5, 67 70, 81 73.5 L 83 77 C 68 73, 56 75.5, 50 82 C 44 75.5, 32 73, 17 77 Z"
            fill={`url(#spineGrad-${uniqueId})`}
            opacity="0.95"
          />

          {/* 4. INTEGRATED LETTER 'S' IN THE CENTER */}
          {/* Typographic stylized bold modern S */}
          <path
            d="M57.5 45 C 54 44.2, 45 44.5, 44 49 C 43 53.5, 48.5 54.8, 52.5 56.5 C 57.5 58.5, 61.5 61, 60.5 67 C 59.5 73.5, 52 75.5, 43 74 L 42 69 C 48 70.5, 55 69.5, 55.5 66 C 56 62.5, 51.5 61, 47.5 59.5 C 42.5 57.5, 38.5 54.5, 39.5 48.5 C 40.5 42, 48 39.5, 56.5 40 Z"
            fill={`url(#sGrad-${uniqueId})`}
            stroke="#00D9FF"
            strokeWidth="0.8"
            className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
          />
        </svg>
      </div>

      {/* =================================================================== */}
      {/* BRAND TYPOGRAPHY (SANKALP & Smart Campus Ecosystem)                 */}
      {/* =================================================================== */}
      {showText && (
        <div className={textLayout === 'vertical' ? 'mt-3 space-y-1' : 'min-w-0'}>
          <div className="flex items-center justify-center gap-1.5">
            <h1
              className={`font-black tracking-wider text-white font-sans uppercase leading-none ${
                pixelSize >= 80
                  ? 'text-3xl sm:text-4xl tracking-[0.2em]'
                  : pixelSize >= 50
                  ? 'text-xl sm:text-2xl tracking-[0.15em]'
                  : 'text-base sm:text-lg tracking-[0.1em]'
              }`}
            >
              SANKALP
            </h1>
          </div>
          <p
            className={`text-[#9BAFCB] font-medium leading-none ${
              pixelSize >= 80
                ? 'text-sm sm:text-base mt-2 tracking-wide'
                : pixelSize >= 50
                ? 'text-xs mt-1.5'
                : 'text-[11px] mt-1'
            }`}
          >
            Smart Campus Ecosystem
          </p>
        </div>
      )}
    </div>
  );
};

