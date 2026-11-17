import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3, Bell, Briefcase, CalendarClock, CalendarDays, ChevronRight, Download, FilePen, Flashlight, GraduationCap,
  Home, Languages, LogIn, LogOut, PhoneCall, QrCode, RotateCcw, User, UserCheck, Users, X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { unlock } from "../achievements";
import { play } from "../sound";

// A working copy of the HRM mobile app's home screen and QR check-in, rebuilt for the web.
// Labels come from the app's own English / Khmer strings; the colours from its theme (primary #0C7EA5).

type Lang = "km" | "en";

const T = {
  hello: { en: "Hello", km: "សួស្តី" },
  name: { en: "Demo Officer", km: "មន្ត្រីសាកល្បង" },
  dept: { en: "Digital Office · HRM demo", km: "ការិយាល័យឌីជីថល · កំណែសាកល្បង" },
  leave: { en: "Request for leave", km: "ស្នើសុំច្បាប់ឈប់សម្រាក" },
  days: { en: "days", km: "ថ្ងៃ" },
  today: { en: "Daily", km: "ថ្ងៃនេះ" },
  checkIn: { en: "Check-in", km: "ម៉ោងចូល" },
  checkOut: { en: "Check-out", km: "ម៉ោងចេញ" },
  hour: { en: "H", km: "ម៉ោង" },
  minute: { en: "M", km: "នាទី" },
  request: { en: "Request", km: "ស្នើសុំ" },
  personal: { en: "Personal", km: "ប្រវត្តិរូប" },
  personalInfo: { en: "Personal Information", km: "ព័ត៌មានផ្ទាល់ខ្លួន" },
  family: { en: "Family and Relatives", km: "ព័ត៌មានគ្រួសារ" },
  emergency: { en: "Emergency", km: "ករណីមានអាសន្ន" },
  education: { en: "Education", km: "កំរិតវប្បធម៌" },
  language: { en: "Language", km: "ភាសាបរទេស" },
  job: { en: "Job", km: "ប្រវត្តិការងារ" },
  home: { en: "Home", km: "ទំព័រដើម" },
  mission: { en: "Mission", km: "បេសកកម្ម" },
  report: { en: "Report", km: "របាយការណ៍" },
  scanTitle: { en: "Scan Attendence", km: "ស្កេនវត្តមាន" },
  scanHint: { en: "Point the camera at the QR code", km: "តម្រង់កាមេរ៉ាទៅ QR កូដ" },
  processing: { en: "Processing QR Code...", km: "កំពុងស្កេន QR កូដ..." },
  scanInOk: { en: "Scan in successful", km: "ស្កេនវត្តមានចូលដោយជោគជ័យ" },
  scanOutOk: { en: "Scan out successful", km: "ស្កេនវត្តមានចេញដោយជោគជ័យ" },
  close: { en: "Close", km: "បិទ" },
  done: { en: "Done for today 🎉", km: "រួចរាល់សម្រាប់ថ្ងៃនេះ 🎉" },
  tapQr: { en: "Tap the QR button to check in", km: "ចុចប៊ូតុង QR ដើម្បីស្កេនចូល" },
  tapQrOut: { en: "Tap the QR button to check out", km: "ចុចប៊ូតុង QR ដើម្បីស្កេនចេញ" },
} satisfies Record<string, Record<Lang, string>>;

const TERMINAL = "UAT TERMINAL 3 | Building A";
const DEMO_MINUTES_PER_SECOND = 6; // the demo day runs fast, so the ring visibly fills
const WORK_DAY_MINUTES = 8 * 60;

const fmtTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

// A fixed, QR-looking pattern (it doesn't encode anything).
function FakeQr() {
  const cells = useMemo(() => {
    const n = 21;
    const out: [number, number][] = [];
    let seed = 7;
    const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const finder = (x: number, y: number) =>
      (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!finder(x, y) && rand() > 0.52) out.push([x, y]);
    return out;
  }, []);
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" fill="#111" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="#111" />
    </g>
  );
  return (
    <svg viewBox="0 0 21 21" className="w-full h-full" shapeRendering="crispEdges" aria-hidden="true">
      <rect width="21" height="21" fill="#fff" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#111" />
      ))}
      {finder(0, 0)}
      {finder(14, 0)}
      {finder(0, 14)}
    </svg>
  );
}

