// app/page.tsx
import axios from "axios";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Brand colors inspired by the MANATEE logo
const BRAND = {
  bg: "bg-black",
  // slightly lighter gradient so the background art peeks through
  panelFrom: "from-rose-900/20",
  panelTo: "to-black/60",
  accent: "text-rose-400",
  ring: "ring-rose-700/40",
  btn: "bg-rose-600 hover:bg-rose-500 focus-visible:ring-rose-400",
};

// Brand buttons (sizes/style shared across Discord/Rainbet/Kick)
const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black w-56";

// External brand colors
const KICK_GREEN = "#53FC18";   // Kick signature green
const RAINBET_BLUE = "#10216E"; // Rainbet navy/catalina blue

type Affiliate = {
  username?: string;
  id?: string;
  wagered_amount?: string;
};

type AffiliatesResponse = {
  affiliates?: Affiliate[];
  cache_updated_at?: string;
};

// ======== (legacy) helpers kept if you need locally-tz math elsewhere ========
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function sundayOfWeek(d: Date) {
  const x = new Date(d);
  const diff = x.getDay(); // 0 = Sunday
  x.setDate(x.getDate() - diff);
  return startOfDay(x);
}

// ===================== UTC week helpers (for API queries & countdown) =====================
function getWeeklyRangeUTC() {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday
  const sundayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day, 0, 0, 0, 0));
  const saturdayUTC = new Date(sundayUTC);
  saturdayUTC.setUTCDate(saturdayUTC.getUTCDate() + 6);
  // End-of-day Saturday for API date string; countdown uses midnight of this same day (see below)
  saturdayUTC.setUTCHours(23, 59, 59, 999);

  const fmt = (dt: Date) => dt.toISOString().slice(0, 10);
  return {
    startDate: fmt(sundayUTC),   // YYYY-MM-DD (Sun)
    endDate: fmt(saturdayUTC),   // YYYY-MM-DD (Sat)
    _sundayUTC: sundayUTC,
    _saturdayUTC: saturdayUTC,
  };
}

function getLastWeekRangeUTC() {
  const { _sundayUTC } = getWeeklyRangeUTC();
  const prevSundayUTC = new Date(_sundayUTC);
  prevSundayUTC.setUTCDate(prevSundayUTC.getUTCDate() - 7);
  const prevSaturdayUTC = new Date(prevSundayUTC);
  prevSaturdayUTC.setUTCDate(prevSaturdayUTC.getUTCDate() + 6);
  prevSaturdayUTC.setUTCHours(23, 59, 59, 999);

  const fmt = (dt: Date) => dt.toISOString().slice(0, 10);
  return {
    startDate: fmt(prevSundayUTC),
    endDate: fmt(prevSaturdayUTC),
  };
}

