"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pendingUpload } from "@/app/api";
import { motion, AnimatePresence } from "framer-motion";
import { ShaderBackground } from "@/components/ShaderBackground";

const STAGES = [
  { text: "Initializing ValidX engine...", icon: "memory", target: 10 },
  { text: "Analyzing headers...", icon: "find_in_page", target: 35 },
  { text: "Validating transaction IDs...", icon: "fact_check", target: 60 },
  { text: "Cross-referencing schemas...", icon: "schema", target: 75 },
  { text: "Cleaning anomalous data...", icon: "cleaning_services", target: 90 },
  { text: "Finalizing payload...", icon: "task_alt", target: 100 },
];

export default function ProcessingPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let current = 0;
    let currentStageIdx = 0;

    const tick = () => {
      current += Math.random() * 0.8;
      if (current >= 100) {
        setProgress(100);
        setStageIdx(STAGES.length - 1);
        setTimeout(() => {
          setDone(true);
          setTimeout(async () => {
            // Await the API call that was started by the Upload page.
            // If it already resolved this returns immediately; if still in
            // flight we wait here while the "Processing Complete" state shows.
            if (pendingUpload.promise) {
              try {
                const result = await pendingUpload.promise;
                sessionStorage.setItem("validx_result", JSON.stringify(result));
              } catch (err) {
                console.error("Validation API error:", err);
                sessionStorage.removeItem("validx_result");
              } finally {
                pendingUpload.promise  = null;
                pendingUpload.file     = null;
                pendingUpload.settings = null;
              }
            }
            router.push("/results");
          }, 1200);
        }, 500);
        return;
      }

      setProgress(current);

      if (
        currentStageIdx < STAGES.length &&
        current >= STAGES[currentStageIdx].target
      ) {
        setStageIdx(currentStageIdx);
        currentStageIdx++;
      }

      requestAnimationFrame(tick);
    };

    const id = setTimeout(() => requestAnimationFrame(tick), 500);
    return () => clearTimeout(id);
  }, [router]);

  const stage = STAGES[Math.min(stageIdx, STAGES.length - 1)];
  const pct = Math.floor(progress);

  return (
    <div className="bg-background text-on-surface h-screen w-full flex items-center justify-center overflow-hidden relative">
      {/* Shader */}
      <div className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen pointer-events-none z-0">
        <ShaderBackground className="absolute inset-0 w-full h-full" />
      </div>

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background z-0 pointer-events-none" />

      <main className="relative z-10 w-full max-w-[500px] px-8">
        <motion.div
          className="glass-panel-dark glow-pulse-soft rounded-xl p-12 flex flex-col items-center justify-center relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-fixed-dim to-transparent opacity-50" />

          {/* Icon */}
          <div className="mb-6 relative">
            <AnimatePresence mode="wait">
              <motion.span
                key={done ? "check" : stage.icon}
                className={`material-symbols-outlined text-[64px] drop-shadow-[0_0_15px_rgba(125,244,255,0.6)] ${
                  done ? "text-tertiary-fixed" : "text-primary-fixed"
                }`}
                style={{ fontVariationSettings: "'FILL' 1" }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                {done ? "check_circle" : stage.icon}
              </motion.span>
            </AnimatePresence>
            <div className="absolute inset-0 border-2 border-primary-fixed rounded-full animate-ping opacity-20" />
          </div>

          {/* Title */}
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight mb-2 text-center terminal-text-glow">
            Processing Data
          </h1>

          {/* Percentage */}
          <motion.div
            className={`font-display-lg text-[56px] leading-[64px] terminal-text-glow tabular-nums my-4 ${
              done ? "text-tertiary-fixed" : "text-primary-fixed"
            }`}
          >
            {pct}%
          </motion.div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden mt-4 mb-6 relative border border-outline-variant/30">
            <motion.div
              className={`h-full relative overflow-hidden shadow-[0_0_10px_rgba(125,244,255,0.8)] ${
                done ? "bg-tertiary-fixed" : "bg-primary-fixed"
              }`}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear", duration: 0.1 }}
            >
              <div className="light-sweep" />
            </motion.div>
          </div>

          {/* Status text */}
          <div className="data-stream w-full h-[60px] flex flex-col items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={done ? "done" : stage.text}
                className={`font-code-sm text-code-sm w-full text-center truncate ${
                  done ? "text-tertiary-fixed" : "text-primary"
                }`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {done ? "Processing Complete." : stage.text}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Active indicator */}
          <div className="mt-6 flex gap-2 items-center">
            <div className="w-2 h-2 rounded-full bg-tertiary-fixed shadow-[0_0_8px_rgba(107,255,131,0.8)] animate-pulse" />
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
              System Active
            </span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
