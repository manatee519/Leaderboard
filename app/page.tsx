// app/page.tsx
import axios from "axios";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

/** =========================================
 *  THEME SWITCH (appearance-only)
 *  LEADERBOARD_THEME = "manatee" | "mobbin"
 *  ========================================= */
const THEME = (process.env.LEADERBOARD_THEME || "manatee").toLowerCase() as
  | "manatee"
  | "mobbin";

/** Visual packs (colors, pills, glows, header tone, optional IG button) */
const PACKS = {
  mobbin: {
    name: "mobbin",
    BRAND: {
      bg: "bg-black",
      panelFrom: "from-sky-900/20",
      panelTo: "to-black/60",
      accent: "text-sky-300",
      ring: "ring-sky-700/40",
      btn: "bg-sky-600 hover:bg-sky-500 focus-visible:ring-sky-400",
      pillBorder: "border-sky-700/40",
      pillBg: "bg-sky-900/40",
    },
    stickyHeaderClass:
      "sticky top-0 z-50 border-b border-zinc-800/60 bg-black/40 backdrop-blur-md supports-[backdrop-filter]:bg-black/20",
    medalGlow: {
      1: "drop-shadow(0 0 30px rgba(59,130,246,0.9))",
      2: "drop-shadow(0 0 30px rgba(191,219,254,0.8))",
      3: "drop-shadow(0 0 30px rgba(56,189,248,0.8))",
    } as Record<1 | 2 | 3, string>,
    showInstagram: true,
  },
  manatee: {
    name: "manatee",
    BRAND: {
      bg: "bg-black",
      panelFrom: "from-rose-900/20",
      panelTo: "to-black/60",
      accent: "text-rose-400",
      ring: "ring-rose-700/40",
      btn: "bg-rose-600 hover:bg-rose-500 focus-visible:ring-rose-400",
      pillBorder: "border-rose-700/40",
      pillBg: "bg-rose-900/30",
    },
    stickyHeaderClass:
      "sticky top-0 z-50 border-b border-zinc-800 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/50",
    medalGlow: {
      1: "drop-shadow(0 0 30px rgba(244, 63, 94, 0.9))",   // bright rose red (first place)
      2: "drop-shadow(0 0 30px rgba(251, 113, 133, 0.8))", // softer pink-rose (second place)
      3: "drop-shadow(0 0 30px rgba(159, 18, 57, 0.8))",   // deep crimson-rose (third place)
    } as Record<1 | 2 | 3, string>,

    showInstagram: true,
  },
} as const;

const PACK = PACKS[THEME] || PACKS.manatee;

// ===== Shared button styles =====
const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black w-56";

// External brand colors
const KICK_GREEN = "#53FC18";
const RAINBET_BLUE = "#10216E";

// ===== Types & helpers =====
type Affiliate = { username?: string; id?: string; wagered_amount?: string };
type AffiliatesResponse = { affiliates?: Affiliate[]; cache_updated_at?: string };

