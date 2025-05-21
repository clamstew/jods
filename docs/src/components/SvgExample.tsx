import React from "react";
import DJTurntable from "./DJTurntable";
import { ReactLogoImg, PreactLogoImg, RemixLogoImg } from "./SvgImports";

const SvgExample: React.FC = () => {
  return (
    <div
      className="svg-example-container"
      style={{
        padding: "30px",
        background: "#0f0f1a",
        borderRadius: "12px",
        color: "white",
      }}
    >
      <h2 style={{ marginBottom: "25px" }}>SVG Component Collection</h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "40px",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "20px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h3 style={{ marginBottom: "15px", color: "#61dafb" }}>
            Dynamic SVG Components
          </h3>
          <div
            style={{
              display: "flex",
              gap: "30px",
              justifyContent: "center",
              background: "rgba(30, 30, 50, 0.5)",
              padding: "20px",
              borderRadius: "10px",
            }}
          >
            <div>
              <DJTurntable
                width={150}
                height={150}
                color="#ff7b1a"
                secondaryColor="#61dafb"
                isSpinning={true}
              />
              <p style={{ marginTop: "10px", fontSize: "14px" }}>Orange/Blue</p>
            </div>

            <div>
              <DJTurntable
                width={150}
                height={150}
                color="#9d71ff"
                secondaryColor="#ff7b1a"
                isSpinning={true}
              />
              <p style={{ marginTop: "10px", fontSize: "14px" }}>
                Purple/Orange
              </p>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <h3 style={{ marginBottom: "15px", color: "#9d71ff" }}>
            Static SVG Images
          </h3>
          <div
            style={{
              display: "flex",
              gap: "20px",
              justifyContent: "center",
              background: "rgba(30, 30, 50, 0.5)",
              padding: "20px",
              borderRadius: "10px",
            }}
          >
            <div>
              <ReactLogoImg width={80} height={80} />
              <p style={{ marginTop: "10px", fontSize: "14px" }}>React</p>
            </div>

            <div>
              <PreactLogoImg width={80} height={80} />
              <p style={{ marginTop: "10px", fontSize: "14px" }}>Preact</p>
            </div>

            <div>
              <RemixLogoImg width={80} height={80} />
              <p style={{ marginTop: "10px", fontSize: "14px" }}>Remix</p>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "30px",
          fontSize: "14px",
          color: "#aaa",
          textAlign: "center",
        }}
      >
        <p>
          The turntables are inline SVG React components with dynamic props for
          colors and animations.
          <br />
          The logo images are static SVG files loaded via img tags.
        </p>
      </div>
    </div>
  );
};

export default SvgExample;
