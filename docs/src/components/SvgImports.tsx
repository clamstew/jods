import React from "react";

interface SvgProps {
  width?: number;
  height?: number;
  className?: string;
}

// SVG file paths
const SVG_PATHS = {
  djTurntable: "/img/dj-turntable.svg",
  reactLogo: "/img/react-logo.svg",
  preactLogo: "/img/preact-logo.svg",
  remixLogo: "/img/remix-logo.svg",
};

export const DJTurntableImg: React.FC<SvgProps> = ({
  width = 100,
  height = 100,
  className = "",
}) => (
  <img
    src={SVG_PATHS.djTurntable}
    alt="DJ Turntable"
    width={width}
    height={height}
    className={className}
  />
);

export const ReactLogoImg: React.FC<SvgProps> = ({
  width = 50,
  height = 50,
  className = "",
}) => (
  <img
    src={SVG_PATHS.reactLogo}
    alt="React Logo"
    width={width}
    height={height}
    className={className}
  />
);

export const PreactLogoImg: React.FC<SvgProps> = ({
  width = 50,
  height = 50,
  className = "",
}) => (
  <img
    src={SVG_PATHS.preactLogo}
    alt="Preact Logo"
    width={width}
    height={height}
    className={className}
  />
);

export const RemixLogoImg: React.FC<SvgProps> = ({
  width = 50,
  height = 50,
  className = "",
}) => (
  <img
    src={SVG_PATHS.remixLogo}
    alt="Remix Logo"
    width={width}
    height={height}
    className={className}
  />
);

// Example component that shows all logos
const SvgShowcase: React.FC = () => {
  return (
    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
      <div>
        <h3>DJ Turntable</h3>
        <DJTurntableImg width={120} height={120} />
      </div>

      <div>
        <h3>Framework Logos</h3>
        <div style={{ display: "flex", gap: "10px" }}>
          <ReactLogoImg />
          <PreactLogoImg />
          <RemixLogoImg />
        </div>
      </div>
    </div>
  );
};

export default SvgShowcase;
