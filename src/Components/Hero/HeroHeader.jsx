import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import SplitText from "gsap/SplitText"; 
import IntroButtons from "./IntroButtons";
import Analytics from "./Analytics";

gsap.registerPlugin(SplitText);


const HeroHeader = () => {
    const root = useRef(null);
    const text1Ref = useRef(null);
    const text2Ref = useRef(null);
    const text3Ref = useRef(null);
    const text4Ref = useRef(null);
    const text32Ref = useRef(null);
    const buttonsRef = useRef(null);
  
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
          const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    
          // Split text1 into characters
          const text1 = text1Ref.current;
          const chars = text1.textContent.split('').map((char) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.display = 'inline-block';
            return span;
          });
          text1.textContent = '';
          chars.forEach(span => text1.appendChild(span));
    
          // Animation sequence with smooth, elegant animations
          tl.from(chars, {
            yPercent: -120,
            opacity: 0,
            rotationX: -90,
            duration: 0.8,
            ease: "power4.out",
            stagger: 0.015,
          })
          .from(text2Ref.current, {
            x: -100,
            opacity: 0,
            rotationY: -45,
            transformOrigin: "left center",
            duration: 1,
            ease: "power4.out",
          }, "-=0.4")
          .from(text3Ref.current, {
            x: 100,
            opacity: 0,
            rotationY: 45,
            transformOrigin: "right center",
            duration: 1,
            ease: "power4.out",
          }, "-=0.8")
          .from(text32Ref.current, {
            y: 1000,
            opacity: 0,
            rotationY: 45,
            transformOrigin: "right center",
            duration: 1,
            ease: "power4.out",
          }, "-=0.8")
          .from(text4Ref.current, {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
          }, "-=0.5")
          .from(buttonsRef.current.children, {
            opacity: 0,
            y: 40,
            scale: 0.95,
            duration: 0.7,
            stagger: 0.1,
            ease: "power3.out"
          }, "-=0.4");
    
        }, root);
    
        return () => ctx.revert();
      }, []);
    
  
    return (
      <div ref={root} className="backgroundtwo rounded-full py-8 z-20">
        <div className="">
          <div className=" space-y-2 mb-12">
            <h1 
              ref={text1Ref}
              className="font-bold uppercase text-3xl md:text-6xl lg:text-7xl  leading-tight"
            >
              Recover Payments Faster with
            </h1>
            <h2 
              ref={text2Ref}
              className="font-bold uppercase text-3xl md:text-6xl lg:text-7xl leading-tight primary-gradient-text"
              
            >
              Smart Automation
            </h2>
            {/* <h2
                ref={text3Ref}
                className="font-bold uppercase text-3xl md:text-6xl lg:text-7xl leading-tight secondary-gradient-text justify-center items-center gap-2"
                >
                Automation
            </h2> */}
            <h2
                ref={text32Ref}
                className="flex-col mt-[2vw] font-bold uppercase text-3xl leading-tight secondary-gradient-text items-center justify-center gap-4"
                >
                <Analytics intervalMs={1800} />
            </h2>
            <p 
              ref={text4Ref}
              className="text-lg md:text-2xl text-gray-400 mt-6 font-normal"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              NODUE helps you save time, reduce staff costs, and get paid on time.
            </p>
          </div>
          
          <div ref={buttonsRef} className="flex justify-center z-50 items-center  ">
            <IntroButtons />
          </div>
        </div>
      </div>
    );
  };
  
  export default HeroHeader;