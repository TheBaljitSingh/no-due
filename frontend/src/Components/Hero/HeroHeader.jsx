import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import IntroButtons from "./IntroButtons";
import Analytics from "./Analytics";

gsap.registerPlugin(ScrollTrigger);

const HeroHeader = () => {
  const root = useRef(null);
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const text32Ref = useRef(null);
  const text4Ref = useRef(null);
  const buttonsRef = useRef(null);
  const glowRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      // ─── Line mask reveal ───────────────────────────────────────────
      // Each headline line slides up from y:100% inside an overflow:hidden wrapper.
      // This is the classic agency-grade reveal — smooth, clean, premium.
      tl.from([line1Ref.current, line2Ref.current], {
        yPercent: 105,
        opacity: 0,
        duration: 1,
        stagger: 0.18,
        ease: "power3.out",
      })
        .from(
          text32Ref.current,
          {
            y: 40,
            opacity: 0,
            scale: 0.95,
            duration: 0.9,
            ease: "back.out(1.4)",
          },
          "-=0.55",
        )
        .from(text4Ref.current, { y: 24, opacity: 0, duration: 0.75 }, "-=0.5")
        .from(
          buttonsRef.current.children,
          {
            opacity: 0,
            y: 32,
            scale: 0.93,
            duration: 0.65,
            stagger: 0.12,
            ease: "back.out(1.6)",
          },
          "-=0.4",
        );

      // ─── Ambient floating glow ──────────────────────────────────────
      gsap.to(glowRef.current, {
        y: -18,
        scale: 1.1,
        duration: 3.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // ─── Subtle scroll parallax on headline block ───────────────────
      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom top",
        scrub: 1.2,
        onUpdate: (self) => {
          gsap.set([line1Ref.current, line2Ref.current], {
            y: self.progress * 55,
          });
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={root}
      className="backgroundtwo rounded-full py-8 z-20 relative overflow-hidden"
    >
      {/* Ambient glow orb */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[320px] rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, #14b8a6 0%, #0ea5e9 55%, transparent 80%)",
          willChange: "transform",
        }}
      />

      <div className="relative z-10">
        <div className="space-y-2 mb-12">
          {/*
            Each line is wrapped in overflow:hidden so the text
            slide-up stays clipped — the agency mask-reveal technique.
          */}
          <div className="overflow-hidden">
            <h1
              ref={line1Ref}
              className="font-bold uppercase text-3xl md:text-6xl lg:text-7xl leading-tight"
              style={{ willChange: "transform" }}
            >
              Recover Payments Faster with
            </h1>
          </div>

          <div className="overflow-hidden">
            <h2
              ref={line2Ref}
              className="font-bold uppercase text-3xl md:text-6xl lg:text-7xl leading-tight primary-gradient-text"
              style={{ willChange: "transform" }}
            >
              Smart Automation
            </h2>
          </div>

          <h2
            ref={text32Ref}
            className="flex-col mt-[2vw] font-bold uppercase text-3xl leading-tight secondary-gradient-text items-center justify-center gap-4"
          >
            <Analytics />
          </h2>

          <p
            ref={text4Ref}
            className="text-lg md:text-2xl text-gray-400 mt-6 font-normal"
            style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
          >
            NODUE helps you save time, reduce staff costs, and get paid on time.
          </p>
        </div>

        <div ref={buttonsRef} className="flex justify-center z-50 items-center">
          <IntroButtons />
        </div>
      </div>
    </div>
  );
};

export default HeroHeader;
