import React, { CSSProperties, useEffect, useRef } from "react";

type LogoProps = {
  className?: string;
};

export const ReactLogo: React.FC<LogoProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 841.9 595.3"
    className={className}
    style={{ width: "24px", height: "24px" }}
  >
    <g fill="#61DAFB">
      <path d="M666.3 296.5c0-32.5-40.7-63.3-103.1-82.4 14.4-63.6 8-114.2-20.2-130.4-6.5-3.8-14.1-5.6-22.4-5.6v22.3c4.6 0 8.3.9 11.4 2.6 13.6 7.8 19.5 37.5 14.9 75.7-1.1 9.4-2.9 19.3-5.1 29.4-19.6-4.8-41-8.5-63.5-10.9-13.5-18.5-27.5-35.3-41.6-50 32.6-30.3 63.2-46.9 84-46.9V78c-27.5 0-63.5 19.6-99.9 53.6-36.4-33.8-72.4-53.2-99.9-53.2v22.3c20.7 0 51.4 16.5 84 46.6-14 14.7-28 31.4-41.3 49.9-22.6 2.4-44 6.1-63.6 11-2.3-10-4-19.7-5.2-29-4.7-38.2 1.1-67.9 14.6-75.8 3-1.8 6.9-2.6 11.5-2.6V78.5c-8.4 0-16 1.8-22.6 5.6-28.1 16.2-34.4 66.7-19.9 130.1-62.2 19.2-102.7 49.9-102.7 82.3 0 32.5 40.7 63.3 103.1 82.4-14.4 63.6-8 114.2 20.2 130.4 6.5 3.8 14.1 5.6 22.5 5.6 27.5 0 63.5-19.6 99.9-53.6 36.4 33.8 72.4 53.2 99.9 53.2 8.4 0 16-1.8 22.6-5.6 28.1-16.2 34.4-66.7 19.9-130.1 62-19.1 102.5-49.9 102.5-82.3zm-130.2-66.7c-3.7 12.9-8.3 26.2-13.5 39.5-4.1-8-8.4-16-13.1-24-4.6-8-9.5-15.8-14.4-23.4 14.2 2.1 27.9 4.7 41 7.9zm-45.8 106.5c-7.8 13.5-15.8 26.3-24.1 38.2-14.9 1.3-30 2-45.2 2-15.1 0-30.2-.7-45-1.9-8.3-11.9-16.4-24.6-24.2-38-7.6-13.1-14.5-26.4-20.8-39.8 6.2-13.4 13.2-26.8 20.7-39.9 7.8-13.5 15.8-26.3 24.1-38.2 14.9-1.3 30-2 45.2-2 15.1 0 30.2.7 45 1.9 8.3 11.9 16.4 24.6 24.2 38 7.6 13.1 14.5 26.4 20.8 39.8-6.3 13.4-13.2 26.8-20.7 39.9zm32.3-13c5.4 13.4 10 26.8 13.8 39.8-13.1 3.2-26.9 5.9-41.2 8 4.9-7.7 9.8-15.6 14.4-23.7 4.6-8 8.9-16.1 13-24.1zM421.2 430c-9.3-9.6-18.6-20.3-27.8-32 9 .4 18.2.7 27.5.7 9.4 0 18.7-.2 27.8-.7-9 11.7-18.3 22.4-27.5 32zm-74.4-58.9c-14.2-2.1-27.9-4.7-41-7.9 3.7-12.9 8.3-26.2 13.5-39.5 4.1 8 8.4 16 13.1 24 4.6 8 9.5 15.8 14.4 23.4zM420.7 163c9.3 9.6 18.6 20.3 27.8 32-9-.4-18.2-.7-27.5-.7-9.4 0-18.7.2-27.8.7 9-11.7 18.3-22.4 27.5-32zm-74 58.9c-4.9 7.7-9.8 15.6-14.4 23.7-4.6 8-8.9 16-13 24-5.4-13.4-10-26.8-13.8-39.8 13.1-3.1 26.9-5.8 41.2-7.9zm-90.5 125.2c-35.4-15.1-58.3-34.9-58.3-50.6 0-15.7 22.9-35.6 58.3-50.6 8.6-3.7 18-7 27.7-10.1 5.7 19.6 13.2 40 22.5 60.9-9.2 20.8-16.6 41.1-22.2 60.6-9.9-3.1-19.3-6.5-28-10.2zM310 490c-13.6-7.8-19.5-37.5-14.9-75.7 1.1-9.4 2.9-19.3 5.1-29.4 19.6 4.8 41 8.5 63.5 10.9 13.5 18.5 27.5 35.3 41.6 50-32.6 30.3-63.2 46.9-84 46.9-4.5-.1-8.3-1-11.3-2.7zm237.2-76.2c4.7 38.2-1.1 67.9-14.6 75.8-3 1.8-6.9 2.6-11.5 2.6-20.7 0-51.4-16.5-84-46.6 14-14.7 28-31.4 41.3-49.9 22.6-2.4 44-6.1 63.6-11 2.3 10.1 4.1 19.8 5.2 29.1zm38.5-66.7c-8.6 3.7-18 7-27.7 10.1-5.7-19.6-13.2-40-22.5-60.9 9.2-20.8 16.6-41.1 22.2-60.6 9.9 3.1 19.3 6.5 28.1 10.2 35.4 15.1 58.3 34.9 58.3 50.6-.1 15.7-23 35.6-58.4 50.6zM320.8 78.4z" />
      <circle cx="420.9" cy="296.5" r="45.7" />
      <path d="M520.5 78.1z" />
    </g>
  </svg>
);

