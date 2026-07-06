"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Hoverable } from "@/components/Hoverable";

const ANTON = "var(--font-anton), sans-serif";
const GROTESK = "var(--font-space-grotesk), sans-serif";
const MONO = "var(--font-jetbrains-mono), monospace";

const ORANGE = "#E8853A";
const RED = "#D94E45";
const TEAL = "#2A9D8F";
const INK = "#0E0D0B";
const TEXT = "#F2EEE7";
const MUTED = "#8A8378";
const MUTED2 = "#B4ADA1";
const CARD = "#17140F";
const CARD2 = "#141109";

const linkStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: ".18em",
  textTransform: "uppercase",
  color: MUTED,
  textDecoration: "none",
};

function usePrefersReducedMotion() {
  const ref = useRef(false);
  useEffect(() => {
    ref.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  return ref;
}

function Magnetic({
  as = "div",
  className,
  style,
  children,
  ...rest
}: {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  [key: string]: unknown;
}) {
  const Tag = as as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        transition: "transform .25s cubic-bezier(.2,.8,.2,1)",
        ...style,
      }}
      onMouseMove={(e: React.MouseEvent) => {
        if (reduced.current || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        ref.current.style.transform = `translate(${dx * 0.28}px, ${dy * 0.34}px)`;
      }}
      onMouseLeave={() => {
        if (ref.current) ref.current.style.transform = "translate(0,0)";
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

function TiltCard({
  style,
  children,
}: {
  style: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();

  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      style={{
        transition: "transform .3s cubic-bezier(.2,.8,.2,1)",
        ...style,
      }}
      onMouseMove={(e) => {
        if (reduced.current || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        ref.current.style.transform = `perspective(900px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg) translateY(-6px)`;
      }}
      onMouseLeave={() => {
        if (ref.current)
          ref.current.style.transform =
            "perspective(900px) rotateY(0) rotateX(0) translateY(0)";
      }}
    >
      {children}
    </article>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      data-reveal=""
      style={{
        position: "relative",
        background: CARD2,
        border: `1px solid ${hover ? "rgba(232,133,58,.55)" : "rgba(242,238,231,.1)"}`,
        borderRadius: 10,
        padding: 30,
        boxShadow: hover
          ? "0 0 0 1px rgba(232,133,58,.25), 0 24px 60px -30px rgba(232,133,58,.5)"
          : "none",
        transition: "border-color .3s, box-shadow .3s",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          position: "relative",
          marginBottom: 22,
        }}
      >
        {icon}
      </div>
      <h3 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 600 }}>
        {title}
      </h3>
      <p style={{ margin: 0, color: MUTED, fontSize: 15, lineHeight: 1.6 }}>
        {description}
      </p>
    </div>
  );
}

const FLY_CARDS: {
  style: CSSProperties;
  iconBg: string;
  label: string;
  labelColor: string;
  barBg: string;
  iconRadius?: string;
  bar1: { h: number; w: string };
  bar2: { w: string };
}[] = [
  {
    style: { background: "#fff" },
    iconBg: "#0A66C2",
    iconRadius: "3px",
    label: "LinkedIn",
    labelColor: "#0A66C2",
    barBg: "#e6e6e6",
    bar1: { h: 5, w: "90%" },
    bar2: { w: "70%" },
  },
  {
    style: { background: "#000", border: "1px solid #2b2b2b" },
    iconBg: "#111",
    iconRadius: "3px",
    label: "Thread",
    labelColor: MUTED,
    barBg: "#2b2b2b",
    bar1: { h: 5, w: "85%" },
    bar2: { w: "60%" },
  },
  {
    style: { background: "#fff" },
    iconBg: "#FF4500",
    iconRadius: "50%",
    label: "r/SaaS",
    labelColor: "#FF4500",
    barBg: "#e6e6e6",
    bar1: { h: 5, w: "80%" },
    bar2: { w: "65%" },
  },
  {
    style: { background: "#fff" },
    iconBg: "#111",
    iconRadius: "50%",
    label: "Medium",
    labelColor: "#111",
    barBg: "#eaeaea",
    bar1: { h: 6, w: "85%" },
    bar2: { w: "55%" },
  },
  {
    style: { background: "#FFF6E9" },
    iconBg: "#FF6719",
    iconRadius: "3px",
    label: "Substack",
    labelColor: "#FF6719",
    barBg: "#efe4d2",
    bar1: { h: 5, w: "88%" },
    bar2: { w: "62%" },
  },
];

export function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [slopHover, setSlopHover] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const cleanup: Array<() => void> = [];

    // cursor crosshair inside hero
    const hero = document.getElementById("heroPin");
    const cross = document.getElementById("curCross");
    if (hero && cross && !reduced) {
      const onMove = (e: MouseEvent) => {
        cross.style.left = e.clientX + "px";
        cross.style.top = e.clientY + "px";
      };
      const onEnter = () => {
        cross.style.opacity = "1";
      };
      const onLeave = () => {
        cross.style.opacity = "0";
      };
      hero.addEventListener("mousemove", onMove);
      hero.addEventListener("mouseenter", onEnter);
      hero.addEventListener("mouseleave", onLeave);
      cleanup.push(() => {
        hero.removeEventListener("mousemove", onMove);
        hero.removeEventListener("mouseenter", onEnter);
        hero.removeEventListener("mouseleave", onLeave);
      });
    }

    let lenis: import("lenis").default | undefined;
    let tickerFn: ((time: number) => void) | undefined;
    let safetyTimeout: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      const [{ gsap }, { ScrollTrigger }, { default: Lenis }] =
        await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
          import("lenis"),
        ]);
      gsap.registerPlugin(ScrollTrigger);

      if (!reduced) {
        lenis = new Lenis({ duration: 1.1, smoothWheel: true });
        lenis.on("scroll", ScrollTrigger.update);
        tickerFn = (time: number) => lenis?.raf(time * 1000);
        gsap.ticker.add(tickerFn);
        gsap.ticker.lagSmoothing(0);
      }

      const words = document.querySelectorAll(".hero-word");
      if (words.length && !reduced) {
        gsap.from(words, {
          yPercent: 115,
          opacity: 0,
          duration: 0.9,
          ease: "power4.out",
          stagger: 0.06,
          delay: 0.15,
        });
      }
      const heroEls = document.querySelectorAll("[data-hero-el]");
      if (heroEls.length && !reduced) {
        gsap.from(heroEls, {
          y: 24,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.12,
          delay: 0.55,
        });
      }

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        if (reduced) {
          gsap.set(el, { opacity: 1 });
          return;
        }
        gsap.from(el, {
          y: 46,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 84%" },
        });
      });

      if (!reduced) {
        const grid = document.getElementById("gridLayer");
        if (grid) {
          gsap.to(grid, {
            yPercent: 14,
            ease: "none",
            scrollTrigger: {
              trigger: "#gr-root",
              start: "top top",
              end: "bottom bottom",
              scrub: true,
            },
          });
        }
      }

      const fly = gsap.utils.toArray<HTMLElement>(".hero-fly");
      const finals = [
        { x: -430, y: 44, r: -9 },
        { x: -215, y: -58, r: -4 },
        { x: 8, y: 30, r: 2 },
        { x: 225, y: -52, r: 5 },
        { x: 440, y: 50, r: 10 },
      ];
      if (fly.length && !reduced) {
        gsap.set(fly, { opacity: 0, scale: 0.7, x: 0, y: 0, rotate: 0 });
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: "#heroSection",
            start: "top top",
            end: "+=150%",
            pin: "#heroPin",
            scrub: 0.6,
            anticipatePin: 1,
          },
        });
        tl.to(
          "#heroNote",
          {
            scale: 0.4,
            y: -150,
            opacity: 0.22,
            duration: 0.5,
            ease: "power2.inOut",
          },
          0,
        );
        tl.to("#heroAnnotate", { opacity: 0, duration: 0.25 }, 0);
        tl.to("#scrollCue", { opacity: 0, duration: 0.2 }, 0);
        fly.forEach((c, i) => {
          const f = finals[i] || finals[0];
          tl.to(
            c,
            {
              opacity: 1,
              scale: 1,
              x: f.x,
              y: f.y,
              rotate: f.r,
              duration: 0.6,
              ease: "power2.out",
            },
            0.28 + i * 0.05,
          );
        });
      }

      const glow = document.getElementById("edgeGlow");
      if (glow) {
        ScrollTrigger.create({
          trigger: "#intro",
          start: "top 60%",
          end: "bottom 40%",
          onToggle: (self) => {
            glow.style.opacity = self.isActive ? "1" : "0";
          },
        });
      }

      ScrollTrigger.refresh();

      if (!reduced) {
        safetyTimeout = setTimeout(() => {
          if (gsap.ticker.frame < 4) {
            gsap.set([".hero-word", "[data-hero-el]", "[data-reveal]"], {
              clearProps: "opacity,transform",
            });
          }
        }, 1600);
      }

      cleanup.push(() => {
        if (safetyTimeout) clearTimeout(safetyTimeout);
        ScrollTrigger.getAll().forEach((t) => t.kill());
        if (tickerFn) gsap.ticker.remove(tickerFn);
        lenis?.destroy();
      });
    })();

    return () => cleanup.forEach((fn) => fn());
  }, []);

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

      {/* NAV */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "22px 40px",
          backdropFilter: "blur(8px)",
          background:
            "linear-gradient(180deg,rgba(14,13,11,.85),rgba(14,13,11,0))",
        }}
      >
        <a
          href="#top"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            textDecoration: "none",
          }}
        >
          <span
            style={{
              position: "relative",
              width: 16,
              height: 16,
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
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: ORANGE,
                transform: "translate(-50%,-50%)",
              }}
            />
          </span>
          <span
            style={{
              fontFamily: ANTON,
              fontSize: 22,
              letterSpacing: ".04em",
              color: TEXT,
              lineHeight: 1,
            }}
          >
            GENORA
          </span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
          <Hoverable
            as="a"
            href="#intro"
            style={linkStyle}
            hoverStyle={{ color: TEXT }}
          >
            Intro
          </Hoverable>
          <Hoverable
            as="a"
            href="#features"
            style={linkStyle}
            hoverStyle={{ color: TEXT }}
          >
            Features
          </Hoverable>
          <Hoverable
            as="a"
            href="#platforms"
            style={linkStyle}
            hoverStyle={{ color: TEXT }}
          >
            Platforms
          </Hoverable>
          <Hoverable
            as="a"
            href="#pricing"
            style={linkStyle}
            hoverStyle={{ color: TEXT }}
          >
            Pricing
          </Hoverable>
          <Magnetic
            as="a"
            href="#cta"
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: INK,
              background: ORANGE,
              padding: "9px 16px",
              borderRadius: 2,
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Get access
          </Magnetic>
        </div>
      </nav>

      {/* HERO */}
      <section
        id="top"
        data-screen-label="Hero"
        style={{ position: "relative", zIndex: 1 }}
      >
        <div id="heroSection" style={{ position: "relative" }}>
          <div
            id="heroPin"
            style={{
              position: "relative",
              height: "100vh",
              minHeight: 760,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <div
              data-hero-el=""
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 26,
              }}
            >
              <span style={{ width: 26, height: 1, background: ORANGE }} />
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: ".28em",
                  textTransform: "uppercase",
                  color: ORANGE,
                }}
              >
                Writing-first content engine
              </span>
              <span style={{ width: 26, height: 1, background: ORANGE }} />
            </div>

            <h1
              style={{
                margin: 0,
                textAlign: "center",
                fontFamily: ANTON,
                fontWeight: 400,
                fontSize: "clamp(46px,8.4vw,132px)",
                lineHeight: 0.92,
                letterSpacing: ".005em",
                textTransform: "none",
              }}
            >
              <span className="hero-word" style={{ display: "inline-block" }}>
                Write
              </span>{" "}
              <span className="hero-word" style={{ display: "inline-block" }}>
                once.
              </span>
              <br />
              <span className="hero-word" style={{ display: "inline-block" }}>
                Say
              </span>{" "}
              <span className="hero-word" style={{ display: "inline-block" }}>
                it
              </span>{" "}
              <span
                className="hero-word"
                style={{ display: "inline-block", position: "relative" }}
              >
                everywhere
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: ".06em",
                    height: 6,
                    background: ORANGE,
                  }}
                />
              </span>
              <span
                className="hero-word"
                style={{ display: "inline-block", color: ORANGE }}
              >
                .
              </span>
            </h1>

            <p
              data-hero-el=""
              style={{
                maxWidth: 640,
                textAlign: "center",
                margin: "26px auto 0",
                fontSize: 17,
                lineHeight: 1.55,
                color: MUTED2,
              }}
            >
              One raw thought in — a platform-native post out for{" "}
              <span style={{ color: TEXT }}>LinkedIn</span>,{" "}
              <span style={{ color: TEXT }}>X</span>,{" "}
              <span style={{ color: TEXT }}>Reddit</span>,{" "}
              <span style={{ color: TEXT }}>Medium</span> &{" "}
              <span style={{ color: TEXT }}>Substack</span>. No copy-paste. No
              re-writing five times.
            </p>

            <div
              id="heroStage"
              style={{
                position: "relative",
                marginTop: 52,
                width: "100%",
                maxWidth: 520,
                height: 230,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                id="heroNote"
                style={{
                  position: "relative",
                  zIndex: 5,
                  width: 420,
                  background: CARD,
                  border: "1px solid rgba(242,238,231,.14)",
                  borderRadius: 6,
                  padding: "22px 24px",
                  boxShadow: "0 30px 80px -30px rgba(0,0,0,.8)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: ORANGE,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      letterSpacing: ".2em",
                      textTransform: "uppercase",
                      color: MUTED,
                    }}
                  >
                    raw_thought.txt
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15.5,
                    lineHeight: 1.6,
                    color: "#D8D2C7",
                    fontFamily: GROTESK,
                  }}
                >
                  shipped a feature <span style={{ color: MUTED }}>nobody</span>{" "}
                  asked for → became our{" "}
                  <span style={{ color: ORANGE }}>most-used</span> one. building
                  for yourself is underrated?
                </p>
                <span
                  style={{
                    position: "absolute",
                    left: -6,
                    top: -6,
                    width: 14,
                    height: 14,
                    borderLeft: `1.5px solid ${ORANGE}`,
                    borderTop: `1.5px solid ${ORANGE}`,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: -6,
                    top: -6,
                    width: 14,
                    height: 14,
                    borderRight: `1.5px solid ${ORANGE}`,
                    borderTop: `1.5px solid ${ORANGE}`,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: -6,
                    bottom: -6,
                    width: 14,
                    height: 14,
                    borderLeft: `1.5px solid ${ORANGE}`,
                    borderBottom: `1.5px solid ${ORANGE}`,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: -6,
                    bottom: -6,
                    width: 14,
                    height: 14,
                    borderRight: `1.5px solid ${ORANGE}`,
                    borderBottom: `1.5px solid ${ORANGE}`,
                  }}
                />
              </div>

              <div
                id="heroAnnotate"
                style={{
                  position: "absolute",
                  zIndex: 6,
                  left: "calc(50% + 230px)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  pointerEvents: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: ORANGE,
                      boxShadow: `0 0 6px ${ORANGE}`,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      letterSpacing: ".1em",
                      color: MUTED,
                    }}
                  >
                    1 input
                  </span>
                </div>
                <div
                  style={{
                    width: 1,
                    height: 34,
                    marginLeft: 2,
                    background:
                      "repeating-linear-gradient(#8A8378 0 3px,transparent 3px 7px)",
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: ORANGE,
                      boxShadow: `0 0 6px ${ORANGE}`,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      letterSpacing: ".1em",
                      color: MUTED,
                    }}
                  >
                    5 outputs
                  </span>
                </div>
              </div>

              {FLY_CARDS.map((f, i) => (
                <div
                  key={f.label}
                  className="hero-fly"
                  data-fly={i}
                  style={{
                    position: "absolute",
                    zIndex: 4,
                    width: 150,
                    borderRadius: 8,
                    padding: 12,
                    opacity: 0,
                    boxShadow: "0 20px 50px -20px rgba(0,0,0,.7)",
                    ...f.style,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 7,
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: f.iconRadius,
                        background: f.iconBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 12,
                        border: i === 1 ? "1px solid #333" : undefined,
                      }}
                    >
                      {i === 1 ? "X" : null}
                    </span>
                    <span
                      style={{
                        fontFamily: i === 3 ? "Georgia, serif" : MONO,
                        fontSize: i === 3 ? 9 : 8,
                        letterSpacing: i === 3 ? undefined : ".12em",
                        color: f.labelColor,
                        textTransform: i === 3 ? undefined : "uppercase",
                      }}
                    >
                      {f.label}
                    </span>
                  </div>
                  <div
                    style={{
                      height: f.bar1.h,
                      width: f.bar1.w,
                      background: f.barBg,
                      borderRadius: 3,
                      marginBottom: 4,
                    }}
                  />
                  <div
                    style={{
                      height: 5,
                      width: f.bar2.w,
                      background: f.barBg,
                      borderRadius: 3,
                    }}
                  />
                </div>
              ))}
            </div>

            <div
              id="scrollCue"
              style={{
                position: "absolute",
                bottom: 26,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                animation: "cueBob 2.2s ease-in-out infinite",
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: ".22em",
                  textTransform: "uppercase",
                  color: MUTED,
                }}
              >
                Scroll
              </span>
              <span
                style={{
                  width: 1,
                  height: 26,
                  background: `linear-gradient(${ORANGE},transparent)`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* AI / SLOP GUARD */}
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
          Then <span style={{ color: ORANGE }}>Slop Guard</span> reads it one
          last time and throws out the parts that sound like a robot doing an
          impression of you.
        </p>

        <div
          data-reveal=""
          onMouseEnter={() => setSlopHover(true)}
          onMouseLeave={() => setSlopHover(false)}
          style={{
            marginTop: 56,
            position: "relative",
            background: "#141109",
            border: "1px solid rgba(242,238,231,.12)",
            borderRadius: 8,
            padding: "34px 34px 30px",
            cursor: "crosshair",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: ".2em",
                textTransform: "uppercase",
                color: MUTED,
              }}
            >
              hover to run Slop Guard
            </span>
            {slopHover ? (
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                  color: TEAL,
                }}
              >
                ✓ shipped
              </span>
            ) : (
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                  color: RED,
                }}
              >
                ⚠ flagged
              </span>
            )}
          </div>
          {!slopHover ? (
            <p
              style={{
                margin: 0,
                fontSize: 22,
                lineHeight: 1.5,
                color: "#7C7568",
                fontFamily: GROTESK,
              }}
            >
              &quot;In today&apos;s fast-paced digital landscape, it&apos;s more
              important than ever to leverage synergies and unlock your true
              potential. Let&apos;s dive in! 🚀&quot;
            </p>
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: 22,
                lineHeight: 1.5,
                color: TEXT,
                fontFamily: GROTESK,
              }}
            >
              &quot;I built a thing nobody asked for. It&apos;s now the reason
              people pay us. Turns out scratching your own itch scales better
              than a roadmap.&quot;
            </p>
          )}
          <div
            style={{
              position: "absolute",
              right: 20,
              bottom: 16,
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: ORANGE,
              boxShadow: `0 0 10px ${ORANGE}`,
            }}
          />
        </div>
      </section>

      {/* PLATFORM SHOWCASE */}
      <section
        id="platforms"
        data-screen-label="Platforms"
        style={{ position: "relative", zIndex: 1, padding: "40px 0 130px" }}
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
          id="platRail"
          style={{
            display: "flex",
            gap: 26,
            overflowX: "auto",
            padding: "12px 40px 30px",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <TiltCard
            style={{
              scrollSnapAlign: "center",
              flex: "0 0 auto",
              width: 360,
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
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  Jordan Reyes
                </div>
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
              The lesson wasn&apos;t &quot;ignore users.&quot; It was: the
              sharpest signal is your own frustration, used daily. Build for the
              operator you already are 👇
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
              scrollSnapAlign: "center",
              flex: "0 0 auto",
              width: 360,
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
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  Jordan Reyes
                </div>
                <div style={{ fontSize: 12, color: "#71767b" }}>
                  @jreyes · 1/5
                </div>
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
              scrollSnapAlign: "center",
              flex: "0 0 auto",
              width: 360,
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
                <div
                  style={{ fontSize: 11, color: "#787c7e", marginBottom: 8 }}
                >
                  <b style={{ color: "#1a1a1a" }}>r/SaaS</b> · Posted by
                  u/jreyes · 3h
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
                  Long-time lurker. Quick story + the counterintuitive takeaway
                  on building for yourself vs. chasing feature requests. Happy
                  to answer questions in the comments.
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
              scrollSnapAlign: "center",
              flex: "0 0 auto",
              width: 360,
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
              scrollSnapAlign: "center",
              flex: "0 0 auto",
              width: 360,
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
              didn&apos;t build, and why it changed how I think about listening
              to users…
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

          <div style={{ flex: "0 0 40px" }} />
        </div>
        <div
          style={{
            maxWidth: 1180,
            margin: "6px auto 0",
            padding: "0 40px",
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "#5f594f",
          }}
        >
          ← drag / scroll the rail →
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how"
        data-screen-label="How it works"
        style={{
          position: "relative",
          zIndex: 1,
          padding: "110px 40px 40px",
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
          04 — How it works
        </div>
        <h2
          data-reveal=""
          style={{
            margin: "0 0 60px",
            fontFamily: ANTON,
            fontWeight: 400,
            fontSize: "clamp(34px,5vw,68px)",
            lineHeight: 1,
            maxWidth: "14ch",
          }}
        >
          From messy note to shipped, in one lane.
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div
            data-reveal=""
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 300px",
              gap: 28,
              alignItems: "center",
              padding: "34px 0",
              borderTop: "1px solid rgba(242,238,231,.1)",
            }}
          >
            <span
              style={{
                fontFamily: ANTON,
                fontSize: 52,
                color: ORANGE,
                lineHeight: 1,
              }}
            >
              01
            </span>
            <div>
              <h3 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 600 }}>
                Write the raw thought
              </h3>
              <p
                style={{
                  margin: 0,
                  color: MUTED,
                  fontSize: 15,
                  lineHeight: 1.55,
                  maxWidth: "44ch",
                }}
              >
                Lowercase, half-formed, one sentence — however it falls out of
                your head. That&apos;s the whole job.
              </p>
            </div>
            <div
              style={{
                position: "relative",
                background: CARD,
                border: "1px solid rgba(242,238,231,.12)",
                borderRadius: 6,
                padding: 16,
                fontFamily: MONO,
                fontSize: 12,
                color: MUTED2,
              }}
            >
              shipped a feature nobody asked for…
              <span
                style={{
                  display: "inline-block",
                  width: 7,
                  height: 14,
                  background: ORANGE,
                  marginLeft: 2,
                  verticalAlign: "middle",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: -6,
                  top: -6,
                  width: 12,
                  height: 12,
                  borderLeft: `1.5px solid ${ORANGE}`,
                  borderTop: `1.5px solid ${ORANGE}`,
                }}
              />
            </div>
          </div>

          <div
            data-reveal=""
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 300px",
              gap: 28,
              alignItems: "center",
              padding: "34px 0",
              borderTop: "1px solid rgba(242,238,231,.1)",
            }}
          >
            <span
              style={{
                fontFamily: ANTON,
                fontSize: 52,
                color: ORANGE,
                lineHeight: 1,
              }}
            >
              02
            </span>
            <div>
              <h3 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 600 }}>
                Slop Guard gate
              </h3>
              <p
                style={{
                  margin: 0,
                  color: MUTED,
                  fontSize: 15,
                  lineHeight: 1.55,
                  maxWidth: "44ch",
                }}
              >
                Before anything fans out, the guard checks for clichés, filler
                and hollow hype. Nothing generic gets through.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: RED,
                  fontFamily: MONO,
                }}
              >
                <span>⚠</span> &quot;leverage synergies&quot; — cut
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: RED,
                  fontFamily: MONO,
                }}
              >
                <span>⚠</span> &quot;in today&apos;s landscape&quot; — cut
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: TEAL,
                  fontFamily: MONO,
                }}
              >
                <span>✓</span> voice preserved — pass
              </div>
            </div>
          </div>

          <div
            data-reveal=""
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 300px",
              gap: 28,
              alignItems: "center",
              padding: "34px 0",
              borderTop: "1px solid rgba(242,238,231,.1)",
            }}
          >
            <span
              style={{
                fontFamily: ANTON,
                fontSize: 52,
                color: ORANGE,
                lineHeight: 1,
              }}
            >
              03
            </span>
            <div>
              <h3 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 600 }}>
                Fan-out generation
              </h3>
              <p
                style={{
                  margin: 0,
                  color: MUTED,
                  fontSize: 15,
                  lineHeight: 1.55,
                  maxWidth: "44ch",
                }}
              >
                Writer drafts, Critic pushes back, Reviser lands it — in
                parallel, once per platform you picked.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  padding: "6px 9px",
                  border: "1px solid #0A66C2",
                  color: "#4a9fe0",
                  borderRadius: 3,
                }}
              >
                LinkedIn
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  padding: "6px 9px",
                  border: "1px solid #71767b",
                  color: "#c9ced2",
                  borderRadius: 3,
                }}
              >
                X
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  padding: "6px 9px",
                  border: "1px solid #FF4500",
                  color: "#ff7a45",
                  borderRadius: 3,
                }}
              >
                Reddit
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  padding: "6px 9px",
                  border: "1px solid #888",
                  color: "#cfcac0",
                  borderRadius: 3,
                }}
              >
                Medium
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  padding: "6px 9px",
                  border: "1px solid #FF6719",
                  color: "#ff8f4d",
                  borderRadius: 3,
                }}
              >
                Substack
              </span>
            </div>
          </div>

          <div
            data-reveal=""
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 300px",
              gap: 28,
              alignItems: "center",
              padding: "34px 0",
              borderTop: "1px solid rgba(242,238,231,.1)",
              borderBottom: "1px solid rgba(242,238,231,.1)",
            }}
          >
            <span
              style={{
                fontFamily: ANTON,
                fontSize: 52,
                color: ORANGE,
                lineHeight: 1,
              }}
            >
              04
            </span>
            <div>
              <h3 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 600 }}>
                Review &amp; publish
              </h3>
              <p
                style={{
                  margin: 0,
                  color: MUTED,
                  fontSize: 15,
                  lineHeight: 1.55,
                  maxWidth: "44ch",
                }}
              >
                Approve, nudge a line, or schedule. If one platform&apos;s post
                fails, the rest still ship — retry only what broke.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 12,
                  fontFamily: MONO,
                  color: TEAL,
                }}
              >
                <span>LinkedIn</span>
                <span>✓ published</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 12,
                  fontFamily: MONO,
                  color: TEAL,
                }}
              >
                <span>X · Medium · Substack</span>
                <span>✓ scheduled</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 12,
                  fontFamily: MONO,
                  color: ORANGE,
                }}
              >
                <span>Reddit</span>
                <span>↻ retry</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE GRID */}
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,1fr)",
            gap: 18,
          }}
        >
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

      {/* CTA / FOOTER */}
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
            {!submitted ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.trim()) setSubmitted(true);
                }}
                style={{
                  display: "flex",
                  gap: 10,
                  background: CARD,
                  border: "1px solid rgba(242,238,231,.14)",
                  borderRadius: 4,
                  padding: "8px 8px 8px 18px",
                }}
              >
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@company.com"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: TEXT,
                    fontFamily: GROTESK,
                    fontSize: 15,
                  }}
                />
                <Magnetic
                  as="button"
                  type="submit"
                  style={{
                    border: "none",
                    cursor: "pointer",
                    background: ORANGE,
                    color: INK,
                    fontFamily: MONO,
                    fontSize: 12,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    fontWeight: 500,
                    padding: "12px 22px",
                    borderRadius: 3,
                  }}
                >
                  Join waitlist
                </Magnetic>
              </form>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  background: "#12160F",
                  border: "1px solid rgba(42,157,143,.4)",
                  borderRadius: 4,
                  padding: 20,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: TEAL,
                    boxShadow: `0 0 10px ${TEAL}`,
                  }}
                />
                <span style={{ fontSize: 15, color: TEXT }}>
                  You&apos;re on the list — we&apos;ll email{" "}
                  <span style={{ color: ORANGE }}>{email}</span> when your seat
                  opens.
                </span>
              </div>
            )}
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
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: MUTED,
                textDecoration: "none",
              }}
              hoverStyle={{ color: TEXT }}
            >
              Intro
            </Hoverable>
            <Hoverable
              as="a"
              href="#platforms"
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: MUTED,
                textDecoration: "none",
              }}
              hoverStyle={{ color: TEXT }}
            >
              Platforms
            </Hoverable>
            <Hoverable
              as="a"
              href="#features"
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: MUTED,
                textDecoration: "none",
              }}
              hoverStyle={{ color: TEXT }}
            >
              Features
            </Hoverable>
            <Hoverable
              as="a"
              href="#cta"
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: MUTED,
                textDecoration: "none",
              }}
              hoverStyle={{ color: TEXT }}
            >
              Access
            </Hoverable>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <Hoverable
              as="a"
              href="#top"
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: MUTED,
                textDecoration: "none",
              }}
              hoverStyle={{ color: ORANGE }}
            >
              X
            </Hoverable>
            <Hoverable
              as="a"
              href="#top"
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: MUTED,
                textDecoration: "none",
              }}
              hoverStyle={{ color: ORANGE }}
            >
              LinkedIn
            </Hoverable>
            <Hoverable
              as="a"
              href="#top"
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: MUTED,
                textDecoration: "none",
              }}
              hoverStyle={{ color: ORANGE }}
            >
              GitHub
            </Hoverable>
          </div>
        </footer>
      </section>
    </div>
  );
}
