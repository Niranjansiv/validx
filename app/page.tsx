"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShaderBackground } from "@/components/ShaderBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const heroWords = ["Validate.", "Clean.", "Download."];

const pipelineSteps = [
  {
    icon: "cloud_upload",
    iconClass: "neon-icon",
    iconWrapClass:
      "border-primary/30 shadow-[0_0_15px_rgba(0,240,255,0.1)] group-hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]",
    label: "Upload CSV",
    desc: "Drop your raw transaction logs securely into our encrypted ingest node.",
    badge: "STEP 01",
    badgeClass: "text-primary bg-primary/10 border-primary/20",
  },
  {
    icon: "memory",
    iconClass: "text-secondary drop-shadow-[0_0_8px_rgba(236,178,255,0.8)]",
    iconWrapClass:
      "border-secondary/30 shadow-[0_0_15px_rgba(236,178,255,0.1)] group-hover:shadow-[0_0_20px_rgba(236,178,255,0.4)]",
    label: "Validate Data",
    desc: "Our engine parses, structures, and cross-references entries against defined schemas.",
    badge: "STEP 02",
    badgeClass: "text-secondary bg-secondary/10 border-secondary/20",
  },
  {
    icon: "download",
    iconClass:
      "text-tertiary-fixed drop-shadow-[0_0_8px_rgba(107,255,131,0.8)]",
    iconWrapClass:
      "border-tertiary/30 shadow-[0_0_15px_rgba(219,255,215,0.1)] group-hover:shadow-[0_0_20px_rgba(107,255,131,0.4)]",
    label: "Download Clean File",
    desc: "Export sanitized, error-free datasets ready for downstream processing.",
    badge: "STEP 03",
    badgeClass: "text-tertiary-fixed bg-tertiary-fixed/10 border-tertiary-fixed/20",
  },
];

