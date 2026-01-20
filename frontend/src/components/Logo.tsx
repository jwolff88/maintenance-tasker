import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 200, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Gradient for metallic effect on tools */}
        <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>

        {/* Gradient for the circular border */}
        <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>

        {/* Glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Path for curved text at bottom */}
        <path
          id="bottomArc"
          d="M 30 150 Q 100 190 170 150"
          fill="none"
        />

        {/* Path for top text */}
        <path
          id="topArc"
          d="M 40 55 Q 100 25 160 55"
          fill="none"
        />
      </defs>

      {/* Outer circle - main emblem border */}
      <circle
        cx="100"
        cy="100"
        r="95"
        stroke="url(#borderGradient)"
        strokeWidth="4"
        fill="#010B0A"
      />

      {/* Inner decorative ring */}
      <circle
        cx="100"
        cy="100"
        r="88"
        stroke="#22c55e"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />

      {/* House silhouette in background */}
      <g opacity="0.15" filter="url(#glow)">
        {/* House body */}
        <path
          d="M 55 130 L 55 95 L 100 60 L 145 95 L 145 130 Z"
          fill="#22c55e"
        />
        {/* Roof */}
        <path
          d="M 45 95 L 100 50 L 155 95 L 145 95 L 100 60 L 55 95 Z"
          fill="#22c55e"
        />
        {/* Door */}
        <rect x="90" y="105" width="20" height="25" fill="#010B0A" />
        {/* Windows */}
        <rect x="65" y="100" width="15" height="12" fill="#010B0A" />
        <rect x="120" y="100" width="15" height="12" fill="#010B0A" />
      </g>

      {/* Crossed tools group */}
      <g filter="url(#glow)">
        {/* Hammer - top-left to bottom-right */}
        <g transform="rotate(-45 100 100)">
          {/* Hammer handle */}
          <rect
            x="95"
            y="70"
            width="10"
            height="70"
            rx="2"
            fill="#8B4513"
            stroke="#22c55e"
            strokeWidth="2"
          />
          {/* Handle grip lines */}
          <line x1="97" y1="100" x2="103" y2="100" stroke="#5D2E0C" strokeWidth="1" />
          <line x1="97" y1="105" x2="103" y2="105" stroke="#5D2E0C" strokeWidth="1" />
          <line x1="97" y1="110" x2="103" y2="110" stroke="#5D2E0C" strokeWidth="1" />
          <line x1="97" y1="115" x2="103" y2="115" stroke="#5D2E0C" strokeWidth="1" />

          {/* Hammer head */}
          <rect
            x="80"
            y="60"
            width="40"
            height="18"
            rx="2"
            fill="url(#metalGradient)"
            stroke="#15803d"
            strokeWidth="2"
          />
          {/* Hammer face */}
          <rect
            x="112"
            y="62"
            width="8"
            height="14"
            rx="1"
            fill="#16a34a"
            stroke="#15803d"
            strokeWidth="1"
          />
          {/* Claw */}
          <path
            d="M 80 62 L 72 55 M 80 66 L 72 62"
            stroke="url(#metalGradient)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/* Pipe Wrench - top-right to bottom-left */}
        <g transform="rotate(45 100 100)">
          {/* Wrench handle */}
          <rect
            x="95"
            y="75"
            width="10"
            height="65"
            rx="2"
            fill="#dc2626"
            stroke="#22c55e"
            strokeWidth="2"
          />
          {/* Handle texture */}
          <line x1="97" y1="100" x2="103" y2="100" stroke="#991b1b" strokeWidth="1" />
          <line x1="97" y1="108" x2="103" y2="108" stroke="#991b1b" strokeWidth="1" />
          <line x1="97" y1="116" x2="103" y2="116" stroke="#991b1b" strokeWidth="1" />

          {/* Wrench head - fixed jaw */}
          <path
            d="M 88 75 L 88 55 L 100 45 L 100 75 Z"
            fill="url(#metalGradient)"
            stroke="#15803d"
            strokeWidth="2"
          />

          {/* Wrench head - movable jaw */}
          <path
            d="M 112 75 L 112 58 L 100 48 L 100 75 Z"
            fill="url(#metalGradient)"
            stroke="#15803d"
            strokeWidth="2"
          />

          {/* Adjustment wheel */}
          <circle
            cx="100"
            cy="70"
            r="5"
            fill="#15803d"
            stroke="#22c55e"
            strokeWidth="1"
          />
          <line x1="100" y1="66" x2="100" y2="74" stroke="#010B0A" strokeWidth="1" />
          <line x1="96" y1="70" x2="104" y2="70" stroke="#010B0A" strokeWidth="1" />
        </g>
      </g>

      {/* "J&M's" text at top */}
      <text
        textAnchor="middle"
        fill="#22c55e"
        fontFamily="'Orbitron', sans-serif"
        fontWeight="bold"
        fontSize="22"
        filter="url(#glow)"
      >
        <textPath href="#topArc" startOffset="50%">
          J&amp;M's
        </textPath>
      </text>

      {/* "Since 2026" - positioned along the design */}
      <text
        x="100"
        y="168"
        textAnchor="middle"
        fill="#22c55e"
        fontFamily="'Orbitron', sans-serif"
        fontWeight="normal"
        fontSize="9"
        opacity="0.8"
      >
        SINCE 2026
      </text>

      {/* Bottom banner */}
      <path
        d="M 20 152 Q 30 145 50 148 L 150 148 Q 170 145 180 152 L 175 165 Q 170 170 165 165 L 160 160 Q 100 175 40 160 L 35 165 Q 30 170 25 165 Z"
        fill="#010B0A"
        stroke="url(#borderGradient)"
        strokeWidth="2"
      />

      {/* Banner inner fill */}
      <path
        d="M 25 153 Q 35 147 52 150 L 148 150 Q 165 147 175 153 L 172 162 Q 100 175 28 162 Z"
        fill="#052e16"
        opacity="0.5"
      />

      {/* "Maintenance Intel Companion" curved text */}
      <text
        textAnchor="middle"
        fill="#4ade80"
        fontFamily="'Orbitron', sans-serif"
        fontWeight="bold"
        fontSize="10"
        filter="url(#glow)"
      >
        <textPath href="#bottomArc" startOffset="50%">
          MAINTENANCE INTEL COMPANION
        </textPath>
      </text>

      {/* Decorative corner accents */}
      <g stroke="#22c55e" strokeWidth="2" opacity="0.6">
        {/* Top accent */}
        <line x1="100" y1="8" x2="100" y2="15" />
        {/* Bottom accent */}
        <line x1="100" y1="185" x2="100" y2="192" />
        {/* Left accent */}
        <line x1="8" y1="100" x2="15" y2="100" />
        {/* Right accent */}
        <line x1="185" y1="100" x2="192" y2="100" />
      </g>
    </svg>
  );
};

export default Logo;