export const PreactLogo: React.FC<LogoProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 296"
    className={className}
    style={{ width: "24px", height: "24px" }}
  >
    <g>
      <path
        d="M128,0 L256,73.8999491 L256,221.699847 L128,295.599796 L0,221.699847 L0,73.8999491 L128,0 Z"
        fill="#673AB8"
      />
      <path
        d="M65.4015371,96.4377289 C62.9376143,95.799493 62.0192786,95.3803513 61.6757566,94.1693052 C60.760673,90.8463707 67.2473969,80.9693434 73.6319447,74.4419155 C87.3611756,60.453578 108.552154,50.8994253 127.573516,50.8994253 C146.48325,50.8994253 167.965676,60.6350589 181.569212,74.4419155 C187.038961,80.087022 194.202086,90.2626266 193.28564,93.6941887 C193.164199,94.2173263 192.525774,94.6844429 191.610076,95.2075805 C188.931638,96.7295693 177.571043,96.5500969 173.158204,95.0701366 C171.614764,94.5060275 171.248893,94.0388833 169.825916,92.2649574 C163.32996,83.8499608 156.84918,78.7588542 148.057755,75.3079383 C143.703602,73.6169773 137.438497,72.5954106 132.449755,72.5954106 C126.640329,72.5954106 120.386147,73.6169773 115.925071,75.3079383 C107.029002,78.7588542 100.669145,83.8499608 94.1097115,92.4124014 C92.7657538,94.1293053 92.3622246,94.5964219 90.8187847,95.1615594 C87.6622222,96.5500969 73.0954808,97.7251338 65.4015371,96.4377289 L65.4015371,96.4377289 L65.4015371,96.4377289 Z"
        fill="#FFFFFF"
      />
      <path
        d="M127.816669,214.913358 C123.111427,214.913358 118.803594,213.899759 114.626202,212.010753 C101.367503,206.012622 94.5668565,193.22359 94.5668565,178.233863 C94.5668565,172.818798 95.5694023,167.540284 97.4888155,162.723258 C102.48607,151.163999 111.157943,141.214129 120.873456,134.427324 C122.782946,132.990377 125.846459,130.90739 127.998038,130.90739 C130.030902,130.90739 132.725786,132.697852 134.760178,134.132325 C144.56331,140.917104 153.358969,150.9525 158.295378,162.580259 C160.211394,167.432284 161.219498,172.747299 161.219498,178.233863 C161.219498,193.22359 154.418851,206.012622 141.142824,212.010753 C136.9998,213.863008 132.639994,214.913358 127.816669,214.913358 L127.816669,214.913358 L127.816669,214.913358 Z"
        fill="#FFFFFF"
      />
      <path
        d="M198.6514,148.631074 C195.707407,147.943858 194.59198,147.51644 193.969223,146.352387 C192.399093,143.146422 198.9154,133.477718 205.381456,127.077278 C219.297323,113.327507 240.744906,103.918342 260,103.918342 C279.140325,103.918342 300.879606,113.507028 314.669242,127.077278 C320.212727,132.603337 327.48351,142.574747 326.550892,145.934969 C326.427098,146.434636 325.780569,146.894795 324.852721,147.407712 C322.146564,148.90045 310.631313,148.725179 306.175267,147.273185 C304.60939,146.722019 304.240154,146.261859 302.802806,144.517618 C296.228074,136.264613 289.65761,131.253046 280.75983,127.885578 C276.358016,126.225844 270.021998,125.224761 264.982274,125.224761 C259.061782,125.224761 252.737236,126.225844 248.232661,127.885578 C239.229962,131.253046 232.778027,136.264613 226.139825,144.662145 C224.781007,146.345636 224.37351,146.805795 222.812863,147.360211 C219.603177,148.725179 204.836411,149.874725 198.6514,148.631074 L198.6514,148.631074 L198.6514,148.631074 Z"
        fill="#FFFFFF"
        transform="translate(259.916667, 126.774637) scale(-1, -1) translate(-259.916667, -126.774637)"
      />
    </g>
  </svg>
);

