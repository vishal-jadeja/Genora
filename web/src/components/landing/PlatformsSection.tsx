"use client";

import { TiltCard } from "./TiltCard";
import { ANTON, GROTESK, MONO, MUTED, ORANGE } from "./constants";

function FeedCards() {
  return (
    <>
      <TiltCard
        style={{
          flex: "0 0 auto",
          width: 440,
          background: "#fff",
          color: "#1a1a1a",
          borderRadius: 10,
          padding: 20,
          boxShadow: "0 30px 70px -30px rgba(0,0,0,.7)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#0A66C2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontFamily: GROTESK,
              fontSize: 16,
            }}
          >
            JR
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Jordan Reyes</div>
            <div style={{ fontSize: 12, color: "#666" }}>
              Founder, building in public · 2h
            </div>
          </div>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 12,
              color: "#0A66C2",
              fontWeight: 600,
            }}
          >
            + Follow
          </span>
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.55 }}>
          We shipped a feature <b>nobody asked for.</b>
          <br />
          <br />
          It&apos;s now our most-used one.
          <br />
          <br />
          The lesson wasn&apos;t &quot;ignore users.&quot; It was: the sharpest
          signal is your own frustration, used daily. Build for the operator you
          already are 👇
        </p>
        <div
          style={{
            display: "flex",
            gap: 16,
            paddingTop: 12,
            borderTop: "1px solid #eee",
            fontSize: 12,
            color: "#666",
          }}
        >
          <span>👍 342</span>
          <span>💬 28</span>
          <span>↪ 14</span>
        </div>
        <div
          style={{
            marginTop: 12,
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "#0A66C2",
          }}
        >
          LinkedIn · professional
        </div>
      </TiltCard>

      <TiltCard
        style={{
          flex: "0 0 auto",
          width: 440,
          background: "#000",
          color: "#e7e9ea",
          border: "1px solid #2f3336",
          borderRadius: 10,
          padding: 20,
          boxShadow: "0 30px 70px -30px rgba(0,0,0,.7)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#333",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            JR
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Jordan Reyes</div>
            <div style={{ fontSize: 12, color: "#71767b" }}>@jreyes · 1/5</div>
          </div>
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 15, lineHeight: 1.45 }}>
          we built a feature literally nobody asked for.
          <br />
          <br />
          it&apos;s now the #1 reason people pay us.
          <br />
          <br />a thread on why &quot;scratch your own itch&quot; beats a
          roadmap 🧵
        </p>
        <div
          style={{
            display: "flex",
            gap: 22,
            paddingTop: 12,
            borderTop: "1px solid #2f3336",
            fontSize: 12,
            color: "#71767b",
          }}
        >
          <span>💬 91</span>
          <span>🔁 210</span>
          <span>♥ 1.4K</span>
        </div>
        <div
          style={{
            marginTop: 12,
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "#71767b",
          }}
        >
          X · punchy thread
        </div>
      </TiltCard>

      <TiltCard
        style={{
          flex: "0 0 auto",
          width: 440,
          background: "#fff",
          color: "#1a1a1a",
          border: "1px solid #ececec",
          borderRadius: 10,
          padding: 0,
          overflow: "hidden",
          boxShadow: "0 30px 70px -30px rgba(0,0,0,.7)",
        }}
      >
        <div style={{ display: "flex" }}>
          <div
            style={{
              width: 40,
              background: "#F7F7F7",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "12px 0",
              gap: 6,
            }}
          >
            <span style={{ color: "#FF4500", fontSize: 16 }}>▲</span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>988</span>
            <span style={{ color: "#9AA", fontSize: 16 }}>▼</span>
          </div>
          <div style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "#787c7e", marginBottom: 8 }}>
              <b style={{ color: "#1a1a1a" }}>r/SaaS</b> · Posted by u/jreyes ·
              3h
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 8,
                lineHeight: 1.3,
              }}
            >
              We shipped a feature nobody requested. It became our most-used
              one. Here&apos;s what I&apos;d tell my past self.
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                lineHeight: 1.55,
                color: "#333",
              }}
            >
              Long-time lurker. Quick story + the counterintuitive takeaway on
              building for yourself vs. chasing feature requests. Happy to
              answer questions in the comments.
            </p>
            <div
              style={{
                marginTop: 12,
                fontFamily: MONO,
                fontSize: 9,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "#FF4500",
              }}
            >
              Reddit · community, no-hype
            </div>
          </div>
        </div>
      </TiltCard>

      <TiltCard
        style={{
          flex: "0 0 auto",
          width: 440,
          background: "#fff",
          color: "#242424",
          borderRadius: 10,
          padding: 24,
          boxShadow: "0 30px 70px -30px rgba(0,0,0,.7)",
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "#6B6B6B",
            marginBottom: 14,
          }}
        >
          Product · 6 min read
        </div>
        <h3
          style={{
            margin: "0 0 12px",
            fontFamily: "Georgia, serif",
            fontSize: 26,
            lineHeight: 1.2,
            fontWeight: 700,
          }}
        >
          The Feature Nobody Asked For
        </h3>
        <p
          style={{
            margin: "0 0 14px",
            fontFamily: "Georgia, serif",
            fontSize: 15,
            lineHeight: 1.6,
            color: "#333",
          }}
        >
          There&apos;s a particular kind of silence that follows shipping
          something no user requested. Then, quietly, the usage graph did
          something none of our roadmap items ever managed…
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#242424",
            }}
          />
          <span style={{ fontSize: 12, color: "#6B6B6B" }}>
            Jordan Reyes · Jul 6
          </span>
        </div>
        <div
          style={{
            marginTop: 12,
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "#242424",
          }}
        >
          Medium · long-form essay
        </div>
      </TiltCard>

      <TiltCard
        style={{
          flex: "0 0 auto",
          width: 440,
          background: "#FFF6E9",
          color: "#2b2b2b",
          border: "1px solid #efe1cb",
          borderRadius: 10,
          padding: 24,
          boxShadow: "0 30px 70px -30px rgba(0,0,0,.7)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            marginBottom: 16,
            paddingBottom: 14,
            borderBottom: "1px solid #efe1cb",
          }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 5,
              background: "#FF6719",
            }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              The Operator&apos;s Log
            </div>
            <div style={{ fontSize: 11, color: "#7a7266" }}>
              by Jordan Reyes
            </div>
          </div>
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "#7a7266",
            marginBottom: 8,
          }}
        >
          Subject line
        </div>
        <h3
          style={{
            margin: "0 0 12px",
            fontFamily: "Georgia, serif",
            fontSize: 21,
            lineHeight: 1.25,
          }}
        >
          Building for yourself is underrated
        </h3>
        <p
          style={{
            margin: 0,
            fontFamily: "Georgia, serif",
            fontSize: 14,
            lineHeight: 1.6,
            color: "#3a3a3a",
          }}
        >
          Hey — this week I want to tell you about a feature we almost
          didn&apos;t build, and why it changed how I think about listening to
          users…
        </p>
        <div
          style={{
            marginTop: 14,
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "#FF6719",
          }}
        >
          Substack · warm newsletter
        </div>
      </TiltCard>
    </>
  );
}