export function DemoPhone() {
  const [lang, setLang] = useState<Lang>("km");
  const t = (k: keyof typeof T) => T[k][lang];

  const [screen, setScreen] = useState<"home" | "scan">("home");
  const [processing, setProcessing] = useState(false);
  const [sheet, setSheet] = useState<"in" | "out" | null>(null);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Tick the (sped-up) working clock while checked in.
  useEffect(() => {
    if (!checkIn || checkOut) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [checkIn, checkOut]);

  const workedMinutes = checkIn
    ? Math.min(11 * 60, Math.floor((((checkOut?.getTime() ?? now) - checkIn.getTime()) / 1000) * DEMO_MINUTES_PER_SECOND))
    : 0;
  const ring = Math.min(1, workedMinutes / WORK_DAY_MINUTES);
  const shownCheckOut = checkIn && checkOut ? new Date(checkIn.getTime() + workedMinutes * 60_000) : null;

  // The "camera" finds the QR code, processes it, then shows the success sheet.
  useEffect(() => {
    if (screen !== "scan") return;
    const found = window.setTimeout(() => setProcessing(true), 1400);
    const done = window.setTimeout(() => {
      setProcessing(false);
      setScreen("home");
      const direction = checkIn ? "out" : "in";
      if (direction === "in") setCheckIn(new Date());
      else setCheckOut(new Date());
      setSheet(direction);
      play("send");
      unlock("tester");
    }, 2300);
    return () => {
      window.clearTimeout(found);
      window.clearTimeout(done);
    };
  }, [screen, checkIn]);

  const openScanner = () => {
    if (checkIn && checkOut) return;
    play("click");
    setScreen("scan");
  };

  const reset = () => {
    play("click");
    setCheckIn(null);
    setCheckOut(null);
    setSheet(null);
  };

  const today = new Date();
  const leaveFrom = new Date(today.getTime() + 3 * 86_400_000);
  const leaveTo = new Date(today.getTime() + 6 * 86_400_000);
  const shortDate = (d: Date) => d.toLocaleDateString(lang === "km" ? "km-KH" : "en-GB", { day: "numeric", month: "short" });

  const menu = [
    { icon: User, label: t("personalInfo") },
    { icon: Users, label: t("family") },
    { icon: PhoneCall, label: t("emergency") },
    { icon: GraduationCap, label: t("education") },
    { icon: Languages, label: t("language") },
    { icon: Briefcase, label: t("job") },
  ];

  return (
    <div className="hrm-phone relative w-full aspect-[9/18.6] p-[7px]" lang={lang === "km" ? "km" : "en"}>
      <div className="hrm-screen relative h-full overflow-hidden">
        {/* Status bar */}
        <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 pt-1.5 text-[9px] font-semibold text-slate-800">
          <span>9:41</span>
          <span className="w-14 h-4 rounded-full bg-[#0f1012]" />
          <span className="flex gap-1 items-center">
            <span className="w-3 h-1.5 rounded-sm bg-slate-800" />
          </span>
        </div>

        {/* Home */}
        <div className="absolute inset-0 pt-7 pb-12 overflow-y-auto hrm-scroll">
          {/* Header */}
          <div className="flex items-center gap-2 px-3">
            <span className="hrm-avatar grid place-items-center w-8 h-8 rounded-full text-[11px] font-bold">DO</span>
            <span className="flex-1 min-w-0 leading-tight">
              <span className="block text-[10px] font-bold text-slate-800 truncate">{t("name")}</span>
              <span className="block text-[7.5px] text-slate-500 truncate">{t("dept")}</span>
            </span>
            <button
              type="button"
              className="hrm-lang text-[8px] font-bold px-1.5 py-0.5 rounded-full"
              onClick={() => {
                play("click");
                setLang((l) => (l === "km" ? "en" : "km"));
              }}
              data-cursor={lang === "km" ? "English" : "ខ្មែរ"}
              aria-label="Switch app language"
            >
              {lang === "km" ? "EN" : "ខ្មែរ"}
            </button>
            <span className="hrm-icon-btn grid place-items-center w-6 h-6 rounded-full">
              <Download size={11} />
            </span>
            <span className="hrm-icon-btn relative grid place-items-center w-6 h-6 rounded-full">
              <Bell size={11} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#E53935]" />
            </span>
          </div>

          {/* Leave request */}
          <div className="hrm-leave mx-3 mt-2.5 flex items-center gap-2 rounded-xl px-2.5 py-2">
            <CalendarClock size={14} className="text-amber-600 flex-shrink-0" />
            <span className="flex-1 min-w-0 leading-tight">
              <span className="block text-[9px] font-bold text-amber-700 truncate">{t("leave")}</span>
              <span className="block text-[8px] text-slate-600">
                {shortDate(leaveFrom)} – {shortDate(leaveTo)}{" "}
                <span className="hrm-days px-1 rounded-full">4 {t("days")}</span>
              </span>
            </span>
            <ChevronRight size={12} className="text-slate-400" />
          </div>

          {/* Today */}
          <div className="hrm-card mx-3 mt-2.5 rounded-2xl p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-700">{t("today")}</span>
              <span className="hrm-date flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded-md">
                {today.toLocaleDateString(lang === "km" ? "km-KH" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                <CalendarDays size={9} />
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {/* Working-hours ring */}
              <div className="relative w-[68px] h-[68px] flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3.2" />
                  <motion.circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="#0C7EA5"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    initial={false}
                    animate={{ pathLength: Math.max(0.001, ring) }}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                <span className="absolute inset-[9px] rounded-full bg-[#e8f4f9] grid place-items-center text-center leading-none">
                  <span>
                    <span className="block text-[12px] font-bold text-[#0A6E90]">
                      {Math.floor(workedMinutes / 60)} <span className="text-[7px]">{t("hour")}</span>
                    </span>
                    <span className="block text-[7px] text-[#0A6E90] mt-0.5">
                      {workedMinutes % 60} {t("minute")}
                    </span>
                  </span>
                </span>
              </div>

              {/* Check-in / out rows */}
              <div className="flex-1 min-w-0 space-y-1.5">
                {[
                  { icon: LogIn, label: t("checkIn"), time: checkIn },
                  { icon: LogOut, label: t("checkOut"), time: shownCheckOut },
                ].map(({ icon: Icon, label, time }) => (
                  <div key={label} className="hrm-row flex items-center gap-1.5 rounded-lg p-1">
                    <span className="hrm-row-icon grid place-items-center w-5 h-5 rounded-md flex-shrink-0">
                      <Icon size={10} />
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="block text-[9.5px] font-bold text-slate-800 tabular-nums">
                        {time ? fmtTime(time) : "--:--"}
                      </span>
                      <span className="block text-[6.5px] text-slate-500 truncate">{time ? TERMINAL : label}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-1.5 text-center text-[7.5px] text-slate-500">
              {checkIn && checkOut ? (
                <button type="button" className="inline-flex items-center gap-1 font-semibold text-[#0C7EA5]" onClick={reset} data-cursor="Reset">
                  {t("done")} <RotateCcw size={8} />
                </button>
              ) : checkIn ? (
                t("tapQrOut")
              ) : (
                t("tapQr")
              )}
            </p>
          </div>

          {/* Requests */}
          <p className="mx-3 mt-2.5 text-[9px] font-bold text-slate-700">{t("request")}</p>
          <span className="hrm-chip mx-3 mt-1 inline-flex items-center gap-1 text-[8px] px-2 py-1 rounded-full">
            <CalendarClock size={9} /> {t("leave")}
          </span>

          {/* Profile menu */}
          <p className="mx-3 mt-2.5 text-[9px] font-bold text-slate-700">{t("personal")}</p>
          <div className="mx-3 mt-1 grid grid-cols-3 gap-1.5">
            {menu.map(({ icon: Icon, label }) => (
              <span key={label} className="hrm-tile flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 text-center">
                <Icon size={13} className="text-[#0C7EA5]" />
                <span className="text-[6.5px] leading-tight text-slate-600 line-clamp-2">{label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Bottom navigation, with the QR scan button in the middle */}
        <div className="hrm-nav absolute inset-x-0 bottom-0 z-20 h-12 flex items-end justify-around pb-1.5 text-[6.5px]">
          {[
            { icon: Home, label: t("home"), active: true },
            { icon: FilePen, label: t("request") },
          ].map(({ icon: Icon, label, active }) => (
            <span key={label} className={`flex flex-col items-center gap-0.5 w-10 ${active ? "text-[#0C7EA5] font-bold" : "text-slate-400"}`}>
              <Icon size={13} />
              <span className="truncate max-w-full">{label}</span>
            </span>
          ))}
          <button
            type="button"
            onClick={openScanner}
            className="hrm-qr relative -top-3 grid place-items-center w-11 h-11 rounded-full"
            aria-label={checkIn && !checkOut ? "Scan to check out" : "Scan to check in"}
            data-cursor="Scan"
          >
            {!checkOut && <span className="hrm-qr-ring absolute inset-0 rounded-full" />}
            <QrCode size={18} />
          </button>
          {[
            { icon: UserCheck, label: t("mission") },
            { icon: BarChart3, label: t("report") },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="flex flex-col items-center gap-0.5 w-10 text-slate-400">
              <Icon size={13} />
              <span className="truncate max-w-full">{label}</span>
            </span>
          ))}
        </div>

        {/* QR scanner */}
        <AnimatePresence>
          {screen === "scan" && (
            <motion.div
              className="hrm-scanner absolute inset-0 z-40 flex flex-col items-center"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              <div className="w-full flex items-center justify-between px-3 pt-7">
                <button
                  type="button"
                  className="grid place-items-center w-6 h-6 rounded-full bg-white/15 text-white"
                  onClick={() => setScreen("home")}
                  aria-label="Close scanner"
                >
                  <X size={12} />
                </button>
                <Flashlight size={13} className="text-white/80" />
              </div>
              <p className="mt-3 text-[10px] font-bold text-white">{t("scanTitle")}</p>
              <div className="relative mt-5 w-[62%] aspect-square">
                {/* A QR poster seen through the camera */}
                <div className="absolute inset-[14%] rounded-2xl bg-white p-2 shadow-lg">
                  <FakeQr />
                </div>
                {/* Scanner frame */}
                {["top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-2xl", "top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-2xl", "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-2xl", "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-2xl"].map((c) => (
                  <span key={c} className={`absolute w-7 h-7 border-white/80 ${c}`} />
                ))}
                {!processing && (
                  <motion.span
                    className="absolute inset-x-[8%] h-[3px] rounded-full bg-[#0C7EA5] shadow-[0_0_12px_2px_#0C7EA5]"
                    animate={{ top: ["12%", "86%", "12%"] }}
                    transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </div>
              <p className="mt-5 text-[8px] text-white/70 px-4 text-center">{t("scanHint")}</p>
              <AnimatePresence>
                {processing && (
                  <motion.div
                    className="absolute inset-0 grid place-items-center bg-black/55"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <span className="flex flex-col items-center gap-2 text-white text-[9px]">
                      <span className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      {t("processing")}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success sheet */}
        <AnimatePresence>
          {sheet && (
            <motion.div className="absolute inset-0 z-50 flex items-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-black/35" onClick={() => setSheet(null)} />
              <motion.div
                className="relative w-full rounded-t-3xl bg-white px-4 pt-3 pb-5 text-center"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <span className="mx-auto block w-8 h-1 rounded-full bg-slate-200" />
                <motion.span
                  className="mx-auto mt-3 grid place-items-center w-12 h-12 rounded-full bg-[#28A745] text-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.1 }}
                >
                  {sheet === "in" ? <LogIn size={22} /> : <LogOut size={22} />}
                </motion.span>
                <p className="mt-2 text-[10px] font-bold text-slate-800">{sheet === "in" ? t("scanInOk") : t("scanOutOk")}</p>
                <p className="mt-1 text-[18px] font-bold text-[#0A6E90] tabular-nums">
                  {sheet === "in" ? checkIn && fmtTime(checkIn) : shownCheckOut && fmtTime(shownCheckOut)}
                </p>
                <p className="text-[7.5px] text-slate-500">{TERMINAL}</p>
                <button
                  type="button"
                  className="mt-3 w-full rounded-xl bg-[#0C7EA5] py-2 text-[9px] font-bold text-white"
                  onClick={() => {
                    play("click");
                    setSheet(null);
                  }}
                >
                  {t("close")}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <span className="demo-badge absolute -top-3 -right-3 z-[60] text-[10px] font-bold px-2 py-1 rounded-full">Try my app!</span>
    </div>
  );
}
