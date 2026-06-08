import { CSSProperties } from "react";

type ColorVariant = "cream" | "wine";

type PopynsLogoProps = {
  color?: ColorVariant;
  size?: number;
  tagline?: boolean;
  className?: string;
};

const PALETTE: Record<ColorVariant, string> = {
  cream: "#F5EFE6",
  wine: "#5C0331",
};

const ROSE = "#EAC8C0";

export function PopynsLogo({
  color = "cream",
  size = 44,
  tagline = false,
  className = "",
}: PopynsLogoProps) {
  const ink = PALETTE[color];

  const diameter = size * 1.2;
  const borderWidth = Math.max(2, diameter * 0.06);
  const innerPSize = diameter * 0.74;
  const gap = size * 0.02;

  const wordmarkStyle: CSSProperties = {
    fontFamily: "var(--font-poppins)",
    fontWeight: 400,
    fontSize: `${size}px`,
    letterSpacing: "0.01em",
    color: ink,
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    gap: `${gap}px`,
  };

  const circleStyle: CSSProperties = {
    width: `${diameter}px`,
    height: `${diameter}px`,
    borderRadius: "9999px",
    border: `${borderWidth}px solid ${ink}`,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-poppins)",
    fontWeight: 800,
    fontSize: `${innerPSize}px`,
    lineHeight: 1,
    color: ink,
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div style={wordmarkStyle} aria-label="POPYNS">
        <span>P</span>
        <span>O</span>
        <span style={circleStyle}>P</span>
        <span>Y</span>
        <span>N</span>
        <span>S</span>
      </div>

      {tagline && (
        <>
          <div
            className="mt-5"
            style={{
              width: "220px",
              height: "1px",
              background:
                color === "cream"
                  ? "rgba(245,239,230,0.4)"
                  : "rgba(92,3,49,0.35)",
            }}
          />
          <p
            className="mt-3"
            style={{
              fontFamily: "var(--font-manrope)",
              fontWeight: 700,
              fontSize: "10px",
              letterSpacing: "0.40em",
              color: color === "cream" ? ROSE : "#5C0331",
              opacity: color === "cream" ? 0.8 : 0.7,
              textTransform: "uppercase",
            }}
          >
            BELEZA · ONDE VOCÊ ESTÁ
          </p>
        </>
      )}
    </div>
  );
}
