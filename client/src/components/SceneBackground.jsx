import React from 'react';

/**
 * SceneBackground: Compact layered SVG landscape of rural India
 * Optimized layout: Reduced sky height, cottages & solar array positioned clear of UI overlays.
 * Time of Day: 'dawn' (onboarding) | 'noon' (learning) | 'sunset' (earning milestone)
 */
export default function SceneBackground({ timeOfDay = 'dawn', className = '', children }) {
  const themes = {
    dawn: {
      skyGradient: ['#FCE4EC', '#E8EAF6', '#C5CAE9'],
      sunColor: '#FFE082',
      hillFar: '#9FA8DA',
      hillMid: '#A8D26B',
      hillNear: '#7EBF4E',
      solarGlint: '#8EC5F2',
      hutRoof: '#E57373',
      hutWall: '#FFF9C4'
    },
    noon: {
      skyGradient: ['#E1F5FE', '#B3E5FC', '#81D4FA'],
      sunColor: '#FFF59D',
      hillFar: '#81C784',
      hillMid: '#66BB6A',
      hillNear: '#4CAF50',
      solarGlint: '#42A5F5',
      hutRoof: '#D84315',
      hutWall: '#FFFDE7'
    },
    sunset: {
      skyGradient: ['#FFE0B2', '#FFCCBC', '#CE93D8'],
      sunColor: '#FF7043',
      hillFar: '#9575CD',
      hillMid: '#7E57C2',
      hillNear: '#5E35B1',
      solarGlint: '#FFE082',
      hutRoof: '#BF360C',
      hutWall: '#FFE0B2'
    }
  };

  const current = themes[timeOfDay] || themes.dawn;

  return (
    <div className={`relative w-full overflow-hidden transition-colors duration-500 ${className}`}>
      {/* Background SVG Canvas - Compact 1000x260 viewBox to eliminate excess sky */}
      <svg
        className="w-full h-auto min-h-[220px] max-h-[300px] object-cover transition-all duration-500"
        viewBox="0 0 1000 260"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`skyGrad_${timeOfDay}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={current.skyGradient[0]} />
            <stop offset="60%" stopColor={current.skyGradient[1]} />
            <stop offset="100%" stopColor={current.skyGradient[2]} />
          </linearGradient>

          <linearGradient id={`solarGrad_${timeOfDay}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#263238" />
            <stop offset="50%" stopColor={current.solarGlint} />
            <stop offset="100%" stopColor="#1A252F" />
          </linearGradient>
        </defs>

        {/* Sky Fill */}
        <rect width="1000" height="260" fill={`url(#skyGrad_${timeOfDay})`} />

        {/* Sun / Orb - Positioned cleanly in upper-middle */}
        <circle 
          cx={timeOfDay === 'sunset' ? 680 : timeOfDay === 'noon' ? 500 : 320} 
          cy={timeOfDay === 'sunset' ? 65 : timeOfDay === 'noon' ? 45 : 55} 
          r="36" 
          fill={current.sunColor} 
          opacity="0.9"
          className="transition-all duration-700"
        />

        {/* Drifting Clouds */}
        <g className="animate-cloud opacity-80">
          <path d="M 80 40 Q 100 25 125 35 Q 150 28 170 40 Q 185 50 165 60 L 90 60 Q 70 50 80 40 Z" fill="#FFFFFF" opacity="0.75" />
          <path d="M 720 50 Q 740 38 760 48 Q 780 40 800 52 Q 815 62 795 72 L 725 72 Q 710 62 720 50 Z" fill="#FFFFFF" opacity="0.65" />
        </g>

        {/* Far Distant Hills */}
        <path 
          d="M 0 140 Q 250 90 500 130 T 1000 110 L 1000 260 L 0 260 Z" 
          fill={current.hillFar} 
          opacity="0.45" 
          className="transition-colors duration-500"
        />

        {/* Mid-range Paddy Terraces & Village Contour */}
        <path 
          d="M 0 165 Q 220 125 480 155 T 1000 145 L 1000 260 L 0 260 Z" 
          fill={current.hillMid} 
          opacity="0.75" 
          className="transition-colors duration-500"
        />

        {/* Rural Village Cottages - Positioned cleanly in mid-upper background (x=100-180, y=105) */}
        <g transform="translate(100, 110) scale(0.75)">
          {/* Cottage 1 */}
          <rect x="0" y="16" width="38" height="24" fill={current.hutWall} rx="2" stroke="#1F2540" strokeWidth="1.5" />
          <polygon points="-4,16 19,0 42,16" fill={current.hutRoof} stroke="#1F2540" strokeWidth="1.5" />
          <rect x="14" y="24" width="10" height="16" fill="#4E342E" />
          {/* Mini solar panel on roof */}
          <polygon points="4,12 19,2 34,12" fill={`url(#solarGrad_${timeOfDay})`} stroke="#1F2540" strokeWidth="0.8" />
        </g>

        <g transform="translate(160, 118) scale(0.6)">
          {/* Cottage 2 */}
          <rect x="0" y="16" width="34" height="22" fill={current.hutWall} rx="2" stroke="#1F2540" strokeWidth="1.5" />
          <polygon points="-3,16 17,2 37,16" fill={current.hutRoof} stroke="#1F2540" strokeWidth="1.5" />
        </g>

        {/* Microgrid Solar Panel Array Row - Positioned clearly on right hillside (x=700-880, y=120) */}
        <g transform="translate(680, 115) scale(0.85)">
          <line x1="0" y1="26" x2="210" y2="26" stroke="#1F2540" strokeWidth="2" />
          {/* Panel 1 */}
          <polygon points="10,26 28,2 58,2 40,26" fill={`url(#solarGrad_${timeOfDay})`} stroke="#1F2540" strokeWidth="1.5" />
          <line x1="24" y1="14" x2="49" y2="14" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
          {/* Panel 2 */}
          <polygon points="65,26 83,2 113,2 95,26" fill={`url(#solarGrad_${timeOfDay})`} stroke="#1F2540" strokeWidth="1.5" />
          <line x1="79" y1="14" x2="104" y2="14" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
          {/* Panel 3 */}
          <polygon points="120,26 138,2 168,2 150,26" fill={`url(#solarGrad_${timeOfDay})`} stroke="#1F2540" strokeWidth="1.5" />
          <line x1="134" y1="14" x2="159" y2="14" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
        </g>

        {/* Foreground Rolling Field Terrace */}
        <path 
          d="M 0 190 Q 350 160 700 195 T 1000 180 L 1000 260 L 0 260 Z" 
          fill={current.hillNear} 
          className="transition-colors duration-500"
        />

        {/* Terrace line contour */}
        <path d="M 40 210 Q 380 180 850 215" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="6 6" fill="none" opacity="0.3" />
      </svg>

      {/* Foreground UI Elements Overlay */}
      {children && (
        <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-5 pointer-events-none">
          <div className="pointer-events-auto">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
