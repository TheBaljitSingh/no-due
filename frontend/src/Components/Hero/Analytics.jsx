import React, { useEffect, useRef } from "react";
import { siteAnalysis } from "../../utils/constants";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";

gsap.registerPlugin(ScrollTrigger);

/**
 * Parse a stat string like "98%", "2x", "10K+" into its numeric value
 * and suffix so we can animate the number separately.
 */
const parseStat = (raw) => {
  const match = String(raw).match(/^([\d.]+)(.*)$/);
  if (!match) return { start: 0, end: 0, suffix: raw };
  return { start: 0, end: parseFloat(match[1]), suffix: match[2] };
};

const StatPill = ({ stat, index }) => {
  const numRef = useRef(null);
  const pillRef = useRef(null);
  const { start, end, suffix } = parseStat(stat.data);
  const isNumeric = end !== 0;

  useEffect(() => {
    if (!isNumeric || !numRef.current) return;

    const obj = { val: start };

    ScrollTrigger.create({
      trigger: pillRef.current,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          val: end,
          duration: 1.8,
          ease: "power2.out",
          delay: index * 0.12,
          onUpdate: () => {
            if (numRef.current) {
              // Show one decimal if original had one, else integer
              const formatted =
                end % 1 !== 0 ? obj.val.toFixed(1) : Math.round(obj.val);
              numRef.current.textContent = formatted + suffix;
            }
          },
        });
      },
    });
  }, [end, index, isNumeric, start, suffix]);

  return (
    <motion.div
      ref={pillRef}
      initial={{ opacity: 0, y: 30, scale: 0.88 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{
        duration: 0.55,
        delay: index * 0.1,
        ease: [0.34, 1.56, 0.64, 1], // spring-like
      }}
      className="flex mr-5 justify-center items-center gap-3 lg:gap-4 rounded-full bg-gradient-to-br from-gray-900 to-gray-950 px-5 py-3 lg:px-6 lg:py-3.5 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-800/50 backdrop-blur-sm w-full lg:w-auto"
      style={{ willChange: "transform, opacity" }}
      whileHover={{ scale: 1.06, y: -3, transition: { duration: 0.25 } }}
    >
      <div className="leading-tight whitespace-nowrap">
        <div className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-50 to-gray-100 bg-clip-text text-transparent">
          {isNumeric ? <span ref={numRef}>{start + suffix}</span> : stat.data}
        </div>
        <div className="text-xs sm:text-sm uppercase tracking-wider text-gray-400 font-medium">
          {stat.name}
        </div>
      </div>
    </motion.div>
  );
};

const Analytics = () => (
  <div className="flex flex-col lg:flex-row justify-center items-center gap-3 lg:gap-4 p-4 w-full max-w-4xl mx-auto">
    {siteAnalysis.map((stat, i) => (
      <StatPill key={stat.name} stat={stat} index={i} />
    ))}
  </div>
);

export default Analytics;
