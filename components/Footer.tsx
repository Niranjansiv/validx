import Link from "next/link";

const footerLinks = [
  "Privacy Policy",
  "Terms of Service",
  "API Docs",
  "Contact Support",
];

export function Footer() {
  return (
    <footer className="w-full py-12 bg-surface-container-lowest border-t border-outline-variant/30 relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-[1440px] mx-auto gap-6">
        <div className="flex flex-col items-center md:items-start">
          <span className="font-headline-lg text-headline-lg text-primary opacity-80 hover:opacity-100 transition-opacity">
            ValidX
          </span>
          <span className="font-label-caps text-label-caps text-on-surface-variant mt-2 text-xs">
            © 2024 ValidX. All rights reserved.
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {footerLinks.map((l) => (
            <Link
              key={l}
              href="#"
              className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100"
            >
              {l}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
