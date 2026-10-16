import React from 'react';

/**
 * MascotKamu: Original mascot "Kamu" - a sprout growing from a glowing diya/coin.
 * 5 States: 'idle' | 'listening' | 'thinking' | 'celebrating' | 'coach'
 */
export default function MascotKamu({ state = 'idle', size = 120, className = '' }) {
  return (
    <div 
      className={`relative inline-flex items-center justify-center transition-transform duration-300 ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Mascot Kamu in ${state} state`}
    >
      <svg 
        viewBox="0 0 140 140" 
        className="w-full h-full drop-shadow-sm select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradient for Coin / Diya */}
          <linearGradient id="kamuCoinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE072" />
            <stop offset="100%" stopColor="#F5B82E" />
          </linearGradient>
          
          {/* Gradient for Sprout Leaves */}
          <linearGradient id="kamuLeafGrad" x1="0%" y1="100%" x2="40%" y2="0%">
            <stop offset="0%" stopColor="#70AD26" />
            <stop offset="100%" stopColor="#A8D26B" />
          </linearGradient>

          {/* Ambient Sprout Glow */}
          <filter id="kamuGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Base Shadow */}
        <ellipse cx="70" cy="126" rx="38" ry="8" fill="#1F2540" opacity="0.12" />

        {/* Terracotta Coin / Diya Base */}
        <g className="transition-transform duration-300">
          <ellipse cx="70" cy="112" rx="42" ry="16" fill="url(#kamuCoinGrad)" stroke="#1F2540" strokeWidth="3" />
          <ellipse cx="70" cy="107" rx="36" ry="11" fill="#FFF2B8" />
          {/* Coin Edge Lip */}
          <path d="M 28 112 Q 70 130 112 112 L 109 117 Q 70 135 31 117 Z" fill="#D39712" />
          {/* Rupee symbol carved in coin */}
          <text x="70" y="112" fontFamily="'Baloo 2', sans-serif" fontWeight="800" fontSize="11" fill="#915B06" textAnchor="middle" dominantBaseline="central">₹</text>
        </g>

        {/* Main Sprout Body */}
        <g className={`transition-all duration-300 origin-bottom ${
          state === 'listening' ? 'translate-y-1 rotate-2' : 
          state === 'celebrating' ? '-translate-y-2 scale-105' : 
          state === 'thinking' ? '-rotate-2' : ''
        }`}>
          {/* Main Stalk */}
          <path 
            d="M 70 105 Q 67 76 70 54" 
            stroke="#5E9623" 
            strokeWidth="7" 
            strokeLinecap="round" 
            fill="none" 
          />

          {/* Left Leaf / Arm */}
          {state === 'celebrating' ? (
            <path 
              d="M 68 76 C 45 60 30 35 48 30 C 62 30 67 60 68 74 Z" 
              fill="url(#kamuLeafGrad)" 
              stroke="#1F2540" 
              strokeWidth="2.5" 
            />
          ) : (
            <path 
              d="M 68 80 C 40 78 28 58 42 45 C 58 43 65 64 68 78 Z" 
              fill="url(#kamuLeafGrad)" 
              stroke="#1F2540" 
              strokeWidth="2.5" 
            />
          )}

          {/* Right Leaf / Arm */}
          {state === 'celebrating' ? (
            <path 
              d="M 72 74 C 95 58 110 33 92 28 C 78 28 73 58 72 72 Z" 
              fill="url(#kamuLeafGrad)" 
              stroke="#1F2540" 
              strokeWidth="2.5" 
            />
          ) : (
            <path 
              d="M 72 75 C 100 71 112 51 98 38 C 82 37 75 58 72 73 Z" 
              fill="url(#kamuLeafGrad)" 
              stroke="#1F2540" 
              strokeWidth="2.5" 
            />
          )}

          {/* Crown Sprout Leaf (Top crest) */}
          <path 
            d="M 70 55 C 64 36 68 18 73 22 C 78 26 75 44 70 55 Z" 
            fill="#B9E57A" 
            stroke="#1F2540" 
            strokeWidth="2" 
          />

          {/* Head / Face Bulge */}
          <ellipse cx="70" cy="68" rx="20" ry="16" fill="#A8D26B" stroke="#1F2540" strokeWidth="2.5" />

          {/* Coach Headband State */}
          {state === 'coach' && (
            <g>
              <path d="M 50 63 Q 70 60 90 63 L 90 57 Q 70 54 50 57 Z" fill="#5B6CFF" stroke="#1F2540" strokeWidth="2" />
              <circle cx="70" cy="58.5" r="3" fill="#F5B82E" stroke="#1F2540" strokeWidth="1.2" />
              <path d="M 90 60 Q 98 62 102 67" stroke="#5B6CFF" strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>
          )}

          {/* Eyes & Expressions */}
          {state === 'thinking' ? (
            <g>
              <ellipse cx="63" cy="64" rx="3.5" ry="4" fill="#1F2540" />
              <ellipse cx="77" cy="64" rx="3.5" ry="4" fill="#1F2540" />
              <circle cx="64" cy="62" r="1.5" fill="#FFFFFF" />
              <circle cx="78" cy="62" r="1.5" fill="#FFFFFF" />
              <ellipse cx="71" cy="74" rx="2" ry="2.5" fill="#1F2540" />
            </g>
          ) : state === 'celebrating' ? (
            <g>
              <path d="M 59 66 Q 63 61 67 66" stroke="#1F2540" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M 73 66 Q 77 61 81 66" stroke="#1F2540" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M 64 71 Q 70 80 76 71 Z" fill="#D64560" stroke="#1F2540" strokeWidth="1.5" />
            </g>
          ) : (
            <g>
              <ellipse cx="62" cy="66" rx="4" ry="5.5" fill="#1F2540" />
              <ellipse cx="78" cy="66" rx="4" ry="5.5" fill="#1F2540" />
              <circle cx="64" cy="64" r="1.8" fill="#FFFFFF" />
              <circle cx="80" cy="64" r="1.8" fill="#FFFFFF" />
              <circle cx="61" cy="68" r="0.9" fill="#FFFFFF" />
              <circle cx="77" cy="68" r="0.9" fill="#FFFFFF" />
              <path d="M 66 73 Q 70 77 74 73" stroke="#1F2540" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            </g>
          )}

          {/* Rosy Cheeks */}
          <ellipse cx="55" cy="71" rx="3.5" ry="2" fill="#E8A6D8" opacity="0.85" />
          <ellipse cx="85" cy="71" rx="3.5" ry="2" fill="#E8A6D8" opacity="0.85" />

          {/* Listening State: Sound Waves */}
          {state === 'listening' && (
            <g className="animate-pulse">
              <path d="M 98 55 Q 106 63 98 71" stroke="#5B6CFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 104 50 Q 114 63 104 76" stroke="#5B6CFF" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
              <path d="M 42 55 Q 34 63 42 71" stroke="#5B6CFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 36 50 Q 26 63 36 76" stroke="#5B6CFF" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
            </g>
          )}

          {/* Celebrating State: Star bursts */}
          {state === 'celebrating' && (
            <g>
              <polygon points="30,25 33,31 40,32 35,37 36,44 30,40 24,44 25,37 20,32 27,31" fill="#F5B82E" />
              <polygon points="108,20 110,25 116,26 112,30 113,36 108,33 103,36 104,30 100,26 106,25" fill="#F5B82E" />
              <circle cx="28" cy="55" r="3" fill="#E8A6D8" />
              <circle cx="112" cy="50" r="3.5" fill="#8EC5F2" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
