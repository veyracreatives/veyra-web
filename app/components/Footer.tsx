export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-8 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 text-sm text-white/40 sm:flex-row sm:items-center">
        <p style={{ fontFamily: "var(--font-mono)" }}>
          © {new Date().getFullYear()} Veyra Creatives &amp; Digital Lab
        </p>
        <div className="flex gap-6" style={{ fontFamily: "var(--font-mono)" }}>
          <a 
            href="https://www.instagram.com/veyracdl_25?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="transition hover:text-white"
          >
            Instagram
          </a>
        </div>
      </div>
    </footer>
  );
}