function parseAmount(x?: string) {
  const n = parseFloat(x || "0");
  return Number.isFinite(n) ? n : 0;
}
function formatMoney(amount: number) {
  // Wagered formatting stays USD to match backend numbers
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
function maskUsername(username: string) {
  if (!username) return "—";
  if (username.length <= 4) return username;
  return username.slice(0, 2) + "*".repeat(username.length - 3) + username[username.length - 1];
}

// ===== Data fetch =====
async function fetchAffiliates(start_at: string, end_at: string): Promise<AffiliatesResponse> {
  const base = process.env.RAINBET_API_BASE || "https://services.rainbet.com/v1";
  const key = process.env.RAINBET_API_KEY || "";
  const url = `${base}/external/affiliates`;

  // 🔍 Debug log
  console.log("Rainbet API Request:", {
    url,
    params: { start_at, end_at, key },
  });

  const res = await axios.get(url, {
    params: { start_at, end_at, key },
    headers: { Accept: "application/json" },
    validateStatus: () => true,
  });

  if (res.status !== 200) {
    throw new Error(`Rainbet API ${res.status}: ${JSON.stringify(res.data)}`);
  }
  return res.data;
}


/** ======================================================
 *  PRIZES from env "PRIZES" (variable length)
 *  Accepted formats:
 *   - CSV: "400,200,125"
 *   - JSON numbers: [400,200,125]
 *   - JSON objects: [{"rank":1,"amount":400}, ...]
 *  Currency:
 *   - PRIZE_CURRENCY = USD|CAD|EUR|...
 *   - (optional) PRIZE_CURRENCY_SYMBOL (e.g., "C$")
 *  ====================================================== */
type PrizeRow = { rank: number; amount: number };
function parsePrizeRows(raw: string | undefined): PrizeRow[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      if (!parsed.length) return [];
      if (typeof parsed[0] === "number") {
        return parsed.map((amt: number, i: number) => ({ rank: i + 1, amount: Number(amt) }))
                     .filter(r => Number.isFinite(r.amount));
      }
      if (typeof parsed[0] === "object") {
        return parsed
          .map((r: any) => ({ rank: Number(r?.rank), amount: Number(r?.amount) }))
          .filter(r => Number.isFinite(r.rank) && r.rank >= 1 && Number.isFinite(r.amount))
          .sort((a, b) => a.rank - b.rank);
      }
    }
  } catch {
    // Not JSON → treat as CSV
  }
  const nums = trimmed.split(",").map(s => Number(s.trim())).filter(n => Number.isFinite(n));
  return nums.map((amount, i) => ({ rank: i + 1, amount }));
}
function rowsToMap(rows: PrizeRow[]): Record<number, number> {
  const out: Record<number, number> = {};
  for (const r of rows) if (r.rank >= 1 && Number.isFinite(r.amount)) out[r.rank] = r.amount;
  return out;
}
const PRIZES: Record<number, number> = rowsToMap(parsePrizeRows(process.env.PRIZES));

const PRIZE_CURRENCY = (process.env.PRIZE_CURRENCY || "USD").toUpperCase();
const PRIZE_CURRENCY_SYMBOL =
  process.env.PRIZE_CURRENCY_SYMBOL ||
  ({ USD: "$", CAD: "C$", EUR: "€", GBP: "£" } as Record<string, string>)[PRIZE_CURRENCY] ||
  `${PRIZE_CURRENCY} `;
function formatPrize(amount: number) {
  const whole = Math.round(amount);
  return `${PRIZE_CURRENCY_SYMBOL}${whole.toLocaleString("en-US")}`;
}

/** ======================================================
 *  PERIODS (auto-advancing)
 *  PERIOD_MODE = weeklysaturdaynight | weeklysundaynight | monthly | custom
 *  For custom: PERIOD_START=YYYY-MM-DD, PERIOD_LENGTH_DAYS=N
 *  All API dates are YYYY-MM-DD in UTC (inclusive).
 *  ====================================================== */
type Period = { startDate: string; endDate: string; label: string; endUtc: Date };

/**  ⬇ Default to MONTHLY so it runs 1st → last day (UTC) out-of-the-box */
const PERIOD_MODE = (process.env.PERIOD_MODE || "monthly").toLowerCase() as
  | "weeklysaturdaynight"
  | "weeklysundaynight"
  | "monthly"
  | "custom";

