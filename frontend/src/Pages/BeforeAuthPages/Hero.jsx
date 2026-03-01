import React from "react";
import HeroHeader from "../../Components/Hero/HeroHeader";
import Pricing from "../../Components/Hero/Pricing";
import WhyToBuy from "../../Components/Hero/WhyToBuy";
import Features from "../../Components/Hero/Features";

const Hero = () => {
  return (
    <div className=" w-full  text-center">
      <section className="mt-10 px-5  md:mt-20 grid place-items-center">
        <HeroHeader />
      </section>
      <section className="min-h-[50vh] mt-10  flex items-center justify-center">
        <WhyToBuy />
      </section>
      <section
        id="features"
        className="min-h-[50vh] mt-10  flex items-center justify-center"
      >
        <Features />
      </section>
      <section
        id="pricing"
        className="min-h-[50vh]  flex items-center justify-center"
      >
        <Pricing />
      </section>
    </div>
  );
};

export default Hero;
