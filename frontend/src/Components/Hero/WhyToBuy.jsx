import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Cards from "../../utils/Cards";
import { reasons } from "../../utils/constants";

gsap.registerPlugin(ScrollTrigger);

const WhyToBuy = () => {
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
    <div ref={sectionRef}>
      <div className="mx-auto max-w-7xl mt-12 px-4 sm:px-6 lg:px-8 py-12">
        <h2
          ref={headingRef}
          className="font-[font4] text-4xl md:text-6xl leading-tight"
        >
          Chasing payments wastes{" "}
          <span className="primary-gradient-text">time &amp; money</span>
        </h2>
        <p
          ref={subRef}
          className="mt-3 font-[font5] text-lg md:text-2xl text-gray-500"
        >
          Most businesses lose thousands of hours and rupees every year on
          manual payment recovery
        </p>
        <div className="mt-8">
          <Cards reasons={reasons} />
        </div>
      </div>
    </div>
  );
};

export default WhyToBuy;
