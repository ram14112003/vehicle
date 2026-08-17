
import IconPlay from "../components/assets/Footer/Footer/download-cropped.svg";
import Logo from "../../../assets/logo.png";
import IconFacebook from "../../../assets/Footer/facebook.png";
import IconInsta from "../../../assets/Footer/insta.png";
import IconLinkedIn from "../../../assets/Footer/in.png";
import IconPhone from "../../../assets/Footer/phone.png";
import IconMail from "../../../assets/Footer/mail.png";
import FooterBg from "../../../assets/Footer/footer.png";
import FooterMobileBg from "../../../assets/Footer/Maskgroup.png";
import PlayStoreIcon from "../../../assets/Footer/google-play-badge.png";  // example file

import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <div className="w-full px-3 sm:px-4 md:px-8 lg:px-1 -mt-5 pb-4 py-5">

      {/* MAIN FOOTER CARD */}
     <div
  className=" footer-desktop-bg w-full text-white bg-no-repeat bg-top pt-10 sm:pt-12 md:pt-12 lg:pt-16 pb-5 md:rounded-3xl bg-[length:100%_100%] /* <-- WHITE SPACE FIX */ "
  style={{ backgroundImage: `url(${FooterMobileBg})` }}
>

        <style>
          {`
            @media (min-width: 768px) {
              .footer-desktop-bg {
                background-image: url(${FooterBg}) !important; /* Desktop background */
              }
            }
          `}
        </style>

        {/* FOOTER CONTENT WRAPPER */}
        <div className="px-6 sm:px-10 lg:px-12 w-full mx-auto max-w-[1200px] md:px-1.5">

          {/* TOP ROW */}
          <div className="
            flex flex-col md:flex-row 
            justify-between 
            items-center md:items-start lg:items-center 
            gap-6
          ">
            <img
              src={Logo}
              className="
    object-contain

    /* MOBILE */
    h-8              /* smaller height */
    w-auto
    mr-0             /* fully left */
    -mt-6            /* move up */
    self-start

    /* TABLET */
    sm:h-10
    sm:-mt-8

    /* 🖥 DESKTOP */
    sm:h-14
    md:h-15 md:w-39 md:pr-6 md:pb-[39px]
    lg:h-35 lg:w-75 lg:-mt-15 lg:-ml-24
  "
            />



            {/* Heading */}
            <div className="flex flex-col items-center md:items-start lg:items-start lg:-mt-19 lg:ml-28">
              <h2
                className="
                  text-xl sm:text-2xl
                  md:text-[22px]    
                  lg:text-4xl 
                  font-bold leading-tight 
                  text-center md:text-left
                  md:mr-3
                "
              >
                Creating extraordinary <br /> travel experiences.
              </h2>
            </div>

            {/* Social Icons */}
            <div className="flex flex-col items-center md:items-start lg:items-start gap-3 -mt-1 lg:-mt-15 lg:ml-12">
              <p className="
                text-yellow-300 font-bold mb-2 text-base md:ml-5
              ">
                CONNECT WITH US
              </p>

              <div className="flex items-center gap-5 sm:gap-6 mt-1 lg:ml-6">
                <img src={IconFacebook} className="w-6 sm:w-7 md:w-7 lg:w-9" />
                <img src={IconInsta} className="w-6 sm:w-7 md:w-7 lg:w-9" />
                <img src={IconLinkedIn} className="w-6 sm:w-7 md:w-7 lg:w-9" />
              </div>
            </div>
          </div>
          {/* MOBILE ONLY LINE */}
          <div className="block md:hidden w-full h-[1px] bg-white/30 mt-5 mb-2"></div>

          {/* White Line */}
          <div className="hidden lg:block w-[calc(90%-120px)] lg:ml-[310px] h-[2px] bg-white/30"></div>
        </div>

      <>
  {/* ⭐ TAB ONLY STYLES (768–1020px) ⭐ */}
  <style>
    {`
      @media (min-width: 768px) and (max-width: 1020px) {
        .tab-small-text { font-size: 13px !important; }
        .tab-small-heading { font-size: 14px !important; }
        .tab-tight { line-height: 1.2 !important; }
        .tab-w-85 { width: 85% !important; }
      }
    `}
  </style>

  {/* MIDDLE SECTION */}
  <div
    className="
      grid grid-cols-1 
      md:grid-cols-3      /* ⭐ Always 3 columns from tablet & above */
      gap-6 
      px-4 sm:px-6 lg:px-10
      mt-5
      text-[14px]
    "
  >

    {/* HEAD OFFICE */}
    <div className="md:text-left text-center flex flex-col items-center md:items-start">
      <p className="text-yellow-300 font-bold mb-1 text-base tab-small-heading">
        HEAD OFFICE
      </p>

      <p className="opacity-95 leading-relaxed tab-tight tab-small-text tab-w-85">
        7/621, Nesamani Nagar Ext Road, <br />
        Perumbakam, Sholinganallur, <br />
        Chennai 600100, Tamil Nadu
      </p>
    </div>

    {/* READY TO QUERY */}
    <div className="text-center md:text-left flex flex-col items-center md:items-start">
      <p className="text-yellow-300 font-bold mb-1 text-base tab-small-heading">
        READY TO QUERY
      </p>

      {/* MOBILE VIEW */}
      <div className="md:hidden">
        <div className="flex items-start gap-2">
          <img src={IconPhone} className="w-6 h-6 mt-1" />
          <p className="text-sm opacity-95">
            +91 98417 22675 / +91 90032 41571
          </p>
        </div>
        <div className="flex items-start gap-2 -mt-1">
          <img src={IconPhone} className="w-6 h-6 opacity-0" />
          <p className="text-sm opacity-95">+91 89250 72675</p>
        </div>
      </div>

      {/* TABLET + LAPTOP */}
      <div className="hidden md:flex items-center gap-2 mb-1">
        <img src={IconPhone} className="w-6 cursor-pointer" />
        <p className="opacity-95 whitespace-nowrap tab-small-text">
          +91 98417 22675 / +91 90032 41571 / +91 89250 72675
        </p>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <img src={IconMail} className="w-6 h-6" />
        <a
          href="mailto:traveledesk@gracecabs.com"
          className="hover:text-yellow-300 transition tab-small-text"
        >
          traveledesk@gracecabs.com
        </a>
      </div>
    </div>

    {/* CAB BOOKING APP */}
    <div className="flex flex-col text-center md:text-left items-center md:items-start gap-1 w-full lg:pl-40">
      <p className="text-yellow-300 font-bold mb-1 text-base tab-small-heading">
        CAB BOOKING APP
      </p>

      <img
        src={PlayStoreIcon}
        className="
          w-32 h-20 md:w-20 md:h-20 lg:w-36 lg:h-24
          object-contain cursor-pointer hover:scale-110 transition 
          -mt-2
          tab-small-text
        "
      />
    </div>

  </div>
