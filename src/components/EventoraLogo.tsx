import React, { useState } from 'react';

interface EventoraLogoProps {
  className?: string;
  showReflection?: boolean;
}

export const EventoraLogo: React.FC<EventoraLogoProps> = ({
  className = 'w-full max-w-4xl',
  showReflection = true,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* 1. Direct Reference Image Attempt */}
      {!imgError && (
        <img
          src="/e965cb5b-7371-46a3-baa5-f70b3c2e4015.jpg"
          alt="eventora"
          onError={() => setImgError(true)}
          className="w-full max-w-3xl h-auto object-contain pointer-events-none"
        />
      )}

      {/* 2. Pixel-Perfect Precision Vector Typography Matching Reference Image */}
      {imgError && (
        <div className="relative w-full flex flex-col items-center">
          <svg
            viewBox="0 0 1020 180"
            className="w-full h-auto max-w-4xl overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Obsidian Frosted Glass Gradient Fill */}
              <linearGradient id="eventoraGlassFill" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.45" />
                <stop offset="20%" stopColor="#94a3b8" stopOpacity="0.32" />
                <stop offset="50%" stopColor="#334155" stopOpacity="0.65" />
                <stop offset="80%" stopColor="#0f172a" stopOpacity="0.88" />
                <stop offset="100%" stopColor="#020617" stopOpacity="0.98" />
              </linearGradient>

              {/* Luminous White Contour Filter */}
              <filter id="whiteContourGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ffffff" floodOpacity="0.9" />
                <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#94a3b8" floodOpacity="0.4" />
              </filter>

              {/* Inner Bevel Specular Gradient */}
              <linearGradient id="specularEdge" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#475569" stopOpacity="0.2" />
              </linearGradient>

              {/* Ground Reflection Vertical Fade Mask */}
              <linearGradient id="reflectionLinearFade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
                <stop offset="35%" stopColor="#ffffff" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <mask id="groundReflectionMask">
                <rect x="0" y="0" width="1020" height="180" fill="url(#reflectionLinearFade)" />
              </mask>
            </defs>

            {/* Letter 'e' (1) */}
            <g transform="translate(15, 20)">
              {/* Outer stroke with glowing white contour */}
              <path
                d="M 25 0 L 80 0 L 100 20 L 100 48 L 32 48 L 32 60 L 90 60 L 100 70 L 100 100 L 80 120 L 25 120 L 0 95 L 0 25 Z"
                fill="url(#eventoraGlassFill)"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinejoin="miter"
                filter="url(#whiteContourGlow)"
              />
              {/* Inner cutout / bevel */}
              <path
                d="M 28 18 L 74 18 L 74 34 L 28 34 Z"
                fill="#000000"
                stroke="url(#specularEdge)"
                strokeWidth="1.5"
              />
              <path
                d="M 32 74 L 75 74 L 75 102 L 32 102 Z"
                fill="#000000"
                stroke="url(#specularEdge)"
                strokeWidth="1.2"
                opacity="0.8"
              />
            </g>

            {/* Letter 'v' */}
            <g transform="translate(135, 20)">
              <path
                d="M 0 0 L 32 0 L 40 45 L 60 45 L 68 0 L 100 0 L 72 120 L 28 120 Z"
                fill="url(#eventoraGlassFill)"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinejoin="miter"
                filter="url(#whiteContourGlow)"
              />
              {/* Center V bevel core */}
              <polygon
                points="42,32 50,88 58,32"
                fill="#000000"
                stroke="url(#specularEdge)"
                strokeWidth="1.5"
              />
            </g>

            {/* Letter 'e' (2) */}
            <g transform="translate(250, 20)">
              <path
                d="M 25 0 L 80 0 L 100 20 L 100 48 L 32 48 L 32 60 L 90 60 L 100 70 L 100 100 L 80 120 L 25 120 L 0 95 L 0 25 Z"
                fill="url(#eventoraGlassFill)"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinejoin="miter"
                filter="url(#whiteContourGlow)"
              />
              <path
                d="M 28 18 L 74 18 L 74 34 L 28 34 Z"
                fill="#000000"
                stroke="url(#specularEdge)"
                strokeWidth="1.5"
              />
              <path
                d="M 32 74 L 75 74 L 75 102 L 32 102 Z"
                fill="#000000"
                stroke="url(#specularEdge)"
                strokeWidth="1.2"
                opacity="0.8"
              />
            </g>

            {/* Letter 'n' */}
            <g transform="translate(365, 20)">
              <path
                d="M 0 0 L 75 0 L 100 25 L 100 120 L 68 120 L 68 45 L 32 45 L 32 120 L 0 120 Z"
                fill="url(#eventoraGlassFill)"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinejoin="miter"
                filter="url(#whiteContourGlow)"
              />
              <rect
                x="32"
                y="45"
                width="36"
                height="75"
                fill="#000000"
                stroke="url(#specularEdge)"
                strokeWidth="1.5"
              />
            </g>

            {/* Letter 't' */}
            <g transform="translate(485, 2)">
              <path
                d="M 28 0 L 60 0 L 60 28 L 92 28 L 92 56 L 60 56 L 60 138 L 28 138 L 28 56 L 0 56 L 0 28 L 28 28 Z"
                fill="url(#eventoraGlassFill)"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinejoin="miter"
                filter="url(#whiteContourGlow)"
              />
              <line x1="44" y1="12" x2="44" y2="128" stroke="url(#specularEdge)" strokeWidth="1.5" />
            </g>

            {/* Letter 'o' */}
            <g transform="translate(595, 20)">
              <path
                d="M 25 0 L 75 0 L 100 25 L 100 95 L 75 120 L 25 120 L 0 95 L 0 25 Z"
                fill="url(#eventoraGlassFill)"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinejoin="miter"
                filter="url(#whiteContourGlow)"
              />
              {/* Hollow core */}
              <rect
                x="28"
                y="26"
                width="44"
                height="68"
                fill="#000000"
                stroke="url(#specularEdge)"
                strokeWidth="1.5"
              />
            </g>

            {/* Letter 'r' */}
            <g transform="translate(710, 20)">
              <path
                d="M 0 0 L 72 0 L 96 24 L 96 52 L 68 52 L 68 34 L 32 34 L 32 120 L 0 120 Z"
                fill="url(#eventoraGlassFill)"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinejoin="miter"
                filter="url(#whiteContourGlow)"
              />
              <line x1="16" y1="12" x2="16" y2="110" stroke="url(#specularEdge)" strokeWidth="1.5" />
            </g>

            {/* Letter 'a' */}
            <g transform="translate(820, 20)">
              <path
                d="M 25 0 L 75 0 L 100 25 L 100 120 L 68 120 L 68 102 L 25 102 L 0 77 L 0 52 L 68 52 L 68 32 L 25 32 L 0 15 Z"
                fill="url(#eventoraGlassFill)"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinejoin="miter"
                filter="url(#whiteContourGlow)"
              />
              <rect
                x="26"
                y="62"
                width="42"
                height="30"
                fill="#000000"
                stroke="url(#specularEdge)"
                strokeWidth="1.5"
              />
            </g>
          </svg>

          {/* Faint Mirror Ground Reflection (Static) */}
          {showReflection && (
            <div className="w-full max-w-4xl overflow-hidden -mt-3 opacity-25 pointer-events-none">
              <svg viewBox="0 0 1020 90" className="w-full h-auto transform scale-y-[-1]">
                <text
                  x="510"
                  y="65"
                  textAnchor="middle"
                  style={{
                    fontFamily: "var(--font-main), 'Nunito', sans-serif",
                    fontWeight: 800,
                    fontSize: '92px',
                    letterSpacing: '14px',
                    fill: 'url(#eventoraGlassFill)',
                    stroke: '#ffffff',
                    strokeWidth: '1.5px',
                    paintOrder: 'stroke fill',
                    filter: 'blur(1.5px)',
                  }}
                  mask="url(#groundReflectionMask)"
                >
                  eventora
                </text>
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
