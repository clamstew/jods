import React from "react";
import DJTurntable from "./DJTurntable";

interface DJBoothDemoProps {
  className?: string;
}

const DJBoothDemo: React.FC<DJBoothDemoProps> = ({ className = "" }) => {
  return (
    <div
      className={className}
      style={{
        padding: "25px",
        background:
          "linear-gradient(135deg, rgba(30, 30, 60, 0.9) 0%, rgba(40, 40, 80, 0.8) 100%)",
        borderRadius: "12px",
        boxShadow: "0 15px 40px rgba(0, 0, 0, 0.2)",
        color: "white",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        marginBottom: "30px",
        overflow: "hidden",
        position: "relative",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Animated Background Elements */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: "2px",
              height: "2px",
              borderRadius: "50%",
              background: "rgba(157, 113, 255, 0.3)",
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `pulse${i % 3} ${
                2 + Math.random() * 3
              }s infinite alternate`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes pulse0 {
          0% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(3); opacity: 0.7; }
        }
        @keyframes pulse1 {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(4); opacity: 0.2; }
        }
        @keyframes pulse2 {
          0% { transform: scale(1.5); opacity: 0.2; }
          100% { transform: scale(3.5); opacity: 0.6; }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            position: "relative",
            marginRight: "25px",
            animation: "float 6s ease-in-out infinite",
          }}
        >
          <DJTurntable
            width={100}
            height={100}
            color="#ff7b1a"
            secondaryColor="#61dafb"
            isSpinning={true}
          />
        </div>

        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "36px",
              fontWeight: "bold",
              background: "linear-gradient(90deg, #61dafb, #9d71ff, #ff7b1a)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 2px 10px rgba(97, 218, 251, 0.3)",
            }}
          >
            Remixing Remix
          </h2>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "10px",
            }}
          >
            <span
              style={{
                fontSize: "16px",
                color: "#ddd",
                marginRight: "15px",
              }}
            >
              Full-stack convention-driven state management
            </span>
            <span
              style={{
                background: "rgba(97, 218, 251, 0.2)",
                color: "#61dafb",
                padding: "3px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "bold",
                animation: "pulse0 2s infinite alternate",
              }}
            >
              NEW
            </span>
          </div>

          <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
            {["useJods()", "defineStore()", "useJodsForm()"].map((code, i) => (
              <span
                key={i}
                style={{
                  background: "rgba(0, 0, 0, 0.3)",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  color: "#fff",
                  border: "1px solid rgba(157, 113, 255, 0.3)",
                }}
              >
                {code}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "30px",
          display: "flex",
          justifyContent: "center",
          gap: "40px",
          flexWrap: "wrap",
        }}
      >
        <DJTurntable
          width={140}
          height={140}
          color="#ff7b1a"
          secondaryColor="#61dafb"
          isSpinning={true}
        />
        <DJTurntable
          width={140}
          height={140}
          color="#9d71ff"
          secondaryColor="#ff7b1a"
          isSpinning={true}
        />
        <DJTurntable
          width={140}
          height={140}
          color="#61dafb"
          secondaryColor="#ff7b1a"
          recordColor="#222235"
          isSpinning={true}
        />
      </div>

      <div
        style={{
          marginTop: "20px",
          background: "rgba(0, 0, 0, 0.2)",
          padding: "15px",
          borderRadius: "8px",
          fontSize: "14px",
          lineHeight: "1.5",
          color: "#ddd",
        }}
      >
        Full-stack state management for Remix applications with server-side
        features, automatic hydration, and form handling. Inspired by Rails
        conventions with a modern reactive approach.
      </div>
    </div>
  );
};

export default DJBoothDemo;
