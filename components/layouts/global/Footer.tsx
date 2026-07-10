"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full h-[70px] bg-[#1F2A44] hidden md:flex items-center font-inter">
      <div className="max-w-[1170px] w-full mx-auto flex items-center justify-between px-4">
        <span className="text-[15px] font-normal text-[#E5E8E8] leading-[36px]">
          COPYRIGHT © 2026 WINDOR VERIFICATIONS, LLC. - ALL RIGHTS RESERVED.
        </span>

        <div className="flex items-center gap-[30px]">
          <Link
            href="/privacy-policy"
            className="text-[15px] font-normal text-[#E5E8E8] leading-[36px] hover:text-white transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-[15px] font-normal text-[#E5E8E8] leading-[36px] hover:text-white transition-colors"
          >
            Term & Services
          </Link>
        </div>
      </div>
    </footer>
  );
}