function pad2(n: number) { return String(n).padStart(2, "0"); }
function ymdUTC(d: Date) { return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`; }
function atUTC(y: number, m1: number, d: number, hh=0, mm=0, ss=0, ms=0) { return new Date(Date.UTC(y, m1-1, d, hh, mm, ss, ms)); }
function addDaysUTC(d: Date, days: number) { const x = new Date(d); x.setUTCDate(x.getUTCDate() + days); return x; }

function getMonthlyPeriod(now = new Date()): Period {
  const start = atUTC(now.getUTCFullYear(), now.getUTCMonth()+1, 1, 0,0,0,0);
  const end = atUTC(now.getUTCFullYear(), now.getUTCMonth()+1+1, 0, 23,59,59,999);
  return { startDate: ymdUTC(start), endDate: ymdUTC(end), endUtc: end, label: `${ymdUTC(start)} → ${ymdUTC(end)}` };
}
function getWeeklySatNight(now = new Date()): Period {
  const dow = now.getUTCDay(); // 0 Sun..6 Sat
  const sunday = addDaysUTC(atUTC(now.getUTCFullYear(), now.getUTCMonth()+1, now.getUTCDate()), -dow);
  const saturday = addDaysUTC(sunday, 6);
  const end = atUTC(saturday.getUTCFullYear(), saturday.getUTCMonth()+1, saturday.getUTCDate(), 23,59,59,999);
  return { startDate: ymdUTC(sunday), endDate: ymdUTC(saturday), endUtc: end, label: `${ymdUTC(sunday)} → ${ymdUTC(saturday)}` };
}
function getWeeklySunNight(now = new Date()): Period {
  const dow = now.getUTCDay(); // 0 Sun..6 Sat
  const monday = addDaysUTC(atUTC(now.getUTCFullYear(), now.getUTCMonth()+1, now.getUTCDate()), -(dow === 0 ? 6 : (dow - 1)));
  const sunday = addDaysUTC(monday, 6);
  const end = atUTC(sunday.getUTCFullYear(), sunday.getUTCMonth()+1, sunday.getUTCDate(), 23,59,59,999);
  return { startDate: ymdUTC(monday), endDate: ymdUTC(sunday), endUtc: end, label: `${ymdUTC(monday)} → ${ymdUTC(sunday)}` };
}
function getCustomPeriod(now = new Date()): Period {
  const startEnv = (process.env.PERIOD_START || "").trim(); // YYYY-MM-DD
  const len = Math.max(1, Number(process.env.PERIOD_LENGTH_DAYS || 7));
  const [y,m,d] = (startEnv || ymdUTC(now)).split("-").map(Number);
  let start = atUTC(y, m, d, 0,0,0,0);
  const one = (s: Date) => ({ start: s, end: addDaysUTC(s, len-1) });
  let cur = one(start);
  // while (now.getTime() > atUTC(cur.end.getUTCFullYear(), cur.end.getUTCMonth()+1, cur.end.getUTCDate(), 23,59,59,999).getTime()) {
  //   start = addDaysUTC(start, len);
  //   cur = one(start);
  // }
  const end = atUTC(cur.end.getUTCFullYear(), cur.end.getUTCMonth()+1, cur.end.getUTCDate(), 23,59,59,999);
  return { startDate: ymdUTC(cur.start), endDate: ymdUTC(cur.end), endUtc: end, label: `${ymdUTC(cur.start)} → ${ymdUTC(cur.end)}` };
}

function computePeriod(): Period {
  switch (PERIOD_MODE) {
    case "monthly": return getMonthlyPeriod();
    case "weeklysundaynight": return getWeeklySunNight();
    case "custom": return getCustomPeriod();
    case "weeklysaturdaynight":
    default: return getWeeklySatNight();
  }
}

// -------------- Display helpers (NY label for week/month copy only) --------------
function getHumanPeriodLabel(): "Week" | "Month" | "Period" {
  if (PERIOD_MODE === "monthly") return "Month";
  if (PERIOD_MODE === "weeklysaturdaynight" || PERIOD_MODE === "weeklysundaynight") return "Week";
  return "Period";
}

/** =========================
 *  Small UI components
 *  ========================= */
function StickyHeader() {
  return (
    <div className={PACK.stickyHeaderClass}>
      <div className="mx-auto flex max-w-6xl items-center justify-center px-6 py-2">
        <div className="relative h-12 w-40 sm:h-16 sm:w-56 md:h-20 md:w-72">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
        </div>
      </div>
    </div>
  );
}

function BackgroundArt() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-black" />
      <Image src="/animation.gif" alt="" fill priority className="object-cover opacity-[0.35]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
    </div>
  );
}

function DiscordButton({ className = "" }: { className?: string }) {
  const href = process.env.DISCORD_INVITE_URL || "#";
  return (
    <Link
      href={href}
      className={`${BTN_BASE} text-white ${className}`}
      style={{ backgroundColor: "#5865F2" }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.211.375-.444.864-.608 1.249-1.844-.276-3.68-.276-5.486 0-.164-.398-.418-.874-.63-1.249a.077.077 0 00-.079-.037 19.736 19.736 0 00-4.885 1.515.07.07 0 00-.032.027C.533 9.045-.32 13.58.099 18.06a.082.082 0 00.031.056 19.9 19.9 0 006.01 3.049.078.078 0 00.084-.027c.462-.63.874-1.295 1.226-1.994a.078.078 0 00-.042-.109 12.98 12.98 0 01-1.852-.882.078.078 0 01-.008-.131c.125-.094.25-.192.369-.291a.076.076 0 01-.079-.01c3.89 1.793 8.105 1.793 11.95 0a.076.076 0 01.08.01c.12.099.244.197.37.291a.078.078 0 01-.006.131 12.64 12.64 0 01-1.853.882.078.078 0 00-.041.11c.36.698.772 1.363 1.225 1.993a.078.078 0 00.084.028 19.9 19.9 0 006.011-3.049.079.079 0 00.031-.055z"/>
      </svg>
      Join Discord
    </Link>
  );
}

function InstagramButton() {
  if (!PACK.showInstagram) return null;
  const href = process.env.INSTAGRAM_URL || "#";
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${BTN_BASE} text-white bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:brightness-110`}
      aria-label="Open Instagram"
    >
      {/* Instagram glyph */}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H7zm5 3a6 6 0 110 12 6 6 0 010-12zm0 2.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM18 6.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5z"/>
      </svg>
      Instagram
    </Link>
  );
}


