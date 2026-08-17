import React, { useState, useEffect } from "react";

import Banner from "../../assets/hero.png";
import Logo from "../../assets/logo.png";
import PhoneIcon from "../../assets/phone.png";
import MailIcon from "../../assets/mail.png";
import LoginIcon from "../../assets/login.png";
import SupportIcon from "../../assets/support.png";
import YellowBg from "../../assets/bgyellow.png";
import MobileYellow from "../../assets/header/mobileyellow.png";
import MobileMail from "../../assets/header/mobilemail.png";
import MobilePhone from "../../assets/header/phonemobileicon.png";
import MobileHero from "../../assets/header/mobilehero.png";
import { useNavigate } from "react-router-dom";
import mobilesuppoticon from "../../assets/header/supportmobile.png"
import MobileToggleIcon from "../../assets/header/Group 21.png"
import mobilelogo from "../../assets/header/mobilelogo.png"

export default function HeaderHero() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSize, setMobileSize] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);

useEffect(() => {
  const handleScroll = () => {
    setIsScrolled(window.scrollY > 10);
  };

  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

const scrollToSection = (id: string) => {
  const section = document.getElementById(id);
  if (!section) return;

  // Detect correct header height based on screen + scroll
  let headerHeight;

  if (window.innerWidth < 768) {
    // MOBILE
    headerHeight = isScrolled ? 80 : 150; 
  } else {
    // DESKTOP
    headerHeight = isScrolled ? 80 : 120;
  }

  const elementPosition =
    section.getBoundingClientRect().top + window.pageYOffset;

  const offsetPosition = elementPosition - headerHeight;

  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth",
  });
};

const navigate = useNavigate();

const [isScrolled, setIsScrolled] = useState(false);
useEffect(() => {
  const handleScroll = () => {
    setIsScrolled(window.scrollY > 20);
  };
  window.addEventListener("scroll", handleScroll);
  const handleResize = () => setMobileSize(window.innerWidth);
  window.addEventListener("resize", handleResize);
  return () => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("resize", handleResize);
  };
}, []);



return (
  <div className="bg-white p-[3px] md:p-[6px] rounded-bl-[45px] rounded-br-[45px]">

    {/* -------------------------------------------------- */}
    {/* ⭐⭐⭐ MOBILE VIEW SECTION (Only for <768px) ⭐⭐⭐ */}
    {/* -------------------------------------------------- */}
<section className="relative w-full min-h-[650px] block md:hidden bg-white">

{/* ⭐ FIXED FIGMA YELLOW BAR — PERFECT SIZE & ALIGNMENT */}
<div
  className={`
    fixed top-0 left-0 w-full h-[60px] z-[300]
    transition-all duration-300
    ${isScrolled ? "bg-white shadow-md" : ""}
  `}
>
  <img
    src={MobileYellow}
    className="absolute top-0 left-0 w-full h-full object-cover object-top"
    alt="yellow"
  />

  <div
    className="
      absolute inset-0 
      flex items-center 
      justify-center
      yb-wrapper 
      px-2 
      gap-3
      translate-y-[-3px]   /* ⭐ ICON ROW MELAA THALLI */
    "
  >

    {/* SUPPORT ICON – BIGGER + SUPER CLEAR + BOLD FEEL */}
    <div className="flex items-center gap-1">
    <img
  src={mobilesuppoticon}
  className="yb-support-icon object-contain"
  alt="support"
/>

    </div>

   {/* PHONE */}
<a
  href="tel:+919841722675"
  className="flex items-center gap-1"
>
  <img
    src={MobilePhone}
    className="yb-icon object-contain"
    alt="phone"
  />
  <span className="text-[#221C84] yb-text whitespace-nowrap font-bold">
    +91 98417 22675
  </span>
</a>


   {/* MAIL */}
<a
  href="mailto:traveldesk@gracecabs.com"
  className="flex items-center gap-1"
>
  <img
    src={MobileMail}
    className="yb-icon object-contain"
    alt="mail"
  />
  <span className="text-[#221C84] yb-text whitespace-nowrap font-bold">
    traveldesk@gracecabs.com
  </span>
</a>


  </div>
</div>


{/* ⭐ 2. LOGO + TOGGLE (ONLY toggle changes color) */}
<div
  className={`
    fixed top-[60px] left-0 w-full h-[60px] 
    px-4 flex justify-between items-center 
    transition-all duration-300 z-[350]
    ${isScrolled ? "bg-white shadow-md" : "bg-transparent"}
  `}
>
  {/* LOGO — NO COLOR CHANGE */}
  <img
    src={Logo}
    className="h-11 w-auto object-contain  mb-3"
     onClick={() => scrollToSection("home")}
    alt="Logo"
  />

  {/* TOGGLE BUTTON */}
  <button onClick={() => setMenuOpen(!menuOpen)}>
    {menuOpen ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke={isScrolled ? "#2C2474" : "white"}   // 🔥 ONLY TOGGLE CHANGES
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ) : (
      <img
        src={MobileToggleIcon}
        className={`w-8 h-8 transition-all duration-300 
          ${isScrolled ? "brightness-0 invert-[18%]" : ""}
        `}
        alt="menu"
      />
    )}
  </button>
