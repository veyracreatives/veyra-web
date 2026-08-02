"use client";

import { useState } from "react";
import Image from "next/image";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0B0D12]/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10 md:py-7">
        {/* Logo */}
        <a
          href="/"
          aria-label="Veyra — home"
          className="group flex items-center select-none"
          onClick={closeMenu}
        >
          {/* 2:1 frame crops the square's top/bottom white margin → horizontal logo plate */}
          <span className="relative block h-9 aspect-[2/1] overflow-hidden sm:h-10">
            <Image
              src="/veyra_logo.png"
              alt="Veyra"
              fill
              priority
              sizes="96px"
              className="object-cover object-center transition-opacity duration-300 group-hover:opacity-80"
            />
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center gap-10 text-sm uppercase tracking-[0.12em] text-white/60 md:flex"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <a href="/#work" className="transition hover:text-white">Work</a>
          <a href="/about" className="transition hover:text-white">About us</a>
          <a href="/#contact" className="transition hover:text-white">Contact</a>
        </nav>

        {/* Desktop CTA Button */}
        <a
          href="/#contact"
          className="hidden rounded-full border border-white/15 px-6 py-2.5 text-sm text-white/85 transition hover:border-[#D6FF3F]/60 hover:bg-[#D6FF3F] hover:text-black md:block"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Start a project
        </a>

        {/* Mobile Menu Toggle Button */}
        <button
          className="md:hidden text-white/80 hover:text-white transition p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-7 h-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={
                isMenuOpen
                  ? "M6 18L18 6M6 6l12 12"
                  : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              }
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 border-b border-white/[0.06] bg-[#0B0D12]/95 backdrop-blur-xl px-6 py-8 flex flex-col gap-6 shadow-2xl">
          <a
            href="/#work"
            onClick={closeMenu}
            className="text-sm uppercase tracking-[0.12em] text-white/60 hover:text-[#D6FF3F] transition"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Work
          </a>
          <a
            href="/about"
            onClick={closeMenu}
            className="text-sm uppercase tracking-[0.12em] text-white/60 hover:text-[#D6FF3F] transition"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            About us
          </a>
          <a
            href="/#contact"
            onClick={closeMenu}
            className="text-sm uppercase tracking-[0.12em] text-white/60 hover:text-[#D6FF3F] transition"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Contact
          </a>

          <div className="pt-4 border-t border-white/[0.06]">
            <a
              href="/#contact"
              onClick={closeMenu}
              className="flex items-center justify-center w-full rounded-full border border-white/15 px-5 py-3.5 text-sm text-white/85 transition hover:border-[#D6FF3F]/60 hover:bg-[#D6FF3F] hover:text-black"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Start a project
            </a>
          </div>
        </div>
      )}
    </header>
  );
}