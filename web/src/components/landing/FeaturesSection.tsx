"use client";

import { FeatureCard } from "./FeatureCard";
import { ANTON, MONO, MUTED, ORANGE } from "./constants";
import styles from "./LandingPage.module.css";

export function FeaturesSection() {
  return (
    <section
      id="features"
      data-screen-label="Features"
      style={{
        position: "relative",
        zIndex: 1,
        padding: "110px 40px 120px",
        maxWidth: 1180,
        margin: "0 auto",
      }}
    >
      <div
        data-reveal=""
        style={{
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: ".28em",
          textTransform: "uppercase",
          color: ORANGE,
          marginBottom: 16,
        }}
      >
        05 — Under the hood
      </div>
      <h2
        data-reveal=""
        style={{
          margin: "0 0 52px",
          fontFamily: ANTON,
          fontWeight: 400,
          fontSize: "clamp(34px,5vw,68px)",
          lineHeight: 1,
          maxWidth: "16ch",
        }}
      >
        Built like infrastructure, not a toy.
      </h2>
      <div className={styles.featureGrid}>
        <FeatureCard
          icon={
            <>
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  border: `1.5px solid ${ORANGE}`,
                  borderRadius: "50%",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: 6,
                  height: 6,
                  background: ORANGE,
                  borderRadius: "50%",
                  transform: "translate(-50%,-50%)",
                }}
              />
            </>
          }
          title="Context memory (RAG)"
          description="Remembers your voice, past posts and brand facts. Every draft sounds like you — not a template that read your bio once."
        />
        <FeatureCard
          icon={
            <>
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  border: `1.5px solid ${ORANGE}`,
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: 7,
                  top: 7,
                  right: 7,
                  bottom: 7,
                  border: `1.5px solid ${ORANGE}`,
                  transform: "rotate(45deg)",
                }}
              />
            </>
          }
          title="Bring your own key"
          description="Route through your own model provider. Your data, your bill, your control — Genora never sits between you and the model."
        />
        <FeatureCard
          icon={
            <>
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  width: 8,
                  height: 14,
                  background: ORANGE,
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: 13,
                  bottom: 0,
                  width: 8,
                  height: 24,
                  background: ORANGE,
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: 26,
                  bottom: 0,
                  width: 8,
                  height: 34,
                  background: ORANGE,
                }}
              />
            </>
          }
          title="Quota & usage tracking"
          description="Live token and cost tracking per platform, per post. Set caps, watch spend, never open a surprise invoice."
        />
        <FeatureCard
          icon={
            <>
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 15,
                  width: 14,
                  height: 4,
                  background: ORANGE,
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: 20,
                  top: 15,
                  width: 14,
                  height: 4,
                  background: ORANGE,
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: 15,
                  top: 0,
                  width: 4,
                  height: 34,
                  background: MUTED,
                }}
              />
            </>
          }
          title="Partial-failure resilience"
          description="If X's API falls over, LinkedIn still ships. Every platform runs isolated — retry only the one that broke."
        />
      </div>
    </section>
  );
}