</div>


{/* ⭐ CENTER POPUP MENU - FULL SCREEN OVERLAY LIKE FIGMA */}
{/* FULL SCREEN POPUP */}
<div
  className={`
    fixed inset-0 
    z-[500]
    flex justify-center items-center
    transition-all duration-300
    ${menuOpen ? "opacity-100 visible" : "opacity-0 invisible"}
  `}
>

  {/* DARK OVERLAY */}
  <div 
    className={`
      absolute inset-0 
      bg-black/60 
      backdrop-blur-sm
      ${menuOpen ? "opacity-100" : "opacity-0"}
    `}
    onClick={() => setMenuOpen(false)}
  ></div>

{/* POPUP CARD */}
<div
  className={`
    relative z-[600]
    bg-white 
    w-[85%] max-w-[380px]
    rounded-xl shadow-xl 
    p-6
    max-h-none
    overflow-visible
    transform transition-all duration-300
    mt-[-20px]                  /* ⭐ popup slightly upward */
    ${menuOpen ? "scale-100" : "scale-50"}
  `}
>


  {/* LOGO */}
  <div className="flex justify-center mb-4">
    <img src={Logo} className="h-12 w-auto" />
  </div>

  {/* MENU ITEMS */}
  <div className="flex flex-col text-[20px] font-semibold text-[#221C84]">

    <span onClick={() => { scrollToSection("home"); setMenuOpen(false); }} className="py-4 border-b cursor-pointer">Home</span>
    <span onClick={() => { scrollToSection("about"); setMenuOpen(false); }} className="py-4 border-b cursor-pointer">About</span>
    <span onClick={() => { scrollToSection("services"); setMenuOpen(false); }} className="py-4 border-b cursor-pointer">Services</span>
    <span onClick={() => { scrollToSection("portfolio"); setMenuOpen(false); }} className="py-4 border-b cursor-pointer">Portfolio</span>
    <span onClick={() => { scrollToSection("contact"); setMenuOpen(false); }} className="py-4 border-b cursor-pointer">Contact</span>

    <div className="mt-6">
      <button
        onClick={() => navigate("/fromdata")}
        className="w-full px-5 py-3 rounded-full font-semibold text-[18px] bg-[#FFEC00] text-[#122163]"
      >
        Attach Car To Company
      </button>
    </div>

    <div className="mt-4">
      <button
        onClick={() => navigate("/adminlogin")}
        className="w-full px-5 py-3 rounded-full font-semibold text-[18px] border-2 border-[#122163] text-[#122163] bg-transparent"
      >
        Login
      </button>
    </div>

  </div>

  {/* ⭐ CLOSE BUTTON - ATTACHED TO POPUP BOTTOM CENTER ⭐ */}
