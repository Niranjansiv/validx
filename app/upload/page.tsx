"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { pendingUpload, uploadFile } from "@/app/api";
import { motion, AnimatePresence } from "framer-motion";
import { ShaderBackground } from "@/components/ShaderBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

/* ─── Custom Select ─────────────────────────────────────────── */
interface SelectOption { value: string; label: string }

function CustomSelect({
  options,
  value,
  onChange,
}: {
  options: SelectOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex justify-between items-center px-4 py-3 rounded-lg font-code-sm text-code-sm text-on-surface cursor-pointer transition-all duration-200 outline-none
          bg-[#12121a] border ${
            open
              ? "border-[#00dbe9] shadow-[0_0_18px_rgba(0,219,233,0.35)]"
              : "border-[#3b494b] hover:border-[#00dbe9]/60 hover:shadow-[0_0_10px_rgba(0,219,233,0.15)]"
          }`}
      >
        <span>{selected.label}</span>
        <motion.span
          className="material-symbols-outlined text-[18px] text-on-surface-variant select-none"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          expand_more
        </motion.span>
      </button>

      {/* Options list */}
      <AnimatePresence>
        {open && (
          <motion.ul
            className="absolute left-0 top-full mt-1 w-full z-50 rounded-lg overflow-hidden
              bg-[#12121a] border border-[#00dbe9]/40
              shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(0,219,233,0.12)]"
            initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ originY: 0 }}
          >
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <li
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`px-4 py-3 font-code-sm text-code-sm cursor-pointer transition-all duration-150 border-b border-white/5 last:border-0
                    ${active
                      ? "bg-[#00dbe9]/15 text-[#00dbe9]"
                      : "text-on-surface hover:bg-[#00dbe9]/8 hover:text-[#00dbe9]"
                    }`}
                >
                  {opt.label}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Option data ────────────────────────────────────────────── */
const REGION_OPTIONS: SelectOption[] = [
  { value: "in",     label: "🇮🇳  India (IN) — 10 digit phone" },
  { value: "sg",     label: "🇸🇬  Singapore (SG) — 8 digit phone" },
  { value: "us",     label: "🇺🇸  United States (US) — 10 digit phone" },
  { value: "global", label: "🌐  Global Ruleset — per-row country" },
];

const DATE_OPTIONS: SelectOption[] = [
  { value: "iso", label: "ISO 8601 (YYYY-MM-DD)" },
  { value: "us",  label: "MM/DD/YYYY" },
  { value: "eu",  label: "DD/MM/YYYY" },
];


/* ─── Page ───────────────────────────────────────────────────── */
export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging]   = useState(false);
  const [file, setFile]           = useState<File | null>(null);
  const [progress, setProgress]   = useState(0);
  const [uploading, setUploading] = useState(false);
  const [region, setRegion]       = useState("in");
  const [dateSchema, setDateSchema] = useState("iso");
  const [chunkSize, setChunkSize] = useState(1000);

  const handleFile = (f: File) => setFile(f);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleStartValidation = () => {
    if (!file) return;

    console.log("[ValidX] NEXT_PUBLIC_API_URL =", process.env.NEXT_PUBLIC_API_URL);

    const settings = { targetRegion: region, dateSchema, chunkSize };

    // Store the file + kick off the API call immediately so the network
    // request runs in parallel with the processing-page animation.
    pendingUpload.file     = file;
    pendingUpload.settings = settings;
    pendingUpload.promise  = uploadFile(file, settings);

    setUploading(true);
    router.push("/processing");
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <style>{`
        .chunk-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 9999px;
          outline: none;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .chunk-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #00dbe9;
          cursor: pointer;
          animation: chunk-thumb-pulse 2s ease-in-out infinite;
        }
        .chunk-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #00dbe9;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 0 3px rgba(0,219,233,0.2), 0 0 12px rgba(0,219,233,0.6);
        }
        @keyframes chunk-thumb-pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(0,219,233,0.2), 0 0 12px rgba(0,219,233,0.6); }
          50%       { box-shadow: 0 0 0 6px rgba(0,219,233,0.15), 0 0 22px rgba(0,219,233,0.9); }
        }
      `}</style>

      {/* Shader */}
      <div className="fixed inset-0 w-full h-full z-0 opacity-40 pointer-events-none">
        <ShaderBackground className="absolute inset-0 w-full h-full" />
      </div>

      <Navbar />

      <main className="flex-grow relative z-10 pt-32 pb-8 px-8 max-w-[1440px] mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Header */}
        <motion.div
          className="col-span-1 md:col-span-12 mb-4"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary neon-text-glow mb-1">
            Data Ingestion
          </h1>
          <p className="text-on-surface-variant font-code-sm text-code-sm">
            SYSTEM STATUS:{" "}
            <span className="text-tertiary-fixed-dim drop-shadow-[0_0_5px_rgba(0,229,91,0.8)]">
              READY FOR UPLOAD
            </span>
          </p>
        </motion.div>

        {/* Left – Drop Zone */}
        <div className="col-span-1 md:col-span-8 flex flex-col gap-6">
          <motion.div
            className={`glass-panel rounded-xl p-8 h-96 flex flex-col items-center justify-center relative cursor-pointer group glow-pulse dash-animate transition-transform ${
              dragging ? "scale-[1.01]" : ""
            }`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,.xml"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="absolute top-0 left-0 w-full h-1 bg-primary-container shadow-[0_0_15px_#00f0ff] opacity-0 group-hover:opacity-100 group-hover:animate-[scan_2s_ease-in-out_infinite]" />

            <div className="mb-6 text-primary-fixed-dim group-hover:scale-110 transition-transform duration-500">
              <span
                className="material-symbols-outlined text-[64px] drop-shadow-[0_0_15px_rgba(0,219,233,0.8)]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                cloud_upload
              </span>
            </div>

            {file ? (
              <div className="text-center">
                <p className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-1">
                  {file.name}
                </p>
                <p className="font-code-sm text-code-sm text-primary">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to validate
                </p>
              </div>
            ) : (
              <>
                <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2 text-center">
                  Drag &amp; Drop Dataset
                </h3>
                <p className="font-code-sm text-code-sm text-on-surface-variant text-center max-w-md">
                  Supported formats: CSV, JSON, XML. Max file size: 5GB.
                  <br />
                  <span className="text-primary mt-2 inline-block hover:underline">
                    Or browse local files
                  </span>
                </p>
              </>
            )}
          </motion.div>

          {/* Upload progress bar */}
          {uploading && (
            <motion.div
              className="glass-panel rounded-xl p-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex justify-between items-center mb-2 font-code-sm text-code-sm">
                <span className="text-on-surface">{file?.name}</span>
                <span className="text-primary-fixed-dim">{Math.floor(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-fixed-dim to-secondary shadow-[0_0_10px_#00dbe9] relative overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear" }}
                >
                  <div className="light-sweep" />
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right – Validation Parameters */}
        <motion.div
          className="col-span-1 md:col-span-4 flex flex-col gap-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Parameters card */}
          <div
            className="rounded-xl p-6 flex flex-col gap-5"
            style={{
              background: "rgba(13, 13, 20, 0.7)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(0, 219, 233, 0.25)",
              boxShadow: "0 0 30px rgba(0,219,233,0.06), inset 0 0 0 1px rgba(255,255,255,0.04)",
            }}
          >
            {/* Card header */}
            <div className="flex items-center gap-2 pb-3 border-b border-[#00dbe9]/20">
              <span className="material-symbols-outlined text-[16px] text-primary-fixed-dim">
                tune
              </span>
              <h2 className="font-label-caps text-label-caps text-primary uppercase tracking-widest">
                Validation Parameters
              </h2>
            </div>

            {/* Target Region */}
            <div className="flex flex-col gap-2">
              <label className="font-code-sm text-code-sm text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-primary-fixed-dim/70">public</span>
                Target Region
              </label>
              <CustomSelect
                options={REGION_OPTIONS}
                value={region}
                onChange={setRegion}
              />
              {region === "global" && (
                <motion.p
                  className="font-code-sm text-[11px] text-on-surface-variant/70 pl-1 leading-relaxed"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  Reads <span className="text-primary/80">Country</span> column per row and applies that country's phone validation rule automatically.
                </motion.p>
              )}
            </div>

            {/* Date Schema */}
            <div className="flex flex-col gap-2">
              <label className="font-code-sm text-code-sm text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-primary-fixed-dim/70">calendar_month</span>
                Date Schema
              </label>
              <CustomSelect
                options={DATE_OPTIONS}
                value={dateSchema}
                onChange={setDateSchema}
              />
            </div>

            {/* Chunk Size slider */}
            <div className="flex flex-col gap-3 pb-2">
              <div className="flex justify-between items-center">
                <label className="font-code-sm text-code-sm text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-primary-fixed-dim/70">memory</span>
                  Processing Chunk Size
                </label>
                <span className="font-code-sm text-code-sm text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                  {chunkSize.toLocaleString()} Rows
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="10000"
                step="500"
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
                className="chunk-slider w-full"
                style={{
                  background: `linear-gradient(to right, #00dbe9 0%, #00dbe9 ${((chunkSize - 500) / 9500) * 100}%, rgba(255,255,255,0.12) ${((chunkSize - 500) / 9500) * 100}%, rgba(255,255,255,0.12) 100%)`,
                }}
              />
              <div className="flex justify-between font-code-sm text-[11px] text-on-surface-variant/50">
                <span>500</span>
                <span>10,000</span>
              </div>
            </div>
          </div>

          {/* START VALIDATION button */}
          <motion.button
            className="relative w-full overflow-hidden rounded-xl py-5 flex items-center justify-center gap-3 font-label-caps text-label-caps uppercase tracking-widest font-bold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: file && !uploading
                ? "linear-gradient(135deg, #00f0ff 0%, #cf5cff 100%)"
                : "rgba(0,219,233,0.08)",
              border: "1px solid rgba(0,240,255,0.4)",
              color: file && !uploading ? "#00363a" : "#00dbe9",
              boxShadow: file && !uploading
                ? "0 0 24px rgba(0,240,255,0.35)"
                : "none",
            }}
            whileHover={file && !uploading ? { scale: 1.02, boxShadow: "0 0 40px rgba(0,240,255,0.55)" } : {}}
            whileTap={file && !uploading ? { scale: 0.97 } : {}}
            onClick={handleStartValidation}
            disabled={!file || uploading}
          >
            {/* Shimmer sweep on hover */}
            {file && !uploading && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            )}
            <motion.span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
              animate={file && !uploading ? { rotate: [0, -15, 15, 0] } : {}}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            >
              rocket_launch
            </motion.span>
            <span>{uploading ? "Uploading…" : "Start Validation"}</span>
          </motion.button>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
