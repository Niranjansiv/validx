"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShaderBackground } from "@/components/ShaderBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  downloadCleaned,
  downloadInvalid,
  downloadReport,
  UploadResult,
  RowResult,
} from "@/app/api";

type Tab = "all" | "validated" | "errors";

// ── Row shape ─────────────────────────────────────────────────────────────────
// `data` holds whatever columns the CSV contained so the table is fully dynamic.
interface DisplayRow {
  rowId:  string;
  status: "pass" | "error" | "cleaned";
  type:   "pass" | "error";
  errors: string[];
  data:   Record<string, string>;
}

// ── Fallback rows (shown when no API result is in sessionStorage) ─────────────
const FALLBACK_ROWS: DisplayRow[] = [
  {
    rowId: "#14208", status: "pass",    type: "pass",  errors: [],
    data: { email: "alex.m@example.com",  phone: "+1 (555) 019-2834", amount: "$12,450.00", payment_mode: "Card" },
  },
  {
    rowId: "#14207", status: "error",   type: "error",
    errors: ["Invalid email format", "Phone number must be 10 digits for US"],
    data: { email: "invalid_email@.com",  phone: "+44 20 7946 0958",  amount: "$3,200.50",  payment_mode: "UPI"  },
  },
  {
    rowId: "#14206", status: "pass",    type: "pass",  errors: [],
    data: { email: "s.chen@techcorp.io",  phone: "+1 (555) 982-1102", amount: "$45,000.00", payment_mode: "Online" },
  },
  {
    rowId: "#14205", status: "cleaned", type: "pass",  errors: [],
    data: { email: "jdoe@gmail.com",      phone: "+1 (555) 123-4567", amount: "$850.00",    payment_mode: "Cash" },
  },
  {
    rowId: "#14204", status: "error",   type: "error",
    errors: ["Phone number is empty", "Amount is not a valid number"],
    data: { email: "admin@system.local",  phone: "NULL",              amount: "-999.00",    payment_mode: "Unknown" },
  },
];

const FALLBACK_COLUMNS = Object.keys(FALLBACK_ROWS[0].data);

// ── Map API row → DisplayRow ───────────────────────────────────────────────────
function mapRow(row: RowResult): DisplayRow {
  const isValid = row.validation_status === "Valid";
  return {
    rowId:  `#${row.rowNumber}`,
    status: isValid ? "pass" : "error",
    type:   isValid ? "pass" : "error",
    errors: row.errors,
    data:   row.data,
  };
}

