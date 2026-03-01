import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Cards = ({ reasons }) => {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const cards = containerRef.current.querySelectorAll(".card-item");

      // ─── Scroll-triggered stagger entrance ────────────────────────
      gsap.from(cards, {
        opacity: 0,
        y: 70,
        scale: 0.88,
        duration: 0.65,
        stagger: 0.09,
        ease: "back.out(1.4)",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 82%",
          once: true,
        },
      });

      // ─── GSAP hover micro-interactions ───────────────────────────
      cards.forEach((card) => {
        const onEnter = () => {
          gsap.to(card, {
            y: -7,
            scale: 1.025,
            boxShadow: "0 16px 40px -8px rgba(20,184,166,0.22)",
            duration: 0.3,
            ease: "power2.out",
          });
        };
        const onLeave = () => {
          gsap.to(card, {
            y: 0,
            scale: 1,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            duration: 0.4,
            ease: "elastic.out(1, 0.55)",
          });
        };

        card.addEventListener("mouseenter", onEnter);
        card.addEventListener("mouseleave", onLeave);

        // stored on element for cleanup
        card._onEnter = onEnter;
        card._onLeave = onLeave;
      });

      return () => {
        cards.forEach((card) => {
          card.removeEventListener("mouseenter", card._onEnter);
          card.removeEventListener("mouseleave", card._onLeave);
        });
      };
    }, containerRef);

    return () => ctx.revert();
  }, [reasons]);

  if (reasons.length === 0) {
    return <p className="text-sm text-gray-500">No reasons to show yet.</p>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div
        ref={containerRef}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {reasons.map((r, idx) => (
          <div
            key={idx}
            className="card-item group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white/80 backdrop-blur-sm shadow-sm"
            style={{ willChange: "transform, box-shadow" }}
          >
            {/* Accent bar */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500"
            />

            <div className="p-5">
              {r.icon && (
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-600">
                  {r.icon}
                </div>
              )}

              <h3 className="text-base font-semibold text-gray-900">
                {r.reason || r.feature}
              </h3>

              {r.description && (
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {r.description}
                </p>
              )}
            </div>

            {/* Soft teal glow — CSS keeps it as a subtle ambient layer */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-20 rounded-[3rem] bg-gradient-to-tr from-teal-100 via-emerald-100 to-green-100 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-30"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cards;
