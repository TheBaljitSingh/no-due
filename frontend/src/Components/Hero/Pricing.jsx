// Pricing.jsx
import React, { useLayoutEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PricingModel } from "../../utils/constants";

gsap.registerPlugin(ScrollTrigger);

// ─── Card ─────────────────────────────────────────────────────────────────────
const PricingCard = ({ plan, popular = false, currency = "₹", index }) => {
  const hasPrice = typeof plan.pricing === "number";

  return (
    <motion.article
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.55,
        delay: index * 0.1,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      whileHover={{
        y: -6,
        scale: 1.02,
        transition: { duration: 0.22, ease: "easeOut" },
      }}
      className={[
        "relative rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm",
        "transition-shadow duration-300 hover:shadow-lg cursor-default",
        popular ? "outline-2 outline-teal-500" : "",
      ].join(" ")}
      style={{ willChange: "transform, opacity" }}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white shadow">
            Most Popular
          </span>
        </div>
      )}

      <div className="p-6 flex flex-col h-full">
        <header className="mb-4">
          <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
        </header>

        <div className="mb-6">
          {hasPrice ? (
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-blue-500">
                {currency}
                {plan.pricing.toLocaleString("en-IN")}
              </span>
              <span className="text-sm text-slate-500 mb-1">/month</span>
            </div>
          ) : (
            <div className="text-2xl font-semibold text-blue-500">Custom</div>
          )}
        </div>

        <ul className="mb-6 space-y-2 text-left">
          {plan.features.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-slate-700"
            >
              <svg
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 flex-none text-green-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto">
          {hasPrice ? (
            <a
              href="#book-demo"
              className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-teal-600 p-[2px]"
            >
              <span className="w-full rounded-[10px] bg-white px-4 py-2 text-sm font-semibold text-slate-900 text-center">
                Start free trial
              </span>
            </a>
          ) : (
            <a
              href="#contact"
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Contact Sales
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
};

// ─── Grid ─────────────────────────────────────────────────────────────────────
const Pricing = () => {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const subRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headingRef.current, {
        opacity: 0,
        y: 50,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 85%",
          once: true,
        },
      });

      gsap.from(subRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        delay: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: subRef.current,
          start: "top 87%",
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <main
      ref={sectionRef}
      className="mx-auto max-w-7xl mt-12 px-4 sm:px-6 lg:px-8 py-12"
    >
      <div className="text-center">
        <h2
          ref={headingRef}
          className="font-[font4] text-4xl md:text-6xl leading-tight"
        >
          Choose Your{" "}
          <span className="primary-gradient-text">Recovery Plan</span>
        </h2>
        <p
          ref={subRef}
          className="mt-3 font-[font5] text-lg md:text-2xl text-gray-500"
        >
          Start with any plan and upgrade as your business grows. All plans
          include a free trial.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PricingModel.map((plan, i) => (
          <PricingCard
            key={plan.name}
            plan={plan}
            popular={plan.name === "Growth"}
            currency="₹"
            index={i}
          />
        ))}
      </div>
    </main>
  );
};

export default Pricing;