// Convert snake_case / lowercase CSV keys to readable header labels
function columnLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Counter hook ───────────────────────────────────────────────────────────────
function useCounter(end: number, duration = 1000, delay = 500) {
  const [val, setVal] = useState(Math.max(0, end - 300));
  useEffect(() => {
    const timeout = setTimeout(() => {
      const steps = 60;
      const start = Math.max(0, end - 300);
      const inc   = (end - start) / steps;
      let cur = start;
      const iv = setInterval(() => {
        cur += inc;
        if (cur >= end) { setVal(end); clearInterval(iv); }
        else setVal(Math.floor(cur));
      }, duration / steps);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(timeout);
  }, [end, duration, delay]);
  return val;
}

// ── Error popup shape ──────────────────────────────────────────────────────────
interface ErrorPopup {
  errors: string[];
  top:    number;
  left:   number;
  above:  boolean;
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const [activeTab,   setActiveTab]   = useState<Tab>("all");
  const [apiResult,   setApiResult]   = useState<UploadResult | null>(null);
  const [errorPopup,  setErrorPopup]  = useState<ErrorPopup | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Read result written by the Processing page
  useEffect(() => {
    const raw = sessionStorage.getItem("validx_result");
    if (raw) {
      try { setApiResult(JSON.parse(raw) as UploadResult); } catch {}
    }
  }, []);

  // Close error popup on outside click
  useEffect(() => {
    if (!errorPopup) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setErrorPopup(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [errorPopup]);

  // ── Counts ─────────────────────────────────────────────────────────────────
  const totalCount = apiResult?.totalRows   ?? 14208;
  const validCount = apiResult?.validRows   ?? 12840;
  const errorCount = apiResult?.invalidRows ?? 1024;

  const validPct = totalCount > 0 ? `${((validCount / totalCount) * 100).toFixed(1)}%` : "90.3%";
  const errorPct = totalCount > 0 ? `${((errorCount / totalCount) * 100).toFixed(1)}%` : "7.2%";

  const totalVal = useCounter(totalCount);
  const validVal = useCounter(validCount);
  const errorVal = useCounter(errorCount);
  const cleanVal = useCounter(0);

  const counters: Record<string, number> = {
    total: totalVal, valid: validVal, error: errorVal, clean: cleanVal,
  };

  const STATS = [
    { id: "total", label: "Total Rows",        icon: "table_rows",    iconClass: "text-primary-container",  cls: "stat-cyan",   textCls: "text-primary-fixed-dim",  pct: null     },
    { id: "valid", label: "Passed Validation", icon: "check_circle",  iconClass: "text-tertiary-fixed-dim", cls: "stat-green",  textCls: "text-tertiary-fixed-dim", pct: validPct },
    { id: "error", label: "Critical Errors",   icon: "warning",       iconClass: "text-error",              cls: "stat-red",    textCls: "text-error",              pct: errorPct },
    { id: "clean", label: "Auto-Cleaned",      icon: "auto_fix_high", iconClass: "text-secondary",          cls: "stat-purple", textCls: "text-secondary",          pct: null     },
  ];

  // ── Rows & columns ──────────────────────────────────────────────────────────
  const displayRows: DisplayRow[] = apiResult
    ? apiResult.fullReport.slice(0, 200).map(mapRow)
    : FALLBACK_ROWS;

  // Derive column list from the first row that has data
  const columns: string[] = (() => {
    const firstData = displayRows[0]?.data;
    return firstData ? Object.keys(firstData) : FALLBACK_COLUMNS;
  })();

  const filtered = displayRows.filter((r) => {
    if (activeTab === "validated") return r.type === "pass";
    if (activeTab === "errors")    return r.type === "error";
    return true;
  });

  const sessionId = apiResult?.sessionId ?? null;

  // ── Error popup opener ──────────────────────────────────────────────────────
  function openErrorPopup(e: React.MouseEvent<HTMLButtonElement>, errors: string[]) {
    const POPUP_W    = 304;
    const POPUP_H    = Math.min(48 + errors.length * 40, 260);
    const rect       = e.currentTarget.getBoundingClientRect();
    const left       = Math.max(8, Math.min(rect.right - POPUP_W, window.innerWidth - POPUP_W - 8));
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const above      = spaceBelow < POPUP_H;
    const top        = above ? rect.top - POPUP_H - 8 : rect.bottom + 8;
    setErrorPopup({ errors, top, left, above });
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-background">
      {/* Shader */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
        <ShaderBackground className="absolute inset-0 w-full h-full" />
      </div>

      <Navbar />

      <main className="flex-grow z-10 relative pt-32 pb-8 px-8 max-w-[1440px] mx-auto w-full flex flex-col gap-12">

        {/* ── Header ── */}
        <motion.header
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary mb-1 drop-shadow-[0_0_8px_rgba(0,219,233,0.3)]">
              Validation Report
            </h1>
            <p className="text-on-surface-variant font-code-sm text-code-sm">
              Dataset: {apiResult?.filename ?? "customer_data_v2.csv"} • Completed: Just now
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-glow-green font-code-sm text-code-sm px-4 py-2 rounded flex items-center gap-2"
              onClick={() => sessionId && downloadCleaned(sessionId)}
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Download Clean CSV
            </button>
            <button
              className="btn-glow-red font-code-sm text-code-sm px-4 py-2 rounded flex items-center gap-2"
              onClick={() => sessionId && downloadInvalid(sessionId)}
            >
              <span className="material-symbols-outlined text-[18px]">error</span>
              Download Errors
            </button>
            <button
              className="btn-glow-cyan font-code-sm text-code-sm px-6 py-2 rounded flex items-center gap-2 font-bold"
              onClick={() => sessionId && downloadReport(sessionId)}
            >
              <span className="material-symbols-outlined text-[18px]">assessment</span>
              Full Report
            </button>
          </div>
        </motion.header>

        {/* ── Stats grid ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={s.id}
              className={`glass-panel ${s.cls} p-6 rounded-xl flex flex-col gap-2 relative overflow-hidden group`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-10 -mt-10 group-hover:opacity-150 transition-all opacity-50 bg-current" />
              <div className="flex justify-between items-center text-on-surface-variant">
                <span className="font-label-caps text-label-caps uppercase">{s.label}</span>
                <span className={`material-symbols-outlined ${s.iconClass}`}>{s.icon}</span>
              </div>
              <div className={`font-display-lg text-display-lg ${s.textCls} flex items-baseline gap-2`}>
                <span>{counters[s.id].toLocaleString()}</span>
                {s.pct && (
                  <span className={`font-code-sm text-code-sm ${s.textCls} opacity-70`}>
                    {s.pct}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </section>

        {/* ── Data explorer ── */}
        <motion.section
          className="glass-panel rounded-xl flex flex-col flex-grow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
        >
          {/* Tabs */}
          <div className="border-b border-white/5 flex gap-6 px-6 pt-2">
            {(["all", "validated", "errors"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-label-caps text-label-caps uppercase px-4 py-3 transition-colors border-b-2 ${
                  activeTab === tab
                    ? "tab-active"
                    : "text-on-surface-variant border-transparent hover:text-primary"
                }`}
              >
                {tab === "all" ? "All Records" : tab === "validated" ? "Validated" : "Errors"}
              </button>
            ))}
          </div>

          {/* Table — fully dynamic columns */}
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left border-collapse font-code-sm text-code-sm">
              <thead>
                <tr className="text-on-surface-variant border-b border-white/10 uppercase font-label-caps text-label-caps">
                  {/* Fixed: status */}
                  <th className="py-3 pl-4 pr-2 font-normal">Status</th>
                  {/* Fixed: row number */}
                  <th className="py-3 px-2 font-normal">Row #</th>
                  {/* Dynamic: one <th> per CSV column */}
                  {columns.map((col) => (
                    <th key={col} className="py-3 px-2 font-normal">
                      {columnLabel(col)}
                    </th>
                  ))}
                  {/* Fixed: details */}
                  <th className="py-3 px-2 font-normal text-right">Details</th>
                </tr>
              </thead>
              <tbody className="text-on-surface">
                {filtered.map((row) => (
                  <tr
                    key={row.rowId}
                    className={`data-row group ${row.type === "error" ? "row-error bg-error/5" : "row-pass"}`}
                  >
                    {/* Status dot / icon */}
                    <td className="py-3 pl-4 pr-2">
                      {row.status === "cleaned" ? (
                        <span className="material-symbols-outlined text-secondary text-[16px] ml-1">
                          auto_fix_high
                        </span>
                      ) : row.type === "error" ? (
                        <div className="w-2 h-2 rounded-full bg-error pulse-dot-red ml-2" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-tertiary-fixed-dim pulse-dot ml-2" />
                      )}
                    </td>

                    {/* Row number */}
                    <td className="py-3 px-2 text-on-surface-variant">{row.rowId}</td>

                    {/* Dynamic data cells */}
                    {columns.map((col) => {
                      const value = row.data[col] ?? "-";
                      return (
                        <td key={col} className="py-3 px-2">
                          <span
                            className={`block max-w-[180px] truncate ${
                              row.type === "error" ? "text-error/80" : ""
                            }`}
                            title={value}
                          >
                            {value}
                          </span>
                        </td>
                      );
                    })}

                    {/* Details button */}
                    <td className="py-3 px-2 text-right">
                      {row.type === "error" ? (
                        <button
                          className="text-error hover:text-on-error-container transition-colors"
                          onClick={(e) => openErrorPopup(e, row.errors)}
                        >
                          <span className="material-symbols-outlined text-[18px]">info</span>
                        </button>
                      ) : (
                        <button className="text-on-surface-variant group-hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="p-4 border-t border-white/5 flex justify-between items-center text-on-surface-variant font-code-sm text-code-sm">
            <span>Showing 1-{filtered.length} of {totalCount.toLocaleString()}</span>
            <div className="flex gap-2">
              <button className="px-2 py-1 rounded hover:bg-white/5 disabled:opacity-50" disabled>
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button className="px-2 py-1 rounded hover:bg-white/5">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </motion.section>
      </main>

      <div className="mt-8">
        <Footer />
      </div>

      {/* ── Error detail popup (fixed, above all other layers) ── */}
      <AnimatePresence>
        {errorPopup && (
          <motion.div
            ref={popupRef}
            key="error-popup"
            initial={{ opacity: 0, scale: 0.95, y: errorPopup.above ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: errorPopup.above ? 6 : -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              position: "fixed",
              top:      errorPopup.top,
              left:     errorPopup.left,
              width:    304,
              zIndex:   9999,
              background:           "rgba(10, 10, 18, 0.96)",
              backdropFilter:       "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border:               "1px solid rgba(0, 219, 233, 0.45)",
              boxShadow:            "0 0 24px rgba(0,219,233,0.12), 0 12px 40px rgba(0,0,0,0.6)",
              borderRadius:         "12px",
            }}
          >
            <div
              style={{ borderBottom: "1px solid rgba(0,219,233,0.15)" }}
              className="px-4 py-3 flex items-center gap-2"
            >
              <span
                className="material-symbols-outlined text-[15px] text-error"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                error
              </span>
              <span className="font-label-caps text-label-caps text-error uppercase tracking-widest text-[11px]">
                Validation Errors
              </span>
              <button
                className="ml-auto text-on-surface-variant hover:text-primary transition-colors"
                onClick={() => setErrorPopup(null)}
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <div className="px-4 py-3 flex flex-col gap-2.5 max-h-56 overflow-y-auto">
              {errorPopup.errors.length === 0 ? (
                <p className="font-code-sm text-[12px] text-on-surface-variant italic">
                  No error details available.
                </p>
              ) : (
                errorPopup.errors.map((err, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <span
                      className="material-symbols-outlined text-[13px] text-error/70 shrink-0 mt-0.5"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      radio_button_checked
                    </span>
                    <span className="font-code-sm text-[12px] text-on-surface-variant leading-relaxed">
                      {err}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