const featureCards = [
  {
    icon: "psychology",
    iconClass: "text-primary",
    wrapClass: "bg-primary/10 border-primary/20",
    title: "AI-Powered Parsing",
    titleHover: "group-hover:text-primary",
    desc: "Intelligent models adapt to irregular formatting and predict field mapping with high confidence.",
    span: 1,
    extra: null,
  },
  {
    icon: "speed",
    iconClass: "text-secondary",
    wrapClass: "bg-secondary/10 border-secondary/20",
    title: "Real-time Verification",
    titleHover: "group-hover:text-secondary",
    desc: "Streaming validation validates entries as they hit the buffer, reducing processing time for massive datasets.",
    span: 2,
    extra: (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
        <span className="font-code-sm text-xs text-secondary">LIVE</span>
      </div>
    ),
  },
  {
    icon: "report",
    iconClass: "text-error",
    wrapClass: "bg-error/10 border-error/20",
    title: "Instant Error Reports",
    titleHover: "group-hover:text-error",
    desc: "Pinpoint discrepancies instantly. Generate comprehensive JSON or CSV reports detailing exact rows, columns, and anomaly types.",
    span: 2,
    extra: (
      <span className="font-code-sm text-xs text-error">CRITICAL</span>
    ),
  },
  {
    icon: "security",
    iconClass: "text-tertiary-fixed",
    wrapClass: "bg-tertiary-fixed/10 border-tertiary-fixed/20",
    title: "Cloud-Native Security",
    titleHover: "group-hover:text-tertiary-fixed",
    desc: "Zero-trust architecture. Data is encrypted in transit and at rest, processed in ephemeral containers.",
    span: 1,
    extra: null,
  },
  {
    icon: "layers",
    iconClass: "text-primary-container",
    wrapClass: "bg-primary-container/10 border-primary-container/20",
    title: "Bulk Processing",
    titleHover: "group-hover:text-primary-container",
    desc: "Handle files up to 50GB. Our distributed worker nodes chew through massive logs efficiently.",
    span: 1,
    extra: null,
  },
  {
    icon: "api",
    iconClass: "text-secondary-fixed",
    wrapClass: "bg-secondary-fixed/10 border-secondary-fixed/20",
    title: "API Integration",
    titleHover: "group-hover:text-secondary-fixed",
    desc: "RESTful and GraphQL endpoints available. Integrate the validation engine directly into your CI/CD pipeline.",
    span: 1,
    extra: null,
  },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-x-hidden min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
      {/* Shader background — z-0 so it sits above the body background, same as upload page */}
      <div className="fixed inset-0 w-full h-full z-0 opacity-40 pointer-events-none">
        <ShaderBackground className="absolute inset-0 w-full h-full" />
      </div>

      <Navbar />

      <main className="relative z-10 pt-24 pb-8">
        {/* ── Hero ── */}
        <section className="max-w-[1440px] mx-auto px-8 py-10 flex flex-col lg:flex-row items-center justify-between relative z-10 gap-10">
          {/* Text */}
          <div className="lg:w-1/2 flex flex-col items-start gap-5 z-20">
            <h1 className="font-display-lg text-[clamp(32px,5vw,48px)] leading-tight text-primary">
              {heroWords.map((word, i) => (
                <motion.span
                  key={word}
                  className="inline-block mr-3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.25, duration: 0.6, ease: "easeOut" }}
                  style={{ textShadow: "0 0 15px rgba(0, 240, 255, 0.6)" }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p
              className="text-on-surface-variant text-lg max-w-xl font-body-md border-l-2 border-primary/30 pl-4"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              Professional transaction data validation at the speed of light.
              Premium accuracy for the modern enterprise.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 mt-2 w-full sm:w-auto"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <Link
                href="/upload"
                className="btn-primary text-on-primary px-8 py-4 rounded-lg font-label-caps text-label-caps uppercase tracking-wider font-bold flex items-center justify-center gap-2"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  bolt
                </span>
                Start Validating
              </Link>
              <button
                className="btn-secondary px-8 py-4 rounded-lg font-label-caps text-label-caps uppercase tracking-wider font-bold flex items-center justify-center gap-2"
                onClick={() =>
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <span className="material-symbols-outlined">play_arrow</span>
                View Demo
              </button>
            </motion.div>

            {/* Status indicator */}
            <motion.div
              className="mt-4 flex items-center gap-2 font-code-sm text-code-sm text-tertiary opacity-80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 1.3 }}
            >
              <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_rgba(219,255,215,0.8)]" />
              <span>System Online • 0.002ms Latency</span>
            </motion.div>
          </div>

          {/* Terminal mockup */}
          <div className="lg:w-1/2 w-full mt-12 lg:mt-0 relative flex justify-center items-center">
            <div className="absolute w-[120%] h-[120%] bg-gradient-to-tr from-primary-container/20 to-secondary-container/20 blur-[100px] rounded-full z-0 mix-blend-screen" />
            <motion.div
              className="relative w-full max-w-lg aspect-[4/3] glass-panel rounded-xl p-4 z-10 overflow-hidden group levitate"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              {/* Faux header */}
              <div className="flex items-center justify-between border-b border-primary/10 pb-3 mb-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-error/50" />
                  <div className="w-3 h-3 rounded-full bg-primary/50" />
                  <div className="w-3 h-3 rounded-full bg-tertiary/50" />
                </div>
                <span className="font-code-sm text-[10px] text-on-surface-variant">
                  terminal_output.log
                </span>
              </div>

              {/* Data lines */}
              <div className="space-y-3 font-code-sm text-xs">
                {[
                  { label: "> UPLOAD THE CSV FILE...", badge: "📂", scanning: false },
                  { label: "> VALIDATING signatures...", badge: "PROCESSING", scanning: true },
                  { label: "> VALIDATION REPORT...", badge: "", scanning: false },
                  { label: "> DOWNLOADABLE CLEANED FILE...", badge: "⬇️", scanning: false },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-surface-container/50 p-2 rounded border border-surface-variant relative overflow-hidden"
                  >
                    {row.scanning && (
                      <div className="absolute inset-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 animate-[scan_2s_ease-in-out_infinite]" />
                    )}
                    <span className={row.scanning ? "text-primary" : "text-on-surface-variant"}>
                      {row.label}
                    </span>
                    <span className={row.scanning ? "text-primary animate-pulse" : "text-tertiary"}>
                      {row.badge}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mini bar chart */}
              <div className="mt-6 w-full h-24 bg-gradient-to-t from-primary/5 to-transparent border border-primary/10 rounded relative overflow-hidden flex items-end px-2 pb-2 gap-1">
                {[
                  ["bg-primary/40", "h-full"],
                  ["bg-primary/60", "h-[80%]"],
                  ["bg-secondary/50", "h-[40%]"],
                  ["bg-primary/80", "h-[90%]"],
                  ["bg-error/50", "h-[20%]"],
                  ["bg-primary/30", "h-[60%]"],
                ].map(([col, h], i) => (
                  <div key={i} className={`w-1/6 ${col} ${h} rounded-t`} />
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="max-w-[1440px] mx-auto px-8 py-12 relative z-10 mt-20 border-t border-surface-variant/30 pt-20">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-headline-lg text-[clamp(24px,4vw,32px)] text-on-surface mb-2">
              The Pipeline
            </h2>
            <p className="font-body-md text-on-surface-variant max-w-2xl mx-auto">
              A seamless, high-fidelity data processing journey designed for
              zero-friction integration.
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              {pipelineSteps.map((step, i) => (
                <motion.div
                  key={step.label}
                  className="flex flex-col items-center text-center p-6 glass-panel rounded-xl card-hover-glow group bg-surface-container-low/80"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                >
                  <div
                    className={`w-16 h-16 rounded-full bg-surface border flex items-center justify-center mb-4 transition-all ${step.iconWrapClass}`}
                  >
                    <span className={`material-symbols-outlined text-3xl ${step.iconClass}`}>
                      {step.icon}
                    </span>
                  </div>
                  <h3 className="font-headline-lg text-lg text-on-surface mb-2">
                    {step.label}
                  </h3>
                  <p className="font-body-md text-sm text-on-surface-variant">
                    {step.desc}
                  </p>
                  <div className={`mt-4 font-code-sm text-xs px-2 py-1 rounded border ${step.badgeClass}`}>
                    {step.badge}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="max-w-[1440px] mx-auto px-8 py-12 relative z-10 mt-10">
          <motion.div
            className="mb-12 border-l-4 border-primary pl-4"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-headline-lg text-[clamp(24px,4vw,32px)] text-on-surface">
              Core Architecture
            </h2>
            <p className="font-body-md text-on-surface-variant mt-2 text-sm uppercase tracking-widest font-bold">
              System Capabilities
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((card, i) => (
              <motion.div
                key={card.title}
                className={`glass-panel p-6 rounded-xl card-hover-glow group flex flex-col justify-between items-start h-full bg-surface-container/40 ${
                  card.span === 2 ? "lg:col-span-2" : ""
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <div
                  className={`mb-4 ${card.iconClass} ${card.wrapClass} p-3 rounded-lg border flex w-full justify-between items-center`}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {card.icon}
                  </span>
                  {card.extra}
                </div>
                <div>
                  <h3
                    className={`font-headline-lg text-xl text-on-surface mb-2 ${card.titleHover} transition-colors`}
                  >
                    {card.title}
                  </h3>
                  <p className="font-body-md text-sm text-on-surface-variant max-w-xl">
                    {card.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <div className="relative z-10 mt-20">
        <Footer />
      </div>
    </div>
  );
}
