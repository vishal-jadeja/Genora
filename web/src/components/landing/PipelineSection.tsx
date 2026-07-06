"use client";

import { SlopGuardDemo } from "./SlopGuardDemo";
import { ANTON, MONO, MUTED2, ORANGE } from "./constants";

export function PipelineSection() {
  return (
    <section
      id="intro"
      data-screen-label="Powered by AI"
      style={{
        position: "relative",
        zIndex: 1,
        padding: "150px 40px 130px",
        maxWidth: 1180,
        margin: "0 auto",
      }}
    >
      <div
        data-reveal=""
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 30,
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: ".28em",
            textTransform: "uppercase",
            color: ORANGE,
          }}
        >
          02 — The pipeline
        </span>
      </div>
      <h2
        data-reveal=""
        style={{
          margin: 0,
          maxWidth: "15ch",
          fontFamily: ANTON,
          fontWeight: 400,
          fontSize: "clamp(38px,6vw,88px)",
          lineHeight: 0.98,
        }}
      >
        Writer, Critic, Reviser. Then a bouncer at the door.
      </h2>
      <p
        data-reveal=""
        style={{
          maxWidth: 560,
          margin: "30px 0 0",
          fontSize: 17,
          lineHeight: 1.6,
          color: MUTED2,
        }}
      >
        Three models pass every draft between them until it earns its place.
        Then <span style={{ color: ORANGE }}>Slop Guard</span> reads it one last
        time and throws out the parts that sound like a robot doing an
        impression of you.
      </p>

      <SlopGuardDemo />
    </section>
  );
}