</>


        {/* BRANCHES + LINKS */}
        <div className="px-4 sm:px-6 lg:px-12 mt-0 text-[14px]">

          {/* 👉 MOBILE VIEW ONLY */}
          <div className="md:hidden text-center mt-0">

            <p className="text-yellow-300 font-bold mb-2 text-base">
              BRANCHES
            </p>

            <p className="text-sm opacity-90 mb-4">
              Oragadam &nbsp; | &nbsp; Periyapalayam &nbsp; | &nbsp; Pallikaranai
            </p>
            {/* MOBILE VIEW — All in ONE ROW */}
            {/* <p className="md:hidden text-sm opacity-90 whitespace-nowrap">
      Oragadam &nbsp; | &nbsp; Periyapalayam &nbsp; | &nbsp; Pallikaranai
    </p> */}
            {/* Links — stacked exactly like your design */}
            <div className="flex flex-col items-center gap-3">

              <div className="flex gap-6">
                <a href="/TermsAndConditions" className="text-sm hover:text-yellow-300 transition">
                  Terms & Conditions
                </a>
                <a href="/PrivacyPolicy" className="text-sm hover:text-yellow-300 transition">
                  Privacy Policy
                </a>
              </div>

              <a href="/CancelReservation" className="text-sm hover:text-yellow-300 transition">
                Cancel Reservation
              </a>

            </div>

          </div>


          {/* 👉 DESKTOP VIEW ONLY (unchanged) */}
          <div className="hidden md:flex flex-row justify-between items-center">
            <div className="
  md:text-left md:items-start /* DESKTOP/TABLET: normal */
 ">
              <p className="text-yellow-300 font-bold mb-2 text-base">BRANCHES</p>
              <p className="text-sm sm:text-base opacity-90">
                Oragadam | Periyapalayam | Pallikaranai
              </p>
            </div>

            <div className="flex items-center gap-4 lg:gap-15 lg:mr-75">
              <a href="/TermsAndConditions" className="text-sm md:text-[15px] hover:text-yellow-300 transition">
                Terms & Conditions
              </a>
              <a href="/PrivacyPolicy" className="text-sm md:text-[15px] hover:text-yellow-300 transition">
                Privacy Policy
              </a>
              <a href="/CancelReservation" className="text-sm md:text-[15px] hover:text-yellow-300 transition">
                Cancel Reservation
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/30 mx-4 sm:mx-6 lg:mx-12 mt-8 mb-4"></div>

{/* COPY RIGHT SECTION */}
       <div className="text-center text-[12px] sm:text-[14px] opacity-80">
  © {new Date().getFullYear()} GraceCabs.in. All Rights Reserved.
</div>

      </div>
    </div>
  );
}
