"use client";

import { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";

type PopynsLogoAnimatedProps = {
  size?: number;
  skipEntrance?: boolean;
};

const CREAM = "#F5EFE6";
const ROSE = "#EAC8C0";

const LEFT_LETTERS = ["P", "O"];
const RIGHT_LETTERS = ["Y", "N", "S"];

export function PopynsLogoAnimated({
  size = 60,
  skipEntrance = false,
}: PopynsLogoAnimatedProps) {
  const reduce = useReducedMotion();
  const skip = skipEntrance || reduce;

  const diameter = size * 1.2;
  const borderWidth = Math.max(2, diameter * 0.06);
  const innerPSize = diameter * 0.74;
  const gap = size * 0.02;

  const letterStyle: CSSProperties = {
    fontFamily: "var(--font-poppins)",
    fontWeight: 400,
    fontSize: `${size}px`,
    letterSpacing: "0.01em",
    color: CREAM,
    lineHeight: 1,
    display: "inline-block",
  };

  const circleStyle: CSSProperties = {
    width: `${diameter}px`,
    height: `${diameter}px`,
    borderRadius: "9999px",
    border: `${borderWidth}px solid ${CREAM}`,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-poppins)",
    fontWeight: 800,
    fontSize: `${innerPSize}px`,
    lineHeight: 1,
    color: CREAM,
    boxShadow: `0 0 ${diameter * 0.5}px ${ROSE}55`,
  };

  const lineDelay = 2.1;
  const taglineDelay = 2.4;

  if (skip) {
    return (
      <div className="flex flex-col items-center">
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: `${gap}px`,
          }}
        >
          {LEFT_LETTERS.map((l) => (
            <span key={`l-${l}`} style={letterStyle}>
              {l}
            </span>
          ))}
          <span style={circleStyle}>P</span>
          {RIGHT_LETTERS.map((l) => (
            <span key={`r-${l}`} style={letterStyle}>
              {l}
            </span>
          ))}
        </div>
        <div
          className="mt-5"
          style={{
            width: "220px",
            height: "1px",
            background: "rgba(245,239,230,0.4)",
          }}
        />
        <p
          className="mt-3"
          style={{
            fontFamily: "var(--font-manrope)",
            fontWeight: 700,
            fontSize: "10px",
            letterSpacing: "0.40em",
            color: ROSE,
            opacity: 0.8,
            textTransform: "uppercase",
          }}
        >
          BELEZA · ONDE VOCÊ ESTÁ
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: `${gap}px`,
        }}
      >
        {LEFT_LETTERS.map((letter, i) => (
          <motion.span
            key={`l-${letter}`}
            style={letterStyle}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
              delay: 1.3 + (LEFT_LETTERS.length - 1 - i) * 0.065,
            }}
          >
            {letter}
          </motion.span>
        ))}

        <motion.span
          style={circleStyle}
          initial={{ scale: 0.2, rotate: -90, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{
            duration: 0.85,
            delay: 0.4,
            ease: [0.34, 1.4, 0.5, 1],
          }}
        >
          P
        </motion.span>

        {RIGHT_LETTERS.map((letter, i) => (
          <motion.span
            key={`r-${letter}`}
            style={letterStyle}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
              delay: 1.3 + i * 0.065,
            }}
          >
            {letter}
          </motion.span>
        ))}
      </div>

      <motion.div
        className="mt-5"
        style={{
          height: "1px",
          background: "rgba(245,239,230,0.4)",
        }}
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 220, opacity: 1 }}
        transition={{
          duration: 0.65,
          delay: lineDelay,
          ease: [0.22, 1, 0.36, 1],
        }}
      />

      <motion.p
        className="mt-3"
        style={{
          fontFamily: "var(--font-manrope)",
          fontWeight: 700,
          fontSize: "10px",
          letterSpacing: "0.40em",
          color: ROSE,
          opacity: 0.8,
          textTransform: "uppercase",
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 0.8, y: 0 }}
        transition={{
          duration: 0.6,
          delay: taglineDelay,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        BELEZA · ONDE VOCÊ ESTÁ
      </motion.p>
    </div>
  );
}
