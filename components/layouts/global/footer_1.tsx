"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

export function Footer1() {
  return (
    <footer className="bg-secondary-new text-white py-[65px] px-6 md:px-20 font-inter w-full">
      <div className="max-w-[1450px] mx-auto w-full">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <Link href="/" className="text-[#e5e8e8] no-underline hover:text-[#339FD0] transition-colors text-[15px] font-medium uppercase">
              HOME
            </Link>
            <Link href="/about-us" className="text-[#e5e8e8] no-underline hover:text-[#339FD0] transition-colors text-[15px] font-medium uppercase">
              ABOUT US
            </Link>
            <Link href="/services" className="text-[#e5e8e8] no-underline hover:text-[#339FD0] transition-colors text-[15px] font-medium uppercase">
              SERVICES
            </Link>
            <Link href="/properties" className="text-[#e5e8e8] no-underline hover:text-[#339FD0] transition-colors text-[15px] font-medium uppercase">
              PROPERTIES
            </Link>
            <Link href="/contact-us" className="text-[#e5e8e8] no-underline hover:text-[#339FD0] transition-colors text-[15px] font-medium uppercase">
              CONTACT US
            </Link>
          </div>

          <div className="text-[15px] flex items-center gap-2.5 uppercase underline text-white font-medium">
                <img src="/assets/ic_round-email_2_blue.png" alt="Instagram" />
            <a href="mailto:  " className="hover:text-[#339FD0] transition-colors">
              INFO@WINDORLLC.COM
            </a>
          </div>
        </div>

        <hr className="border-0 border-t border-white/60 m-0" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 my-12 md:my-20">

          <div className="flex flex-col">
            <h2 className="logo mb-2">
              <Link href="/">
                <img
                  src="/assets/logo.png"
                  alt="Windor Logo"
                  className="w-auto object-contain brightness-0 invert block"
                />
              </Link>
            </h2>
            <p className="text-[#e5e8e8] text-base font-normal leading-[26px] m-0 text-left footer-description">
              We transform upgrade history into verified intelligence— so
              insurers reduce unnecessary payouts, city officials ensure
              compliance, and property owners receive the protection they
              deserve.
            </p>
          </div>

          {/* Column 2 - Support Links */}
          <div className="flex flex-col text-left support">
            <h4 className="mb-[6px] text-[#ffffffee] text-base font-bold uppercase tracking-wider">
              SUPPORT
            </h4>
            <a href="#" className="text-[#e5e8e8] hover:text-[#e5e8e8] no-underline block my-[6px] text-[15px]">
              Help Center
            </a>
            <a href="#" className="text-[#e5e8e8] hover:text-[#e5e8e8] no-underline block my-[6px] text-[15px]">
              Support
            </a>
            <a href="/resources" className="text-[#e5e8e8] hover:text-[#e5e8e8] no-underline block my-[6px] text-[15px]">
              Resources
            </a>
            <a href="/faq" className="text-[#e5e8e8] hover:text-[#e5e8e8] no-underline block my-[6px] text-[15px]">
              FAQs
            </a>
          </div>

          {/* Column 3 - Company Links */}
          <div className="flex flex-col text-left">
            <h4 className="mb-[6px] text-[#ffffffee] text-base font-bold uppercase tracking-wider">
              COMPANY
            </h4>
            <a href="#" className="text-[#e5e8e8] hover:text-[#e5e8e8] no-underline block my-[6px] text-[15px]">
              Blog
            </a>
            <a href="/careers" className="text-[#e5e8e8] hover:text-[#e5e8e8] no-underline block my-[6px] text-[15px]">
              Career
            </a>
            <a href="/properties" className="text-[#e5e8e8] hover:text-[#e5e8e8] no-underline block my-[6px] text-[15px]">
              Sell Property
            </a>
          </div>

          {/* Column 4 - Contact Details */}
          <div className="flex flex-col text-left">
            <h4 className="mb-[10px] text-[#ffffffee] text-base font-bold uppercase tracking-wider">
              CONTACT US
            </h4>
            <p className="text-[15px] text-[#e5e8e8] pb-[15px] pt-[10px] m-0 address">
              HAM LAKE, MN 55449, US
            </p>
            <p className="text-[15px] text-[#e5e8e8] mb-[15px] email">
              <a href="mailto:info@windorllc.com" className="text-[#e5e8e8] hover:text-[#e5e8e8] no-underline">
                info@windorllc.com
              </a>
            </p>

            <div className="flex gap-2.5 mt-0 social">
              <a href="#" aria-label="Facebook" className="inline-block">
                <img src="/assets/entypo-social_facebook-with-circle-blue.png" alt="Facebook" />
              </a>
              <a href="#" aria-label="Instagram" className="inline-block">
                <img src="/assets/mage_instagram-circle-blue.png" alt="Instagram" />
              </a>
            </div>
          </div>
        </div>

        <hr className="border-0 border-t border-white/60 m-0" />

        {/* Footer Bottom Row */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 text-[15px] text-[#e5e8e8]">
          <p className="m-0 text-center sm:text-left">
            Copyright © {new Date().getFullYear()} Windor Verifications, LLC. - All Rights Reserved.
          </p>

          <div className="flex gap-5">
            <Link href="/privacy-policy" className="text-[#e5e8e8] hover:text-[#339FD0] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-[#e5e8e8] hover:text-[#339FD0] transition-colors">
              Term & Services
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