function Podium({ top }: { top: Affiliate[] }) {
  const [first, second, third] = top;

  const medalSrc: Record<number, string> = {
    1: "/medal-gold.png",
    2: "/medal-silver.png",
    3: "/medal-bronze.png",
  };

  const glowByRank: Record<1 | 2 | 3, string> = PACK.medalGlow

  const Medal = ({ rank }: { rank: 1 | 2 | 3 }) => (
    <div className={`w-40 h-40 shrink-0 flex items-center justify-center rounded-full ring-2 ${PACK.BRAND.ring} bg-zinc-900/60 backdrop-blur-sm`}>
      <Image
        src={medalSrc[rank]}
        alt={`Rank ${rank}`}
        width={150}
        height={150}
        className="block object-contain"
        style={{ filter: glowByRank[rank] }}
        priority
      />
    </div>
  );

  const card = (a: Affiliate | undefined, rank: 1 | 2 | 3) => {
    const prize = PRIZES[rank];
    return (
      <div className="flex flex-col items-center justify-start rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm min-h-[18rem] w-full p-3">
        <Medal rank={rank} />
        <div className="mt-2 text-xs text-zinc-400">#{rank}</div>
        <div className="mt-1 min-h-[2.25rem] w-full">
          <div className="text-center text-lg font-bold text-zinc-100 leading-snug break-words max-w-[22ch] mx-auto">
            {maskUsername(a?.username ?? "")}
          </div>
        </div>
        <div className="mt-1 min-h-[2.25rem] flex items-center">
          <div className={`text-2xl font-extrabold ${PACK.BRAND.accent}`}>
            {formatMoney(parseAmount(a?.wagered_amount))}
          </div>
        </div>
        {prize ? (
          <div className={`mt-2 rounded-full border ${PACK.BRAND.pillBorder} ${PACK.BRAND.pillBg} px-3 py-1 text-sm text-sky-200`}>
            Prize: ${prize}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:items-end">
      <div className="order-2 sm:order-1">{card(second, 2)}</div>
      <div className="order-1 sm:order-2">{card(first, 1)}</div>
      <div className="order-3 sm:order-3">{card(third, 3)}</div>
    </div>
  );
}


/* =========================
 * COUNTDOWN PILL (UTC)
 * ========================= */
function CountdownBadgeUTC({
  endY,
  endM,
  endD,
  endHourUTC = 23,
  endMinuteUTC = 59,
  endSecondUTC = 59,
}: {
  endY: number;
  endM: number;
  endD: number;
  endHourUTC?: number;
  endMinuteUTC?: number;
  endSecondUTC?: number;
}) {
  const id = "countdown-utc";
  const script = `
    (function(){
      var target = Date.UTC(${endY}, ${endM - 1}, ${endD}, ${endHourUTC}, ${endMinuteUTC}, ${endSecondUTC}, 0);
      function pad(n){ return String(n).padStart(2,'0'); }
      function tick(){
        var el = document.getElementById('${id}');
        if(!el){ return; }
        var now = Date.now();
        var diff = Math.max(0, target - now);
        var d = Math.floor(diff / 86400000); diff -= d*86400000;
        var h = Math.floor(diff / 3600000);  diff -= h*3600000;
        var m = Math.floor(diff / 60000);    diff -= m*60000;
        var s = Math.floor(diff / 1000);
        el.textContent = d + 'd ' + pad(h) + ':' + pad(m) + ':' + pad(s);
      }
      tick();
      setInterval(tick, 1000);
    })();
  `;
  return (
    <div className={`inline-flex items-center gap-3 rounded-full border ${PACK.BRAND.pillBorder} ${PACK.BRAND.pillBg} backdrop-blur-sm px-5 py-2 text-base font-semibold text-sky-100`}>
      <span className="uppercase tracking-wide">Time left (UTC):</span>
      <span id={id} className="font-bold text-lg">—</span>
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </div>
  );
}

/* =========================
 * PAGE
 * ========================= */
export default async function Page() {
  // ---- Determine active period (with auto-advance) ----
  const period = computePeriod();
  const { startDate, endDate, endUtc } = period;

  // ---- Fetch current & previous period rows ----
  let rows: Affiliate[] = [];
  let prevRows: Affiliate[] = [];
  let error: string | null = null;

  try {
    // previous period = shift back by the same length
    const lengthDays = Math.ceil((atUTC(endUtc.getUTCFullYear(), endUtc.getUTCMonth()+1, endUtc.getUTCDate()).getTime()
      - atUTC(Number(startDate.slice(0,4)), Number(startDate.slice(5,7)), Number(startDate.slice(8,10))).getTime()) / 86400000) + 1;

    const prevEnd = addDaysUTC(atUTC(Number(startDate.slice(0,4)), Number(startDate.slice(5,7)), Number(startDate.slice(8,10))), -1);
    const prevStart = addDaysUTC(prevEnd, -lengthDays + 1);

    const [cur, prev] = await Promise.all([
      fetchAffiliates(startDate, endDate),
      fetchAffiliates(ymdUTC(prevStart), ymdUTC(prevEnd)),
    ]);
    rows = cur?.affiliates || [];
    prevRows = prev?.affiliates || [];
  } catch (e: any) {
    error = e?.message || "Failed to load";
  }

  // ---- Derived values ----
  const sorted = [...rows].sort((a, b) => parseAmount(b.wagered_amount) - parseAmount(a.wagered_amount));
  const top3 = sorted.slice(0, 3);
  const top10 = sorted.slice(0, 10);
  const participants = sorted.length;
  const totalWagered = sorted.reduce((acc, r) => acc + parseAmount(r.wagered_amount), 0);
  const lastWinner =
    [...prevRows].sort((a, b) => parseAmount(b.wagered_amount) - parseAmount(a.wagered_amount))[0] || null;

  const updatedAtUTC = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const referralUrl = process.env.RAINBET_REFERRAL_URL || "#";
  const kickUrl = process.env.KICK_URL || "#";
  const totalPrizePool = Object.values(PRIZES).reduce((a, b) => a + b, 0);

  // ---- Countdown target pieces ----
  const endY = endUtc.getUTCFullYear();
  const endM = endUtc.getUTCMonth() + 1;
  const endD = endUtc.getUTCDate();

  // ---- Dynamic label for "Last X’s Winner" ----
  let lastWinnerLabel = `Last ${getHumanPeriodLabel()} Winner:`;
  if (getHumanPeriodLabel() == "Period") {
    lastWinnerLabel = `Last Winner:`;
  }

  return (
    <main className={`relative z-10 mx-auto max-w-none p-0 text-zinc-100 ${PACK.BRAND.bg}`}>
      <BackgroundArt />
      <StickyHeader />

      {/* HERO */}
      <section className={`mx-auto mt-4 max-w-6xl rounded-3xl border border-zinc-800 bg-gradient-to-b ${PACK.BRAND.panelFrom} ${PACK.BRAND.panelTo} p-6 backdrop-blur-sm`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Left logo */}
            <div className="relative h-20 w-56 sm:h-24 sm:w-72 md:h-28 md:w-80">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Rainbet Leaderboards</h1>
              <p className="text-sm text-zinc-300">{getHumanPeriodLabel()} · {startDate} → {endDate}</p>
              <p className="mt-1 text-sm font-medium text-zinc-300 whitespace-nowrap">Updated: {updatedAtUTC}</p>
            </div>
          </div>

          {/* Right column buttons */}
          <div className="flex flex-col items-end gap-2">
            <DiscordButton />
            <Link
              href={referralUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${BTN_BASE} text-white hover:brightness-110`}
              style={{ backgroundColor: RAINBET_BLUE }}
            >
              Join Rainbet
            </Link>
            <Link
              href={kickUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${BTN_BASE} text-black hover:brightness-110`}
              style={{ backgroundColor: KICK_GREEN }}
            >
              Watch on Kick
            </Link>
            <InstagramButton />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Participants" value={participants.toString()} />
          <StatCard label="Total Wagered" value={formatMoney(totalWagered)} />
          <StatCard label="Total Prize Pool" value={totalPrizePool ? formatPrize(totalPrizePool) : "—"} />
        </div>

        {/* Last [Period] Winner + Countdown */}
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            {getHumanPeriodLabel() != "Period" && (<div>
                <span className="text-zinc-300">{lastWinnerLabel} </span>
                <span className="font-semibold text-zinc-100">
                  {maskUsername(lastWinner.username ?? lastWinner.id ?? "—")}
                </span>{" "}
                <span className={`${PACK.BRAND.accent} font-semibold`}>
                  {formatMoney(parseAmount(lastWinner.wagered_amount))}
                </span>
            </div>)}
          
          </div>
          <div className="sm:shrink-0">
            <CountdownBadgeUTC
              endY={endY}
              endM={endM}
              endD={endD}
              endHourUTC={23}
              endMinuteUTC={59}
              endSecondUTC={59}
            />
          </div>
        </div>
        

        {/* Podium */}
        <div className="mt-6">
          <h2 className="mb-8 text-lg font-semibold">Champions Podium</h2>
          {top3.length ? (
            <Podium top={top3} />
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-6 text-zinc-400">No data available</div>
          )}
        </div>
      </section>

      {/* TABLE */}
      <section className="mx-auto mt-6 max-w-6xl rounded-3xl border border-zinc-800 bg-zinc-950/70 backdrop-blur-sm p-6">
        <h3 className="mb-4 text-lg font-semibold">Participants (Top 10)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-zinc-300">
                <th className="p-3">#</th>
                <th className="p-3">Affiliate</th>
                <th className="p-3">Wagered</th>
                <th className="p-3">Prize</th>
              </tr>
            </thead>
            <tbody>
              {top10.map((r, i) => {
                const rank = i + 1;
                const prize = PRIZES[rank];
                return (
                  <tr key={String(r.id ?? r.username ?? i)} className="border-t border-zinc-800 hover:bg-zinc-900/40">
                    <td className="p-3 text-zinc-400">{rank}</td>
                    <td className="p-3 font-medium text-zinc-100">{maskUsername(r.username ?? r.id ?? "—")}</td>
                    <td className={`p-3 font-semibold ${PACK.BRAND.accent}`}>{formatMoney(parseAmount(r.wagered_amount))}</td>
                    <td className="p-3">
                      {typeof prize === "number" ? (
                        <span className={`inline-block rounded-full border ${PACK.BRAND.pillBorder} ${PACK.BRAND.pillBg} px-2 py-0.5 text-xs text-white/80`}>
                          {formatPrize(prize)}
                        </span>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!top10.length && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-zinc-500">No entrants yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {error && <p className="mx-auto mt-4 max-w-6xl p-6 text-sm text-red-400">Error: {error}</p>}
    </main>
  );
}

/** =========================
 *  Small cards used above
 *  ========================= */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-100">{value}</p>
    </div>
  );
}
