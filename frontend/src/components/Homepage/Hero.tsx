import React from "react";

export default function Hero() {
  // uses vehicles-hero.png in public/assets
  return (
    <section className="relative max-w-full">
      <div className="relative overflow-hidden rounded-tr-[80px] bg-white">
        {/* purple top shape using bg image + overlay */}
        <div className="absolute inset-0 hero-gradient pointer-events-none" style={{ height: 220, top: 0 }} />

        {/* hero content container */}
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="text-white md:text-left">
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-white drop-shadow-lg">
                Corporate Commute,
                <span className="block text-brandPurple bg-white/10 inline-block rounded-md px-1">Elevated.</span>
              </h1>
              <p className="mt-4 text-lg text-white/90 max-w-xl">
                Implies a premium, superior service level for professionals.
              </p>

              <div className="mt-6 flex gap-4">
                <button className="bg-brandYellow text-black px-5 py-3 rounded-lg font-semibold shadow">Book a Free Demo →</button>
                <button className="border border-white text-white px-5 py-3 rounded-lg">Attach your Vehicle</button>
              </div>
            </div>

            {/* hero image block */}
            <div className="relative">
              {/* decorative top purple corner (optional) */}
              <div className="absolute -top-24 -right-20 w-[420px] h-[180px] rounded-bl-[60px] bg-gradient-to-r from-brandPurple/90 to-transparent opacity-90 hidden lg:block" />

              <div className="rounded-lg overflow-hidden shadow-2xl">
                <img
                  src="/assets/vehicles-hero.png"
                  alt="fleet"
                  className="w-full object-cover md:h-[320px] lg:h-[380px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* large background photo extended under with mask (desktop) */}
        <div className="hidden lg:block absolute right-0 top-[140px] transform translate-x-10">
          <img
            src="/assets/header-bg1.png"
            alt="building"
            className="w-[820px] h-auto object-cover opacity-40"
          />
        </div>
      </div>
    </section>
  );
}
