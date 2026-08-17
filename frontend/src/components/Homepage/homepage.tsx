import React from "react";
import HomepageHeader from "../../components/Homepage/Header";
import ClientLogos from "./Clientlogo";
import About from "./About";
import WhyChoose from "./WhyChoose";
import MessageFromMD from "./Mdmessage";
import PremiumServices from "./Service";
import PremiumVehicles from "./vehicles";
import Testimonials from "./Testimonials";
import Footer from "./Footer";
import TeamSection from "./TeamSection";

const HomePage: React.FC = () => (
  <div>

    {/* FIXED HEADER */}
    <div id="home">
      <HomepageHeader />
    </div>

    {/* ⭐ GLOBAL WRAPPER → ONLY ONE PADDING HANDLES EVERYTHING ⭐ */}
<div className="pt-[40px] md:pt-[60px] space-y-12">

      <div id="about"><About /></div>

      <MessageFromMD />

      <WhyChoose />

      <div id="services"><PremiumServices /></div>

      <div id="portfolio"><PremiumVehicles /></div>

      <div id="clients"><ClientLogos /></div>

      <TeamSection />

      <Testimonials />

    </div>

   <div id="contact"><Footer /></div>


  </div>
);

export default HomePage;
