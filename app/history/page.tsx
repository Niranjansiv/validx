"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShaderBackground } from "@/components/ShaderBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getHistory, downloadReport, HistorySession } from "@/app/api";

type JobStatus = "completed" | "in_progress" | "failed";

interface Job {
  id: string;
  filename: string;
  date: string;
  status: JobStatus;
  accuracy: string | null;
  actionIcon: string;
}

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; dotClass: string; textClass: string; pillClass: string }
> = {
  completed: {
    label:     "Completed",
    dotClass:  "bg-tertiary-fixed pulse-dot",
    textClass: "text-tertiary-fixed",
    pillClass: "bg-tertiary-fixed/10 border-tertiary-fixed/50 text-tertiary-fixed shadow-[0_0_12px_rgba(107,255,131,0.35)]",
  },
  in_progress: {
    label:     "In Progress",
    dotClass:  "bg-primary-fixed pulse-cyan",
    textClass: "text-primary-fixed",
    pillClass: "bg-primary-fixed/10 border-primary-fixed/50 text-primary-fixed shadow-[0_0_10px_rgba(125,244,255,0.2)]",
  },
  failed: {
    label:     "Failed",
    dotClass:  "bg-error shadow-[0_0_5px_rgba(255,180,171,0.8)]",
    textClass: "text-error",
    pillClass: "bg-error/10 border-error/50 text-error shadow-[0_0_10px_rgba(255,180,171,0.2)]",
  },
};

function mapSession(s: HistorySession): Job {
  const rawStatus = (s.status ?? "").toUpperCase();
  const status: JobStatus =
    rawStatus === "COMPLETED"  ? "completed"  :
    rawStatus === "PROCESSING" ? "in_progress" :
    "failed";

  const accuracy =
    s.total_rows && s.valid_rows && s.total_rows > 0
      ? `${((s.valid_rows / s.total_rows) * 100).toFixed(1)}%`
      : null;

  const actionIcon =
    status === "completed"  ? "download" :
    status === "in_progress" ? "visibility" :
    "refresh";

  return {
    id: s.id,
    filename: s.filename,
    date: new Date(s.upload_date).toLocaleString(),
    status,
    accuracy,
    actionIcon,
  };
}

export default function HistoryPage() {
  const [jobs, setJobs]       = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then((sessions) => setJobs(sessions.map(mapSession)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden" style={{ backgroundColor: "#0A0A0F" }}>

      {/* Shader */}
      <div className="absolute inset-0 w-full h-full -z-10 opacity-30">
        <ShaderBackground className="absolute inset-0 w-full h-full" />
      </div>

      {/* Radial glow blobs — same pattern as other pages */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full blur-[160px]"
             style={{ background: "rgba(0, 240, 255, 0.04)" }} />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px]"
             style={{ background: "rgba(207, 92, 255, 0.04)" }} />
        <div className="absolute top-2/3 left-1/5 w-[350px] h-[350px] rounded-full blur-[120px]"
             style={{ background: "rgba(107, 255, 131, 0.03)" }} />
      </div>

      <Navbar />

      <main className="flex-grow pt-32 pb-8 px-8 max-w-[1440px] mx-auto w-full z-10 relative">
        <motion.header
          className="mb-12"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-headline-lg text-headline-lg md:font-display-lg md:text-display-lg text-primary mb-2">
            Validation History
          </h1>
          <p className="text-on-surface-variant font-body-md">
            Review past data validation jobs and their outcomes.
          </p>
        </motion.header>

        {/* Table */}
        <motion.div
          className="rounded-xl overflow-hidden mb-12"
          style={{
            background: "rgba(19, 19, 24, 0.6)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(0, 240, 255, 0.25)",
            boxShadow: "0 0 40px rgba(0, 240, 255, 0.08), 0 0 80px rgba(0, 240, 255, 0.04), inset 0 0 0 1px rgba(255,255,255,0.04)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className="font-label-caps text-label-caps text-on-surface-variant"
                  style={{
                    borderBottom: "1px solid rgba(0, 240, 255, 0.3)",
                    boxShadow: "0 1px 12px rgba(0, 240, 255, 0.12)",
                  }}
                >
                  <th className="py-4 px-6 font-medium">Filename</th>
                  <th className="py-4 px-6 font-medium">Date</th>
                  <th className="py-4 px-6 font-medium">Status</th>
                  <th className="py-4 px-6 font-medium">Accuracy</th>
                  <th className="py-4 px-6 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="font-code-sm text-code-sm">
                {loading && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-on-surface-variant font-code-sm text-code-sm">
                      Loading history…
                    </td>
                  </tr>
                )}
                {!loading && jobs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-on-surface-variant font-code-sm text-code-sm">
                      No validation jobs yet.
                    </td>
                  </tr>
                )}
                {jobs.map((job, i) => {
                  const cfg = STATUS_CONFIG[job.status];
                  const isEven = i % 2 === 0;
                  return (
                    <motion.tr
                      key={job.id}
                      className="transition-all duration-200 group border-l-2 border-transparent"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        background: isEven
                          ? "rgba(255,255,255,0.015)"
                          : "transparent",
                      }}
                      whileHover={{
                        background: "rgba(0, 240, 255, 0.05)",
                        borderLeftColor: "rgba(0, 240, 255, 0.8)",
                        boxShadow: "0 0 20px rgba(0, 240, 255, 0.1)",
                      }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                    >
                      <td className="py-4 px-6 text-on-surface">{job.filename}</td>
                      <td className="py-4 px-6 text-on-surface-variant">{job.date}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border ${cfg.pillClass}`}>
                          <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {job.accuracy ? (
                          <span
                            className="font-bold text-primary-fixed"
                            style={{ textShadow: "0 0 10px rgba(125, 244, 255, 0.7)" }}
                          >
                            {job.accuracy}
                          </span>
                        ) : (
                          <span className="text-on-surface-variant">--</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {job.status === "completed" ? (
                          <motion.button
                            className="text-primary drop-shadow-[0_0_6px_rgba(0,240,255,0.5)] transition-colors hover:text-primary-fixed"
                            whileHover={{ scale: 1.25, filter: "drop-shadow(0 0 12px rgba(0,240,255,0.9))" }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                            onClick={() => downloadReport(job.id)}
                          >
                            <span className="material-symbols-outlined">{job.actionIcon}</span>
                          </motion.button>
                        ) : job.status === "in_progress" ? (
                          <Link href="/processing">
                            <button className="text-primary hover:text-primary-fixed drop-shadow-[0_0_5px_rgba(0,240,255,0.5)] transition-all">
                              <span className="material-symbols-outlined">{job.actionIcon}</span>
                            </button>
                          </Link>
                        ) : (
                          <Link href="/upload">
                            <button className="text-primary hover:text-primary-fixed drop-shadow-[0_0_5px_rgba(0,240,255,0.5)] transition-all">
                              <span className="material-symbols-outlined">{job.actionIcon}</span>
                            </button>
                          </Link>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Upload new CTA */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Link
            href="/upload"
            className="btn-primary text-on-primary px-8 py-4 rounded-lg font-label-caps text-label-caps uppercase tracking-widest font-bold flex items-center gap-2"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              add
            </span>
            New Validation Job
          </Link>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
