"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Home", href: "/" },
  { label: "Upload", href: "/upload" },
  { label: "History", href: "/history" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/10 backdrop-blur-[20px] border-b border-primary/20 shadow-[0px_0px_20px_rgba(0,240,255,0.1)] transition-all duration-300 ease-in-out">
      <div className="flex justify-between items-center max-w-[1440px] mx-auto px-8 h-20">
        {/* Brand */}
        <Link
          href="/"
          className="font-display-lg text-[32px] leading-tight text-primary drop-shadow-[0_0_10px_rgba(0,219,233,0.8)] tracking-tight font-bold"
        >
          Valid<span className="neon-text-glow">X</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-2">
          {links.map(({ label, href }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`font-label-caps text-label-caps uppercase tracking-widest px-4 py-2 rounded transition-all duration-200 ${
                  active
                    ? "text-primary border-b-2 border-primary"
                    : "text-on-surface-variant hover:text-primary hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(0,219,233,0.4)]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <Link
          href="/upload"
          className="btn-primary text-on-primary px-6 py-3 rounded-lg font-label-caps text-label-caps uppercase tracking-widest font-bold shadow-lg"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}
