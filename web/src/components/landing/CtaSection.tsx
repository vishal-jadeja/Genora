"use client";

import { Hoverable } from "@/components/Hoverable";
import { WaitlistForm } from "./WaitlistForm";
import { ANTON, MONO, MUTED, ORANGE, TEXT } from "./constants";

const footerLinkStyle = {
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: ".14em",
  textTransform: "uppercase" as const,
  color: MUTED,
  textDecoration: "none",
};

export function CtaSection() {
  return (
    <section
      id="cta"
      data-screen-label="CTA"
      style={{
        position: "relative",
        zIndex: 1,
        padding: "60px 40px 0",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          textAlign: "center",
          padding: "70px 0 90px",
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
            marginBottom: 26,
          }}
        >
          Early access · summer 2026
        </div>
        <h2
          data-reveal=""
          style={{
            margin: "0 auto",
            maxWidth: "16ch",
            fontFamily: ANTON,
            fontWeight: 400,
            fontSize: "clamp(44px,8vw,120px)",
            lineHeight: 0.94,
          }}
        >
          Write it once. We&apos;ll handle the rest.
        </h2>

        <div
          data-reveal=""
          id="pricing"
          style={{ margin: "44px auto 0", maxWidth: 480 }}
        >
          <WaitlistForm />
          <div
            style={{
              marginTop: 14,
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: ".1em",
              color: "#5f594f",
              textTransform: "uppercase",
            }}
          >
            No card · BYOK from day one · cancel anytime
          </div>
        </div>
      </div>

      <footer
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          borderTop: "1px solid rgba(242,238,231,.1)",
          padding: "36px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span
            style={{
              position: "relative",
              width: 14,
              height: 14,
              display: "inline-block",
            }}
          >
            <span
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
            <span
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
            <span
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: ORANGE,
                transform: "translate(-50%,-50%)",
              }}
            />
          </span>
          <span
            style={{
              fontFamily: ANTON,
              fontSize: 18,
              letterSpacing: ".04em",
            }}
          >
            GENORA
          </span>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: "#5f594f",
              marginLeft: 6,
            }}
          >
            © 2026
          </span>
        </div>
        <div style={{ display: "flex", gap: 26 }}>
          <Hoverable
            as="a"
            href="#intro"
            style={footerLinkStyle}
            hoverStyle={{ color: TEXT }}
          >
            Intro
          </Hoverable>
          <Hoverable
            as="a"
            href="#platforms"
            style={footerLinkStyle}
            hoverStyle={{ color: TEXT }}
          >
            Platforms
          </Hoverable>
          <Hoverable
            as="a"
            href="#features"
            style={footerLinkStyle}
            hoverStyle={{ color: TEXT }}
          >
            Features
          </Hoverable>
          <Hoverable
            as="a"
            href="#cta"
            style={footerLinkStyle}
            hoverStyle={{ color: TEXT }}
          >
            Access
          </Hoverable>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <Hoverable
            as="a"
            href="#top"
            style={footerLinkStyle}
            hoverStyle={{ color: ORANGE }}
          >
            X
          </Hoverable>
          <Hoverable
            as="a"
            href="#top"
            style={footerLinkStyle}
            hoverStyle={{ color: ORANGE }}
          >
            LinkedIn
          </Hoverable>
          <Hoverable
            as="a"
            href="#top"
            style={footerLinkStyle}
            hoverStyle={{ color: ORANGE }}
          >
            GitHub
          </Hoverable>
        </div>
      </footer>
    </section>
  );
}
