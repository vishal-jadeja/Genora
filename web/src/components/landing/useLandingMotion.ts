import { useEffect } from "react";

export function useLandingMotion() {
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
}