<button
  onClick={() => setMenuOpen(false)}
  className="
    absolute left-1/2 -translate-x-1/2 
    -bottom-10      /* ⭐ moved further down */
    w-10 h-10 
    bg-white rounded-full 
    shadow-xl 
    flex items-center justify-center
  "
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-5 h-5 text-[#2C2474]"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="2"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
</button>
</div>
</div>




  {/* ⭐ 3. HERO SECTION — BG IMAGE moved up */}
  <div
    className="w-full"
    style={{
      backgroundImage: `url(${MobileHero})`,
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",

      /* 🔥 BG image konjam MELAA */
      backgroundPosition: "center 40px",

      minHeight: "760px",
    }}
  >
   <div className="pt-[180px] px-5">

  {/* --- FIRST LINE --- */}
  <h1 className="text-white text-[34px] font-extrabold leading-tight">
    Corporate Commute,
  </h1>

  {/* --- SECOND LINE WITH PURPLE BG --- */}
  <span
    className="inline-block mt-1 font-extrabold text-white"
    style={{
      backgroundColor: "#2C2474",
      padding: "6px 10px",
      fontSize: "34px",
      borderRadius: "4px",
      lineHeight: "1.1",
    }}
  >
    Elevated.
  </span>

  {/* SUBTEXT */}
  <p className="text-white/90 text-[15px] mt-4 max-w-[260px] leading-snug">
    Implies a premium, superior service level for professionals.
  </p>
</div>

  </div>
<style>
{`
  /* 320px — smallest devices */
  @media (max-width: 340px) {
    .yb-support-icon { width: 26px !important; height: 26px !important; }  /* bigger */
    .yb-icon { width: 16px !important; height: 16px !important; }
    .yb-text { font-size: 10px !important; font-weight: 700 !important; }
    .yb-wrapper { gap: 6px !important; }
  }

  /* 375px devices — SUPPORT ICON BIGGER */
  @media (min-width: 341px) and (max-width: 399px) {
    .yb-support-icon { width: 34px !important; height: 34px !important; }  /* ⭐ bigger */
    .yb-icon { width: 18px !important; height: 18px !important; }
    .yb-text { font-size: 12px !important; font-weight: 700 !important; }
    .yb-wrapper { gap: 10px !important; }
  }

  /* 425-475px — SUPPORT ICON EVEN BIGGER */
  @media (min-width: 400px) {
    .yb-support-icon { width: 40px !important; height: 40px !important; } /* ⭐ MAX SIZE */
    .yb-icon { width: 22px !important; height: 22px !important; }
    .yb-text { font-size: 14px !important; font-weight: 800 !important; }
    .yb-wrapper { gap: 14px !important; }
  }

  /* TAB + SMALL LAPTOP VIEW FIX (768px – 1440px) */
@media (min-width: 768px) and (max-width: 1440px) {
  .hero-tab-fix {
    background-position: center top !important; 
    background-size: contain !important; 
    background-repeat: no-repeat !important;
    height: 680px !important;
  }
}

/* 1024px – 1160px: IMAGE CUT FIX */
@media (min-width: 1024px) and (max-width: 1160px) {
  .hero-1024-fix {
    background-size: contain !important;
    background-position: top center right  !important;
    background-repeat: no-repeat !important;
    height: 680px !important;
  }
    /* 1024px – 1160px : LOGO ALIGN + SIZE FIX */
@media (min-width: 1024px) and (max-width: 1160px) {
  .logo  {
    height: 40px !important;      /* size reduce */
    margin-left: 10px !important; /* move left */
  }
}

`}
</style>



</section>



 
{/* -------------------------------------------------- */}
{/* ⭐⭐⭐ DESKTOP / LAPTOP VIEW — EXACT FIGMA LOOK ⭐⭐⭐ */}
{/* -------------------------------------------------- */}

<section className="relative hidden lg:block w-full">


  {/* ⭐ HERO BANNER FULL WIDTH + CURVED TOP ⭐ */}
 <div
  className="
    relative w-full rounded-t-[45px] overflow-hidden 
    pt-[120px] lg:h-[750px] md:h-[700px] h-[680px]  bg-[length:100%_100%]  hero-tablet-fix

  "
  style={{
    backgroundImage: `url(${Banner})`,
    backgroundSize: "100% auto",   // ⭐ Prevent crop
    backgroundRepeat: "no-repeat",
    backgroundPosition: "top center",

  }}
>


    {/* ⭐ HEADER OVERLAY ⭐ */}
{/* ⭐ FIXED DESKTOP HEADER ⭐ */}
<div
  className={`
    fixed top-0 left-0 w-full z-[200] 
    transition-all duration-300
    ${isScrolled ? "bg-white shadow-lg" : "bg-transparent"}
  `}
>

      {/* ⭐ TOP YELLOW BAR — EVEN MORE RIGHT ⭐ */}
<div
  className="w-full h-[58px] pr-32 flex items-center justify-end"
 
>
  {/* Content visible only when NOT scrolled */}
  {!isScrolled && (
    <div className="flex items-center gap-10 translate-y-[6px]">

      <img src={SupportIcon} className="w-19 h-11" />

      <div className="flex items-center gap-3">
        <img src={PhoneIcon} className="w-6 h-6" />
        <span className="text-white font-semibold text-[16px]">
          +91 98417 22675
        </span>
      </div>

      <div className="flex items-center gap-3">
        <img src={MailIcon} className="w-6 h-6" />
        <span className="text-white font-semibold text-[16px]">
          traveldesk@gracecabs.com
        </span>
      </div>
<button
  onClick={() => {
    navigate("/adminlogin");
    window.scrollTo(0, 0);   // ⭐ Page top ku pogum
  }}
 className={`px-4 py-1.5 rounded-md text-sm font-medium border 
  transition-all duration-300 transform
  ${
    isScrolled
      ? "border-[#2F1C84] text-[#2F1C84]"
      : "border-yellow-400 text-yellow-400"
  }
  hover:scale-110 hover:bg-white/10
`}

>
  Login
</button>
    </div>
  )}
</div>



      {/* ⭐ NAV BAR — RIGHT MARGIN ADDED ⭐ */}
      <div className="w-full flex items-center justify-between px-12 pr-20 mt-[-3px]">

        {/* LOGO SMALL + LEFT PERFECT */}
        <img
          src={Logo}
          className="h-[55px] w-auto  translate-y-[-20px] m2-5 logo "
           onClick={() => scrollToSection("home")}
        />

        {/* MENU — RIGHT SIDE GAP MATCH */}
<div
  className={`
    flex items-center gap-10 font-semibold  mr-6
    ${isScrolled ? "translate-y-[-12px]" : "translate-y-[6px]"}
    ${isScrolled ? "text-[#2C2474]" : "text-white"}
  `}
>


        <button onClick={() => scrollToSection("home")}>Home</button>
                  <button onClick={() => scrollToSection("about")}>About</button>
                  <button onClick={() => scrollToSection("services")}>Services</button>
                  <button onClick={() => scrollToSection("portfolio")}>Portfolio</button>
                  <button onClick={() => scrollToSection("contact")}>Contact</button>

{isScrolled && (
  <button
    onClick={() => {
      navigate("/adminlogin");
      window.scrollTo(0, 0);
    }}
    className={`px-4 py-1.5 rounded-md text-sm font-medium border 
      transition-all duration-300 transform
      border-[#2F1C84] text-[#2F1C84]
      hover:scale-110 hover:bg-white/10
    `}
  >
    Login
  </button>
)}

{!isScrolled && (
  <button
    onClick={() => {
      navigate("/fromdata");
      window.scrollTo(0, 0);
    }}
    className={`px-4 py-1.5 rounded-md text-sm font-medium border 
      transition-all duration-300 transform
      bg-[#FFEC00] text-blue-900 border-[#FFEC00]
      hover:scale-105 hover:-translate-y-1 hover:shadow-lg
    `}
  >
    ATTACH CAR TO COMPANY
  </button>
)}

{isScrolled && (
  <button
    onClick={() => {
      navigate("/fromdata");
      window.scrollTo(0, 0);
    }}
    className={`px-4 py-1.5 rounded-md text-sm font-medium border 
      transition-all duration-300 transform
      bg-[#FFEC00] text-blue-900 border-[#FFEC00]
      hover:scale-105 hover:-translate-y-1 hover:shadow-lg
    `}
  >
    ATTACH CAR TO COMPANY
  </button>
)}
        </div>

      </div>

    </div>

    {/* ⭐ HERO TEXT BLOCK ⭐ */}
<div className="absolute top-[160px] left-[80px] max-w-[800px] z-[20]">

<h1
  className="
    text-white
    font-extrabold 
    leading-[1.1]

    text-[55px]      
    md:text-[65px]   
    lg:text-[75px]   

    tracking-[-0.5px]
    max-w-[1650px]      /* ⭐ EXTRA LENGTH */
  "
>
  Corporate Commute,
  <span className="block text-[#2F1C84] font-extrabold">
    Elevated.
  </span>
</h1>


 <p className="text-black/95 text-[18px] mt-4">
  Implies a premium, superior service level 
  <span className="block">for professionals.</span>
</p>

</div>


  </div>
</section>




{/* ⭐⭐ TABLET VIEW — 768px TO 1220px ⭐⭐ */}
<section className="relative hidden md:block lg:hidden w-full">

  {/* ⭐ BG WRAPPER ⭐ */}
 {/* ⭐ BG WRAPPER ⭐ */}
<div
  className="
    relative w-full overflow-hidden 
    pt-[490px]        /* ⭐ correct spacing */
    min-h-[580px]     /* ⭐ banner correct height */
    h-auto            /* ⭐ removes unwanted white gap */
    rounded-t-[40px]
  "
  style={{
    backgroundImage: `url(${Banner})`,
    backgroundSize: "cover",
backgroundPosition: "left -80px top",  // ⭐ shifts image to left
    backgroundRepeat: "no-repeat",
  }}
>



    {/* ⭐ 1. YELLOW BAR (only when NOT scrolled) ⭐ */}
    {!isScrolled && (
      
       <div
  className="
    fixed top-0 right-0
    h-[50px]
    flex items-center justify-end
    pr-[30px] 
    z-[600]

    /* ⭐ width reduced and aligned to menu */
    w-[60%]
  "

>
  <div className="flex items-center gap-2">
    <img src={SupportIcon} className="w-9 h-6" />

    <div className="flex items-center gap-2 whitespace-nowrap">
  <img src={PhoneIcon} className="w-3 h-3" />
  <span className="text-white text-[13px] font-medium leading-none">
    +91 98417 22675
  </span>
</div>


 <div className="flex items-center gap-2 whitespace-nowrap">
  <img src={MailIcon} className="w-3 h-3" />
  <span className="text-white text-[13px] font-medium leading-none">
    traveldesk@gracecabs.com
  </span>
</div>
<button
    onClick={() => {
      navigate("/adminlogin");
      window.scrollTo(0, 0);
    }}
  className={`
    px-4 py-1 rounded-md text-[13px] border transition-all duration-300
    ${
      isScrolled
        ? "border-[#2C2474] text-[#2C2474]"
        : "border-yellow-300 text-yellow-300"
    }
  `}
>
  Login
</button>

  </div>
</div>

    )}

    {/* ⭐ 2. HEADER (scroll sticky) ⭐ */}
    <div
      className={`
        fixed ${isScrolled ? "top-0" : "top-[50px]"} 
        left-0 w-full
        z-[650]
        flex justify-between items-center
        px-6 py-3
        transition-all duration-300
        ${isScrolled ? "bg-white shadow-md" : "bg-transparent"}
      `}
    >

      {/* ⭐ LOGO — SCROLL LOGIC ⭐ */}
     {/* ⭐ LOGO — FIXED PROPER ALIGNMENT ⭐ */}
<img
  src={Logo}
  className={`
    w-auto transition-all duration-300

    /* ⭐ Normal (not scrolled) — PERFECT POSITION */
    ${!isScrolled ? "h-[50px] w-[200px] mr-[6px] mt-[-80px]" : ""}

    /* ⭐ Scrolled (white header) — SMALL NEAT */
    ${isScrolled ? "h-[34px] ml-[20px] mt-[0px]" : ""}
  `}
  onClick={() => scrollToSection("home")}
/>


      {/* ⭐ MENU ⭐ */}
<div
  className={`
    flex items-center gap-5 
    font-semibold text-[14px]
    ml-[10px]        /* ⭐ Less left margin → moves left */
    justify-start     /* ⭐ Align left fully */
    transition-all duration-300
    ${isScrolled ? "text-[#2C2474]" : "text-white"}
  `}
>


        <button onClick={() => scrollToSection("home")}>Home</button>
        <button onClick={() => scrollToSection("about")}>About</button>
        <button onClick={() => scrollToSection("services")}>Services</button>
        <button onClick={() => scrollToSection("portfolio")}>Portfolio</button>
        <button onClick={() => scrollToSection("contact")}>Contact</button>

        {/* ⭐ LOGIN BUTTON — SCROLL COLOR CHANGE ⭐ */}
{!isScrolled && (
  <button
    onClick={() => {
      navigate("/fromdata");
      window.scrollTo(0, 0);
    }}
    className="
      px-2 py-1.5 rounded-md text-[11px] font-medium border 
      transition-all duration-300 transform
      bg-[#FFEC00] text-blue-900 border-[#FFEC00]
      hover:scale-105 hover:-translate-y-1 hover:shadow-lg
    "
  >
    ATTACH CAR TO COMPANY
  </button>
)}

{isScrolled && (
  <button
    onClick={() => {
      navigate("/fromdata");
      window.scrollTo(0, 0);
    }}
    className="
      px-2 py-1.5 rounded-md text-[11px] font-medium border 
      transition-all duration-300 transform
      bg-[#FFEC00] text-blue-900 border-[#FFEC00]
      hover:scale-105 hover:-translate-y-1 hover:shadow-lg
    "
  >
    ATTACH CAR TO COMPANY
  </button>
)}
{isScrolled && (
  <button
    onClick={() => {
      navigate("/adminlogin");
      window.scrollTo(0, 0);
    }}
    className="
      px-4 py-1 rounded-md text-[13px] border transition-all duration-300
      border-[#2C2474] text-[#2C2474]
    "
  >
    Login
  </button>
)}

      </div>
    </div>

    {/* ⭐ HERO TEXT ⭐ */}
    <div className="absolute top-[200px] left-[55px] max-w-[600px]">
      <h1 className="text-white font-extrabold leading-tight text-[40px] ">
        Corporate Commute,
        <span className="block text-[#2F1C84]">Elevated.</span>
      </h1>

      <p className="text-black text-[16px] mt-4  max-w-[360px]">
        Implies a premium, superior 
        <pre>service level for professionals.</pre>
      </p>
    </div>
  </div>
</section>







</div>
);

}
