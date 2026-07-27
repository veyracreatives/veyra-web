import Link from "next/link";
export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0B0D12]/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
        <a href="/" className="flex items-center gap-1.5 select-none">
          <span
            className="text-xl tracking-tight"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            VEYRA
          </span>
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#D6FF3F]" />
        </a>

        <nav
          className="hidden items-center gap-9 text-[13px] uppercase tracking-[0.12em] text-white/60 md:flex"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <a href="/#work" className="transition hover:text-white">Work</a>

          <a href="/about" className="transition hover:text-white">About us</a>
          <a href="/#contact" className="transition hover:text-white">Contact</a>
        </nav>

        <a
          href="/#contact"
          className="hidden rounded-full border border-white/15 px-5 py-2 text-[13px] text-white/85 transition hover:border-[#D6FF3F]/60 hover:bg-[#D6FF3F] hover:text-black md:block"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Start a project
        </a>
      </div>
    </header>
  );
}