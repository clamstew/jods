import React from "react";

interface DJTurntableProps {
  className?: string;
  width?: number;
  height?: number;
  color?: string;
  secondaryColor?: string;
  isSpinning?: boolean;
  recordColor?: string;
}

const DJTurntable: React.FC<DJTurntableProps> = ({
  className = "",
  width = 60,
  height = 60,
  color = "#9d71ff",
  secondaryColor = "#61dafb",
  isSpinning = true,
  recordColor = "#333340",
}) => {
  // Create a unique ID for this turntable instance
  const uniqueId = React.useId().replace(/:/g, "");
  const discGradientId = `discGradient-${uniqueId}`;
  const glowId = `glow-${uniqueId}`;
  const centerGlowId = `centerGlow-${uniqueId}`;
  const recordSpinId = `recordSpin-${uniqueId}`;
  const centerSpinId = `centerSpin-${uniqueId}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={discGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#222230" />
          <stop offset="100%" stopColor={recordColor} />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <radialGradient
          id={centerGlowId}
          cx="50%"
          cy="50%"
          r="50%"
          fx="50%"
          fy="50%"
        >
          <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.9" />
          <stop offset="70%" stopColor={secondaryColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        {isSpinning && (
          <>
            <animateTransform
              id={recordSpinId}
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 60 60"
              to="360 60 60"
              dur="4s"
              repeatCount="indefinite"
            />
            <animateTransform
              id={centerSpinId}
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 60 60"
              to="360 60 60"
              dur="4s"
              repeatCount="indefinite"
            />
          </>
        )}
      </defs>

      {/* DJ Console Base */}
      <rect x="5" y="85" width="110" height="30" rx="5" fill="#1A1A25" />
      <rect x="10" y="90" width="100" height="20" rx="3" fill="#252532" />

      {/* Knobs and Sliders */}
      <rect x="15" y="95" width="4" height="10" rx="2" fill={color} />
      <rect x="25" y="95" width="4" height="10" rx="2" fill={secondaryColor} />
      <rect x="35" y="92" width="4" height="16" rx="2" fill={color} />
      <rect x="45" y="95" width="4" height="10" rx="2" fill={secondaryColor} />

      <circle cx="60" cy="100" r="3" fill={color} />

      <rect x="75" y="92" width="4" height="16" rx="2" fill={secondaryColor} />
      <rect x="85" y="95" width="4" height="10" rx="2" fill={color} />
      <rect x="95" y="92" width="4" height="16" rx="2" fill={secondaryColor} />
      <rect x="105" y="95" width="4" height="10" rx="2" fill={color} />

      {/* Turntable Platter */}
      <g filter={`url(#${glowId})`}>
        <circle cx="60" cy="45" r="40" fill="#111118" />
        <circle
          id="record"
          cx="60"
          cy="45"
          r="35"
          fill={`url(#${discGradientId})`}
        >
          {isSpinning && (
            <animateTransform
              xlinkHref={`#${recordSpinId}`}
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 60 60"
              to="360 60 60"
              dur="4s"
              repeatCount="indefinite"
            />
          )}
        </circle>

        {/* Record Grooves */}
        <circle
          cx="60"
          cy="45"
          r="30"
          stroke="#444450"
          strokeWidth="0.5"
          fill="none"
        />
        <circle
          cx="60"
          cy="45"
          r="25"
          stroke="#444450"
          strokeWidth="0.5"
          fill="none"
        />
        <circle
          cx="60"
          cy="45"
          r="20"
          stroke="#444450"
          strokeWidth="0.5"
          fill="none"
        />
        <circle
          cx="60"
          cy="45"
          r="15"
          stroke="#444450"
          strokeWidth="0.5"
          fill="none"
        />
        <circle
          cx="60"
          cy="45"
          r="10"
          stroke="#444450"
          strokeWidth="0.5"
          fill="none"
        />

        {/* Record Label */}
        <circle
          id="center"
          cx="60"
          cy="45"
          r="8"
          fill="#111118"
          stroke={secondaryColor}
          strokeWidth="1"
        >
          {isSpinning && (
            <animateTransform
              xlinkHref={`#${centerSpinId}`}
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 60 60"
              to="360 60 60"
              dur="4s"
              repeatCount="indefinite"
            />
          )}
        </circle>
        <circle cx="60" cy="45" r="4" fill={`url(#${centerGlowId})`} />
        <circle cx="60" cy="45" r="2" fill={color} />
      </g>

      {/* Tonearm */}
      <path
        d="M85 20 L95 45 L90 47 L80 25 Z"
        fill="#1A1A25"
        stroke={color}
        strokeWidth="1"
      />
      <circle cx="90" cy="47" r="2" fill={secondaryColor} />
    </svg>
  );
};

export default DJTurntable;
