"use client";

import { CtaSection } from "./CtaSection";
import { FeaturesSection } from "./FeaturesSection";
import { Hero } from "./Hero";
import { HowItWorksSection } from "./HowItWorksSection";
import { Nav } from "./Nav";
import { PipelineSection } from "./PipelineSection";
import { PlatformsSection } from "./PlatformsSection";
import { GROTESK, INK, ORANGE, TEXT } from "./constants";
import { useLandingMotion } from "./useLandingMotion";

export function LandingPage() {
  useLandingMotion();

  return (
    <div
      id="gr-root"
      style={{
        position: "relative",
        background: INK,
        color: TEXT,
        fontFamily: GROTESK,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* PARALLAX DASHED GRID */}
      <div
        id="gridLayer"
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: "-20% 0",
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(242,238,231,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(242,238,231,.045) 1px,transparent 1px)",
          backgroundSize: "88px 88px",
          opacity: 0.7,
          willChange: "transform",
        }}
      />
      <div
        id="edgeGlow"
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          pointerEvents: "none",
          opacity: 0,
          transition: "opacity .5s ease",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: 2,
            borderRadius: 0,
            background:
              "conic-gradient(from 0deg,#E8853A,#D94E45,#7B61FF,#2A9D8F,#E8853A)",
            WebkitMask:
              "linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            opacity: 0.55,
            filter: "blur(1px)",
          }}
        />
      </div>

      {/* cursor crosshair (hero only) */}
      <div
        id="curCross"
        aria-hidden="true"
        style={{
          position: "fixed",
          zIndex: 45,
          left: 0,
          top: 0,
          width: 26,
          height: 26,
          pointerEvents: "none",
          opacity: 0,
          transform: "translate(-50%,-50%)",
          transition: "opacity .25s",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 1,
            background: ORANGE,
            transform: "translateX(-50%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: 1,
            background: ORANGE,
            transform: "translateY(-50%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: ORANGE,
            transform: "translate(-50%,-50%)",
            boxShadow: `0 0 8px ${ORANGE}`,
          }}
        />
      </div>

      <Nav />
      <Hero />
      <PipelineSection />
      <PlatformsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <CtaSection />
    </div>
  );
}