async function fetchAffiliates(start_at: string, end_at: string): Promise<AffiliatesResponse> {
  const base = process.env.RAINBET_API_BASE || "https://services.rainbet.com/v1";
  const key = process.env.RAINBET_API_KEY || "";
  const url = `${base}/external/affiliates`;

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

function parseAmount(x?: string) {
  const n = parseFloat(x || "0");
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// Mask: first 2 letters + last, stars in the middle
function maskUsername(username: string) {
  if (username.length <= 4) return username;
  return username.slice(0, 2) + "*".repeat(username.length - 3) + username[username.length - 1];
}

// ✨ Weekly prizes (USD)
const PRIZES: Record<number, number> = {
  1: 100,
  2: 60,
  3: 40,
  4: 30,
  5: 20,
};

// ---------- Display helpers in America/New_York (for header only) ----------
function getNYParts(d: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const asObj = (parts: Intl.DateTimeFormatPart[]) =>
    parts.reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});
  const o = asObj(fmt);

  return {
    year: Number(o.year),
    month: Number(o.month),
    day: Number(o.day),
    hour: Number(o.hour),
    minute: Number(o.minute),
    second: Number(o.second),
    weekdayShort: (fmt.find((p) => p.type === "weekday")?.value || "Sun") as
      | "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat",
  };
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function dateFromYMD(y: number, m: number, d: number) {
  return new Date(y, m - 1, d);
}

// Returns NY week display "YYYY-MM-DD → YYYY-MM-DD" (Sun → Sat)
function getNYWeekDisplay() {
  const now = new Date();
  const ny = getNYParts(now);

  // "NY today" as a simple local Date carrying the NY calendar day
  const nyTodayLocal = dateFromYMD(ny.year, ny.month, ny.day);

  // Find NY Sunday of this week
  const nySundayLocal = new Date(nyTodayLocal);
  nySundayLocal.setDate(nySundayLocal.getDate() - WEEKDAY_INDEX[ny.weekdayShort]);

  // NY Saturday end (same week)
  const nySaturdayLocal = new Date(nySundayLocal);
  nySaturdayLocal.setDate(nySaturdayLocal.getDate() + 6);

  const displayStart = `${nySundayLocal.getFullYear()}-${pad2(nySundayLocal.getMonth() + 1)}-${pad2(nySundayLocal.getDate())}`;
  const displayEnd = `${nySaturdayLocal.getFullYear()}-${pad2(nySaturdayLocal.getMonth() + 1)}-${pad2(nySaturdayLocal.getDate())}`;

  return { displayStart, displayEnd };
}

// ---------------- Small UI pieces ----------------
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

// ✅ Sticky logo header (centered & larger)
function StickyHeader() {
  return (
    <div className="sticky top-0 z-50 border-b border-zinc-800 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/50">
      <div className="mx-auto flex max-w-6xl items-center justify-center px-6 py-2">
        <div className="relative h-12 w-40 sm:h-16 sm:w-56 md:h-20 md:w-72">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
        </div>
      </div>
    </div>
  );
}

// ✅ Background art layer (black base + semi-opaque image)
function BackgroundArt() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      {/* black base keeps site dark */}
      <div className="absolute inset-0 bg-black" />
      <Image
        src="/blood-overlay.png"
        alt=""
        fill
        priority
        className="object-contain md:object-cover opacity-[0.35]"
      />
      {/* subtle vignette for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
    </div>
  );
}

// Buttons
function DiscordButton({ className = "" }: { className?: string }) {
  const href = process.env.DISCORD_INVITE_URL || "#";
  return (
    <Link
      href={href}
      className={`${BTN_BASE} ${BRAND.btn} text-white ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.211.375-.444.864-.608 1.249-1.844-.276-3.68-.276-5.486 0-.164-.398-.418-.874-.63-1.249a.077.077 0 00-.079-.037 19.736 19.736 0 00-4.885 1.515.07.07 0 00-.032.027C.533 9.045-.32 13.58.099 18.06a.082.082 0 00.031.056 19.9 19.9 0 006.01 3.049.078.078 0 00.084-.027c.462-.63.874-1.295 1.226-1.994a.078.078 0 00-.042-.109 12.98 12.98 0 01-1.852-.882.078.078 0 01-.008-.131c.125-.094.25-.192.369-.291a.076.076 0 01-.079-.01c3.89 1.793 8.105 1.793 11.95 0a.076.076 0 01.08.01c.12.099.244.197.37.291a.078.078 0 01-.006.131 12.64 12.64 0 01-1.853.882.078.078 0 00-.041.11c.36.698.772 1.363 1.225 1.993a.078.078 0 00.084.028 19.9 19.9 0 006.011-3.049.079.079 0 00.031-.055zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.957-2.419 2.157-2.419s2.184 1.097 2.157 2.419c0 1.334-.957 2.419-2.157 2.419zm7.975 0c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.957-2.419 2.157-2.419s2.184 1.097 2.157 2.419c0 1.334-.957 2.419-2.157 2.419z"/>
      </svg>
      Join Discord
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

  const glowByRank: Record<1 | 2 | 3, string> = {
    1: "drop-shadow(0 0 30px rgba(251,191,36,0.8))",
    2: "drop-shadow(0 0 30px rgba(212,212,212,0.8))",
    3: "drop-shadow(0 0 30px rgba(205,127,50,0.8))",
  };

  const Medal = ({ rank }: { rank: 1 | 2 | 3 }) => (
    <div className={`w-40 h-40 shrink-0 flex items-center justify-center rounded-full ring-2 ${BRAND.ring} bg-zinc-900/60 backdrop-blur-sm`}>
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
          <div className={`text-2xl font-extrabold ${BRAND.accent}`}>
            {formatMoney(parseAmount(a?.wagered_amount))}
          </div>
        </div>
        {prize ? (
          <div className="mt-2 rounded-full border border-rose-700/40 bg-rose-900/30 px-3 py-1 text-sm text-rose-200">
            Prize: C${prize}
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

// ---------------- Countdown to Saturday 00:00 UTC (midnight, no hooks) ----------------
function CountdownBadgeUTC({
  endY,
  endM,
  endD,
  endHourUTC = 0,
  endMinuteUTC = 0,
  endSecondUTC = 0,
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
  // Bigger pill + bigger numbers
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-rose-700/40 bg-rose-900/40 backdrop-blur-sm px-5 py-2 text-base font-semibold text-rose-100">
      <span className="uppercase tracking-wide">Time left:</span>
      <span id={id} className="font-bold text-lg">—</span>
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </div>
  );
}

// ---------------- Page ----------------
export default async function Page() {
  // Server-side API ranges (UTC week Sun→Sat)
  const { startDate, endDate, _saturdayUTC } = getWeeklyRangeUTC();
  const { startDate: lastStart, endDate: lastEnd } = getLastWeekRangeUTC();

  let rows: Affiliate[] = [];
  let lastWeekRows: Affiliate[] = [];
  let error: string | null = null;

  try {
    const [thisWeek, lastWeek] = await Promise.all([
      fetchAffiliates(startDate, endDate),
      fetchAffiliates(lastStart, lastEnd),
    ]);
    rows = thisWeek?.affiliates || [];
    lastWeekRows = lastWeek?.affiliates || [];
  } catch (e: any) {
    error = e?.message || "Failed to load";
  }

  const sorted = [...rows].sort((a, b) => parseAmount(b.wagered_amount) - parseAmount(a.wagered_amount));
  const participants = sorted.length;
  const totalWagered = sorted.reduce((acc, r) => acc + parseAmount(r.wagered_amount), 0);
  const top3 = sorted.slice(0, 3);
  const top10 = sorted.slice(0, 10);

  // Last week's winner (masked)
  const lastWeekWinner =
    [...lastWeekRows]
      .sort((a, b) => parseAmount(b.wagered_amount) - parseAmount(a.wagered_amount))[0] || null;

  // 🕒 Updated timestamp (under the date range)
  const updatedAt = new Date().toLocaleString();

  // 💰 Total prize pool
  const totalPrizePool = Object.values(PRIZES).reduce((a, b) => a + b, 0);

  // External links
  const referralUrl = process.env.RAINBET_REFERRAL_URL || "#";
  const kickUrl = process.env.KICK_URL || "#";

  // Display header range in America/New_York (Sun→Sat)
  const { displayStart, displayEnd } = getNYWeekDisplay();

  // Countdown target = this week's Saturday 00:00:00 UTC
  const endY = _saturdayUTC.getUTCFullYear();
  const endM = _saturdayUTC.getUTCMonth() + 1;
  const endD = _saturdayUTC.getUTCDate();

  return (
    <main className="relative z-10 mx-auto max-w-none p-0 text-zinc-100 bg-transparent">
      {/* Background art sits behind everything */}
      <BackgroundArt />

      {/* Sticky header */}
      <StickyHeader />

      {/* HERO with logo + buttons column */}
      <section className={`mx-auto mt-4 max-w-6xl rounded-3xl border border-zinc-800 bg-gradient-to-b ${BRAND.panelFrom} ${BRAND.panelTo} p-6 backdrop-blur-sm`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Hero logo (kept) */}
            <div className="relative h-16 w-48 sm:h-20 sm:w-64">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Rainbet Leaderboards</h1>
              <p className="text-sm text-zinc-300">This Week · {displayStart} → {displayEnd}</p>
              <p className="mt-1 text-sm font-medium text-zinc-300 whitespace-nowrap">Updated: {updatedAt}</p>
              {/* Countdown moved down next to the winner row */}
            </div>
          </div>

          {/* Right column: three matching buttons stacked */}
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
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Participants" value={participants.toString()} />
          <StatCard label="Total Wagered" value={formatMoney(totalWagered)} />
          <StatCard label="Total Prize Pool" value={`C$${totalPrizePool}`} />
        </div>

        {/* Last Week Winner + Countdown (right) */}
        {lastWeekWinner && (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-zinc-300">Last Week’s Winner: </span>
              <span className="font-semibold text-zinc-100">
                {maskUsername(lastWeekWinner.username ?? "")}
              </span>{" "}
              <span className={`${BRAND.accent} font-semibold`}>
                {formatMoney(parseAmount(lastWeekWinner.wagered_amount))}
              </span>
            </div>
            {/* Countdown on the right */}
            <div className="sm:shrink-0">
              <CountdownBadgeUTC
                endY={endY}
                endM={endM}
                endD={endD}
                endHourUTC={0}
                endMinuteUTC={0}
                endSecondUTC={0}
              />
            </div>
          </div>
        )}

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

      {/* TABLE (Top 10) */}
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
                const name = r.username ?? r.id ?? "—";
                const rank = i + 1;
                const prize = PRIZES[rank];
                return (
                  <tr key={String(r.id ?? r.username ?? i)} className="border-t border-zinc-800 hover:bg-zinc-900/40">
                    <td className="p-3 text-zinc-400">{rank}</td>
                    <td className="p-3 font-medium text-zinc-100">{maskUsername(name)}</td>
                    <td className={`p-3 font-semibold ${BRAND.accent}`}>{formatMoney(parseAmount(r.wagered_amount))}</td>
                    <td className="p-3">
                      {prize ? (
                        <span className="inline-block rounded-full border border-rose-700/40 bg-rose-900/30 px-2 py-0.5 text-rose-200 text-xs">
                          C${prize}
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
                  <td colSpan={4} className="p-6 text-center text-zinc-500">No warriors match your search</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="mt-3 text-xs text-zinc-400">Total Weekly Prizes: ${totalPrizePool}</div>
        </div>
      </section>

      {/* Error */}
      {error && <p className="mx-auto mt-4 max-w-6xl p-6 text-sm text-red-400">Error: {error}</p>}
    </main>
  );
}