export const RemixLogo: React.FC<LogoProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 800 800"
    className={className}
    style={{ width: "24px", height: "24px" }}
  >
    <rect width="800" height="800" fill="#212121" rx="80" ry="80" />
    <path
      fill="#ffffff"
      d="M587.11,527.55c-7.1,0-13.72-4.3-16.5-11.23L493.94,303.58a17.4,17.4,0,0,1,16.34-23.56h30.11a17.39,17.39,0,0,1,16.5,11.23l76.67,212.74a17.39,17.39,0,0,1-16.35,23.56H587.11Z"
    />
    <path
      fill="#ffffff"
      d="M337.56,516.32h30.11a17.39,17.39,0,0,0,16.5-11.23l76.68-212.74a17.4,17.4,0,0,0-16.35-23.56H414.39a17.38,17.38,0,0,0-16.51,11.23l-76.67,212.74a17.4,17.4,0,0,0,16.35,23.56"
    />
    <path
      fill="#ffffff"
      d="M219.19,516.32h30.11a17.39,17.39,0,0,0,16.51-11.23l76.67-212.74a17.4,17.4,0,0,0-16.35-23.56H296a17.39,17.39,0,0,0-16.5,11.23L202.85,492.76a17.4,17.4,0,0,0,16.34,23.56"
    />
  </svg>
);

// A container for framework logos with animated effect
export const FrameworkLogos: React.FC<{ className?: string }> = ({
  className,
}) => {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    // Add global styles for animations
    if (!styleRef.current && typeof document !== "undefined") {
      const styleElement = document.createElement("style");
      styleElement.textContent = `
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 5px currentColor; opacity: 0.7; }
          50% { box-shadow: 0 0 12px currentColor; opacity: 1; }
          100% { box-shadow: 0 0 5px currentColor; opacity: 0.7; }
        }
        
        @keyframes rotate-logo {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .framework-logos {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s ease;
        }
        
        .framework-logos .logo-container {
          transition: all 0.3s ease;
          transform: translateY(0);
        }
        
        .framework-logos .logo-container:hover {
          transform: translateY(-3px);
        }
        
        .framework-logos .logo-container.react-logo {
          animation: pulse-glow 3s infinite ease-in-out;
          color: #61DAFB;
        }
        
        .framework-logos .logo-container.preact-logo {
          animation: pulse-glow 3s infinite 1s ease-in-out;
          color: #673AB8;
        }
        
        .framework-logos .logo-container.remix-logo {
          animation: pulse-glow 3s infinite 2s ease-in-out;
          color: #212121;
        }
        
        html[data-theme='light'] .framework-logos .logo-container.react-logo {
          color: #0088cc;
        }
        
        html[data-theme='light'] .framework-logos .logo-container.preact-logo {
          color: #7854b8;
        }
        
        html[data-theme='light'] .framework-logos .logo-container.remix-logo {
          color: #333333;
        }
        
        .framework-logos .logo-inner {
          animation: rotate-logo 15s linear infinite;
          animation-play-state: paused;
        }
        
        .framework-logos .logo-container:hover .logo-inner {
          animation-play-state: running;
        }
      `;
      document.head.appendChild(styleElement);
      styleRef.current = styleElement;
    }

    // Clean up function
    return () => {
      if (styleRef.current && typeof document !== "undefined") {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className={`framework-logos ${className || ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        marginTop: "10px",
      }}
    >
      <div className="logo-container react-logo" style={reactLogoStyle}>
        <div className="logo-inner">
          <ReactLogo />
        </div>
      </div>
      <div className="logo-container preact-logo" style={preactLogoStyle}>
        <div className="logo-inner">
          <PreactLogo />
        </div>
      </div>
      <div className="logo-container remix-logo" style={remixLogoStyle}>
        <div className="logo-inner">
          <RemixLogo />
        </div>
      </div>
    </div>
  );
};

// Define styles with proper typing
const baseLogoStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: "rgba(255, 255, 255, 0.1)",
  padding: "5px",
  position: "relative",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  transition: "all 0.3s ease",
  cursor: "pointer",
  backdropFilter: "blur(4px)",
};

const reactLogoStyle: CSSProperties = {
  ...baseLogoStyle,
  border: "1px solid rgba(97, 218, 251, 0.5)",
};

const preactLogoStyle: CSSProperties = {
  ...baseLogoStyle,
  border: "1px solid rgba(103, 58, 184, 0.5)",
};

const remixLogoStyle: CSSProperties = {
  ...baseLogoStyle,
  border: "1px solid rgba(33, 33, 33, 0.5)",
};

export default FrameworkLogos;
