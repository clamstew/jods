import React from "react";

interface DJRemixFinalProps {
  className?: string;
  theme?: "dark" | "light";
}

const DJRemixFinal: React.FC<DJRemixFinalProps> = ({
  className = "",
  theme = "dark",
}) => {
  // Colors from the title gradient - ONLY these colors should appear
  const titleColors = {
    blue: theme === "dark" ? "#61dafb" : "#0088cc",
    purple: theme === "dark" ? "#9d71ff" : "#7854b8",
    orange: theme === "dark" ? "#ff7b1a" : "#f5850c",
  };

  // Theme-specific colors
  const themeColors = {
    background:
      theme === "dark"
        ? "linear-gradient(135deg, rgba(25, 25, 45, 0.95) 0%, rgba(40, 40, 70, 0.9) 100%)"
        : "linear-gradient(135deg, rgba(250, 252, 255, 0.96) 0%, rgba(240, 245, 255, 0.95) 100%)",
    text: theme === "dark" ? "white" : "#2d3748",
    secondaryText: theme === "dark" ? "#ddd" : "#4a5568",
    border:
      theme === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 40, 0.05)",
    cardBg:
      theme === "dark" ? "rgba(20, 20, 35, 0.7)" : "rgba(255, 255, 255, 0.7)",
    cardBorder:
      theme === "dark" ? "rgba(70, 70, 90, 0.5)" : "rgba(200, 210, 220, 0.8)",
    badgeBg:
      theme === "dark" ? "rgba(30, 30, 50, 0.7)" : "rgba(240, 245, 250, 0.8)",
    recordBg:
      theme === "dark" ? "rgba(20, 20, 30, 0.9)" : "rgba(240, 242, 250, 0.95)",
    boxShadow:
      theme === "dark"
        ? "0 20px 50px rgba(0, 0, 0, 0.3)"
        : "0 20px 50px rgba(100, 120, 160, 0.1)",
    glowOpacity: theme === "dark" ? "0.8" : "0.6",
    recordGroove:
      theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(70, 90, 140, 0.15)",
    iconOpacity: theme === "dark" ? "0.9" : "1",
    iconColor: theme === "dark" ? "inherit" : "#2a3752",
    footerBg: theme === "dark" ? "transparent" : "rgba(70, 90, 140, 0.08)",
    footerBorder:
      theme === "dark" ? "transparent" : `1px solid ${titleColors.blue}20`,
    footerShadow: theme === "dark" ? "none" : `0 2px 8px ${titleColors.blue}20`,
  };

  return (
    <div
      className={`remix-booth ${className}`}
      style={{
        padding: "clamp(15px, 4vw, 30px)",
        background: themeColors.background,
        borderRadius: "16px",
        boxShadow: themeColors.boxShadow,
        color: themeColors.text,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: "hidden",
        position: "relative",
        backdropFilter: "blur(10px)",
        border: `1px solid ${themeColors.border}`,
      }}
    >
      {/* Subtle Background Glow */}
      <div
        style={{
          position: "absolute",
          top: "-50%",
          left: "-10%",
          width: "120%",
          height: "200%",
          background:
            theme === "dark"
              ? `radial-gradient(ellipse at center, ${titleColors.blue}15 0%, ${titleColors.purple}08 40%, transparent 70%)`
              : `radial-gradient(ellipse at center, ${titleColors.blue}20 0%, ${titleColors.purple}15 40%, transparent 70%)`,
          pointerEvents: "none",
          zIndex: 0,
          animation: "pulse-glow 8s infinite alternate ease-in-out",
        }}
      />

      <style>{`
        @keyframes pulse-glow {
          0% { opacity: 0.5; transform: scale(1); }
          100% { opacity: ${themeColors.glowOpacity}; transform: scale(1.1); }
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes rotating {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes counter-rotating {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(-360deg); }
        }
        
        @keyframes shine-rotation {
          0% { transform: rotate(0deg); opacity: 0.1; }
          25% { opacity: 0.7; }
          50% { opacity: 0.1; }
          100% { transform: rotate(360deg); opacity: 0.1; }
        }
        
        @keyframes slide-in {
          0% { transform: translateX(-20px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        .remix-booth .turntable-container:hover {
          transform: scale(1.03);
        }
        
        .api-method {
          display: inline-block;
          background: ${themeColors.cardBg};
          padding: 10px 20px;
          border-radius: 8px;
          font-family: monospace;
          font-size: 15px;
          transition: all 0.3s ease;
          margin: 6px 6px 6px 0;
          border: 1px solid ${themeColors.cardBorder};
        }
        
        .api-method:hover {
          background: ${titleColors.blue}20;
          border-color: ${titleColors.blue}80;
          transform: translateY(-2px);
        }
        
        .remix-badge {
          background: ${themeColors.badgeBg};
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 14px;
          border: 1px solid ${titleColors.blue}30;
          display: flex;
          align-items: center;
          gap: 8px;
          max-width: 100%;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        
        .pulse-icon {
          animation: blink 2s infinite;
        }
        
        .spinning-disc {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          animation: rotating 8s linear infinite;
          z-index: 1;
        }
        
        .record-label {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${titleColors.purple}90, ${
        titleColors.blue
      }90);
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          text-align: center;
          color: ${theme === "dark" ? "white" : "#fff"};
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          overflow: hidden;
          animation: counter-rotating 10s linear infinite;
          box-shadow: ${
            theme === "dark"
              ? "0 0 10px rgba(0,0,0,0.3)"
              : "0 0 10px rgba(0,0,0,0.2), 0 0 15px " + titleColors.blue + "40"
          };
        }
        
        .record-shine {
          position: absolute;
          top: 0;
          left: 50%;
          width: 4px;
          height: 50%;
          background: linear-gradient(to bottom, transparent, ${
            titleColors.blue
          }40, ${titleColors.blue}${theme === "dark" ? "80" : "90"}, ${
        titleColors.blue
      }40, transparent);
          transform-origin: bottom center;
          z-index: 4;
          animation: shine-rotation 8s linear infinite;
        }

        .turntable-container {
          position: relative;
          width: 150px;
          height: 150px;
        }
        
        .mixer-panel {
          position: relative;
          width: 150px;
          height: 40px;
          background: ${themeColors.recordBg};
          border-radius: 10px;
          margin-top: 15px;
          display: flex;
          align-items: center;
          justify-content: space-around;
          box-shadow: ${
            theme === "dark"
              ? "0 2px 8px rgba(0, 0, 0, 0.3)"
              : "0 2px 8px rgba(100, 120, 160, 0.15)"
          };
        }
        
        .mixer-light {
          width: 8px;
          height: 18px;
          border-radius: 4px;
          box-shadow: ${theme === "dark" ? "0 0 5px" : "0 0 8px"} currentColor;
          opacity: ${theme === "dark" ? "0.9" : "1"};
        }
        
        .mixer-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          box-shadow: ${theme === "dark" ? "0 0 5px" : "0 0 8px"} currentColor;
          opacity: ${theme === "dark" ? "0.9" : "1"};
        }
        
        .record-arm {
          position: absolute;
          top: 15px;
          right: 15px;
          width: 50px;
          height: 10px;
          background: linear-gradient(90deg, ${titleColors.blue}, ${
        titleColors.blue
      }99);
          transform: rotate(-45deg);
          transform-origin: right;
          border-radius: 2px;
          box-shadow: 0 0 8px ${titleColors.blue};
          z-index: 5;
          opacity: ${theme === "dark" ? "0.9" : "1"};
        }
        
        .record-arm:after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 3px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${titleColors.blue};
          box-shadow: 0 0 5px ${titleColors.blue}${
        theme === "dark" ? "" : ", 0 0 10px " + titleColors.blue
      };
        }
        
        .record-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${titleColors.blue};
          box-shadow: 0 0 8px ${titleColors.blue};
          z-index: 3;
        }
        
        .record-circle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid ${titleColors.purple};
          box-shadow: 0 0 5px ${titleColors.purple};
          z-index: 2;
        }
        
        .record-grooves {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          z-index: 1;
        }
        
        .record-groove {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1px solid ${themeColors.recordGroove};
        }

        .mini-disc {
          position: relative;
          display: inline-block;
          width: 28px;
          height: 28px;
          animation: rotating 4s linear infinite;
          margin: 0 4px;
          top: -2px;
        }

        .new-badge {
          background: ${titleColors.blue}20;
          color: ${titleColors.blue};
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: bold;
          margin-right: 12px;
          letter-spacing: 0.5px;
          border: 1px solid ${titleColors.blue}40;
          white-space: nowrap;
        }
        
        .gradient-title {
          font-size: clamp(28px, 5vw, 42px);
          font-weight: bold;
          margin: 0;
          background-image: linear-gradient(90deg, ${titleColors.blue}, ${
        titleColors.purple
      }, ${titleColors.orange});
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          display: inline-block;
          text-shadow: 0 2px 10px ${titleColors.blue}30;
          white-space: nowrap;
        }
        
        /* Responsive styles */
        @media screen and (max-width: 768px) {
          .remix-booth .main-content {
            flex-direction: column;
          }
          
          .remix-booth .title-container {
            flex-wrap: wrap;
          }
          
          .remix-booth .api-methods {
            justify-content: center;
          }
          
          .remix-booth .remix-badge {
            max-width: 100%;
            overflow-x: auto;
            white-space: nowrap;
          }
          
          .remix-booth .remix-badge code {
            font-size: clamp(10px, 3vw, 14px);
          }
          
          .remix-booth .footer {
            flex-wrap: wrap;
            justify-content: center;
            gap: 8px;
          }
          
          .remix-booth .turntable-container,
          .remix-booth .mixer-panel {
            width: clamp(120px, 30vw, 150px);
            margin: 0 auto;
          }
          
          .remix-booth .mixer-panel {
            height: clamp(30px, 10vw, 40px);
          }
          
          .remix-booth .description-container {
            max-width: 100%;
          }
        }
        
        @media screen and (max-width: 500px) {
          .remix-booth .turntable-container {
            width: 120px;
            height: 120px;
          }
          
          .remix-booth .record-arm {
            width: 40px;
            top: 12px;
            right: 12px;
          }
          
          .remix-booth .record-label {
            width: 40px;
            height: 40px;
          }
          
          .remix-booth .title-wrapper {
            width: 100%;
            margin-top: 10px;
          }
        }
      `}</style>

      <div
        className="main-content"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "clamp(15px, 3vw, 35px)",
          position: "relative",
          zIndex: 2,
          flexWrap: "wrap",
        }}
      >
        {/* Turntable with record and arm */}
        <div style={{ position: "relative" }}>
          <div className="turntable-container">
            <div className="spinning-disc">
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: themeColors.recordBg,
                  position: "relative",
                  boxShadow:
                    theme === "dark"
                      ? `0 0 15px rgba(0, 0, 0, 0.5), 0 0 20px ${titleColors.blue}20`
                      : `0 0 15px rgba(70, 90, 140, 0.25), 0 0 25px ${titleColors.blue}30`,
                  overflow: "hidden",
                }}
              >
                {/* Record grooves */}
                <div className="record-grooves">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className="record-groove"
                      style={{
                        width: `${(i + 1) * 12}%`,
                        height: `${(i + 1) * 12}%`,
                      }}
                    />
                  ))}
                </div>

                {/* Record label */}
                <div className="record-label">
                  <div style={{ transform: "rotate(10deg)" }}>jods</div>
                </div>

                <div className="record-circle"></div>
                <div className="record-center"></div>

                {/* Shine effect */}
                <div className="record-shine"></div>

                {/* Additional glow for light mode */}
                {theme === "light" && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%) scale(1.2)",
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      background: `radial-gradient(circle, ${titleColors.blue}05 0%, ${titleColors.blue}20 30%, transparent 70%)`,
                      opacity: 0.6,
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            </div>
            <div className="record-arm"></div>
          </div>

          {/* Mixer panel with colored lights */}
          <div className="mixer-panel">
            <div
              className="mixer-light"
              style={{ backgroundColor: titleColors.blue }}
            ></div>
            <div
              className="mixer-light"
              style={{ backgroundColor: titleColors.purple }}
            ></div>
            <div
              className="mixer-light"
              style={{ backgroundColor: titleColors.blue }}
            ></div>
            <div
              className="mixer-light"
              style={{ backgroundColor: titleColors.purple }}
            ></div>
            <div
              className="mixer-dot"
              style={{
                backgroundColor: titleColors.blue,
                filter: theme === "light" ? "brightness(1.1)" : "none",
              }}
            ></div>
            <div
              className="mixer-light"
              style={{ backgroundColor: titleColors.purple }}
            ></div>
            <div
              className="mixer-light"
              style={{ backgroundColor: titleColors.blue }}
            ></div>
            <div
              className="mixer-light"
              style={{ backgroundColor: titleColors.purple }}
            ></div>
            <div
              className="mixer-light"
              style={{ backgroundColor: titleColors.blue }}
            ></div>
          </div>
        </div>

        <div
          className="content-container"
          style={{ flex: 1, minWidth: "280px" }}
        >
          <div
            className="title-container"
            style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}
          >
            <span className="new-badge">NEW</span>
            <div
              className="title-wrapper"
              style={{ display: "flex", alignItems: "center" }}
            >
              <h2 className="gradient-title">Remix Booth</h2>
              <span
                className="pulse-icon"
                style={{
                  fontSize: "clamp(24px, 4vw, 32px)",
                  marginLeft: "10px",
                }}
              >
                🎧
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "15px",
              overflowX: "auto",
              paddingBottom: "5px",
              maxWidth: "100%",
            }}
          >
            <div className="remix-badge">
              <span style={{ fontSize: "20px" }}>🎛️</span>
              <code>convention-driven full-stack production studio</code>
              <div className="mini-disc">
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${titleColors.blue}40, ${titleColors.purple}40)`,
                    position: "relative",
                    boxShadow: `0 0 5px ${titleColors.purple}`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      border: `1px solid ${titleColors.purple}`,
                      background: `${titleColors.purple}20`,
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      background: titleColors.blue,
                      boxShadow: `0 0 3px ${titleColors.blue}`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="description-container"
            style={{
              fontSize: "15px",
              lineHeight: "1.5",
              marginTop: "15px",
              color: themeColors.secondaryText,
              maxWidth: "600px",
            }}
          >
            <p style={{ margin: "0 0 10px 0", fontWeight: "500" }}>
              Pro-grade state management. Zero compromises.
            </p>
            <p style={{ margin: "0 0 10px 0", fontWeight: "500" }}>
              Rails conventions meet DJ mixing. Unmatched flexibility.
            </p>
            <p style={{ margin: "0 0 10px 0", fontWeight: "500" }}>
              Master-level precision for your server/client state.
            </p>
          </div>
        </div>
      </div>

      {/* API Methods with improved styling */}
      <div
        className="api-methods"
        style={{
          marginTop: "25px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          justifyContent: "flex-start",
        }}
      >
        <div className="api-method">useJods()</div>
        <div className="api-method">defineStore()</div>
        <div className="api-method">useJodsStore()</div>
        <div className="api-method">useJodsForm()</div>
      </div>

      {/* Footer with emoji */}
      <div
        className="footer"
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "8px",
          opacity: themeColors.iconOpacity,
          color: themeColors.iconColor,
          padding: theme === "light" ? "8px 12px" : "0",
          background: themeColors.footerBg,
          borderRadius: "8px",
          border: themeColors.footerBorder,
          boxShadow: themeColors.footerShadow,
          fontWeight: theme === "light" ? "500" : "normal",
          flexWrap: "wrap",
          fontSize: "clamp(12px, 3vw, 14px)",
        }}
      >
        <span>Mix server & client state with precision</span>
        <span
          style={{
            fontSize: "clamp(18px, 4vw, 22px)",
            marginLeft: "5px",
            filter:
              theme === "light"
                ? "drop-shadow(0 1px 2px rgba(0,100,255,0.2))"
                : "none",
          }}
        >
          🎛️
        </span>
        <span
          style={{
            fontSize: "clamp(18px, 4vw, 22px)",
            marginLeft: "5px",
            filter:
              theme === "light"
                ? "drop-shadow(0 1px 2px rgba(0,100,255,0.2))"
                : "none",
          }}
        >
          💿
        </span>
        <span
          style={{
            fontSize: "clamp(18px, 4vw, 22px)",
            marginLeft: "5px",
            filter:
              theme === "light"
                ? "drop-shadow(0 1px 2px rgba(0,100,255,0.2))"
                : "none",
          }}
        >
          🎧
        </span>
      </div>
    </div>
  );
};

export default DJRemixFinal;