export function PlatformsSection() {
  return (
    <section
      id="platforms"
      data-screen-label="Platforms"
      style={{ position: "relative", zIndex: 1, paddingTop: 40 }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 40px" }}>
        <div
          data-reveal=""
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 20,
            marginBottom: 44,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: ".28em",
                textTransform: "uppercase",
                color: ORANGE,
                marginBottom: 16,
              }}
            >
              03 — One thought, five voices
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: ANTON,
                fontWeight: 400,
                fontSize: "clamp(34px,5vw,68px)",
                lineHeight: 1,
              }}
            >
              Native to every feed.
            </h2>
          </div>
          <p
            style={{
              maxWidth: 340,
              margin: 0,
              fontSize: 15,
              lineHeight: 1.6,
              color: MUTED,
            }}
          >
            Same idea, restyled for the room. Genora writes in each
            platform&apos;s cadence — length, formatting, and etiquette
            included.
          </p>
        </div>
      </div>

      <div
        id="platScrollSpace"
        style={{ position: "relative", height: "100vh" }}
      >
        <div
          id="platViewport"
          style={{
            position: "sticky",
            top: 88,
            display: "flex",
            flexDirection: "column",
            padding: "16px 0",
            overflow: "hidden",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div
            id="platTrack"
            style={{
              display: "flex",
              gap: 34,
              padding: "0 40px",
              width: "max-content",
            }}
          >
            <FeedCards />
          </div>
          <div
            style={{
              maxWidth: 1180,
              margin: "20px auto 0",
              padding: "0 40px",
              width: "100%",
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "#5f594f",
            }}
          >
            ↓ scroll to browse the feed →
          </div>
        </div>
      </div>
    </section>
  );
}
