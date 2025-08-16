// app/page.tsx
import axios from "axios";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Brand colors inspired by the MANATEE logo
const BRAND = {
  bg: "bg-black",
  panelFrom: "from-rose-900/30",
  panelTo: "to-black",
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

// === Helpers: week ranges & formatting ===
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

// Current week: Sunday -> today (EoD)
function getThisWeekRangeFromSunday() {
  const today = new Date();
  const start = sundayOfWeek(today);
  const end = endOfDay(today);
  const fmt = (dt: Date) => dt.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end), _start: start, _end: end };
}

// Last week: previous Sunday -> previous Saturday (EoD)
function getLastWeekRange() {
  const thisStart = sundayOfWeek(new Date());
  const prevSunday = new Date(thisStart);
  prevSunday.setDate(prevSunday.getDate() - 7);
  const prevSaturday = new Date(thisStart);
  prevSaturday.setDate(prevSaturday.getDate() - 1);
  const fmt = (dt: Date) => dt.toISOString().slice(0, 10);
  return { startDate: fmt(prevSunday), endDate: fmt(endOfDay(prevSaturday)) };
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

// ✅ Make DiscordButton accept an optional className so we can match sizes
function DiscordButton({ className = "" }: { className?: string }) {
  const href = process.env.DISCORD_INVITE_URL || "#";
  return (
    <Link
      href={href}
      className={`${BTN_BASE} ${BRAND.btn} text-white ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.211.375-.444.864-.608 1.249-1.844-.276-3.68-.276-5.486 0-.164-.398-.418-.874-.63-1.249a.077.077 0 00-.079-.037 19.736 19.736 0 00-4.885 1.515.07.07 0 00-.032.027C.533 9.045-.32 13.58.099 18.06a.082.082 0 00.031.056 19.9 19.9 0 006.01 3.049.078.078 0 00.084-.027c.462-.63.874-1.295 1.226-1.994a.078.078 0 00-.042-.109 12.98 12.98 0 01-1.852-.882.078.078 0 01-.008-.131c.125-.094.25-.192.369-.291a.076.076 0 01.079-.01c3.89 1.793 8.105 1.793 11.95 0a.076.076 0 01.08.01c.12.099.244.197.37.291a.078.078 0 01-.006.131 12.64 12.64 0 01-1.853.882.078.078 0 00-.041.11c.36.698.772 1.363 1.225 1.993a.078.078 0 00.084.028 19.9 19.9 0 006.011-3.049.079.079 0 00.031-.055c.5-5.177-.838-9.673-3.548-13.665a.061.061 0 00-.032-.027zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.957-2.419 2.157-2.419s2.184 1.097 2.157 2.419c0 1.334-.957 2.419-2.157 2.419zm7.975 0c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.957-2.419 2.157-2.419s2.184 1.097 2.157 2.419c0 1.334-.957 2.419-2.157 2.419z"/>
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

  // softer glow (kept subtle)
  const glowByRank: Record<1 | 2 | 3, string> = {
    1: "drop-shadow(0 0 30px rgba(251,191,36,0.8))",   // gold
    2: "drop-shadow(0 0 30px rgba(212,212,212,0.8))",  // silver
    3: "drop-shadow(0 0 30px rgba(205,127,50,0.8))",   // bronze
  };

  const Medal = ({ rank }: { rank: 1 | 2 | 3 }) => (
    <div className={`w-40 h-40 shrink-0 flex items-center justify-center rounded-full ring-2 ${BRAND.ring} bg-zinc-900/70`}>
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

  // equal-height cards for clean alignment; names masked
  const card = (a: Affiliate | undefined, rank: 1 | 2 | 3, _tall = false) => {
    const prize = PRIZES[rank];
    return (
      <div className="flex flex-col items-center justify-start rounded-2xl border border-zinc-800 bg-zinc-900/60 min-h-[18rem] w-full p-3">
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
            Prize: ${prize}
          </div>
        ) : null}
      </div>
    );
  };

  // 🔁 Order fix:
  // - Mobile (grid-cols-1): #1 first, then #2, then #3
  // - ≥sm (grid-cols-3): classic 2–1–3 podium
  return (
    <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:items-end">
      <div className="order-2 sm:order-1">{card(second, 2)}</div>
      <div className="order-1 sm:order-2">{card(first, 1, true)}</div>
      <div className="order-3 sm:order-3">{card(third, 3)}</div>
    </div>
  );
}

export default async function Page() {
  // Current week (Sunday -> Today)
  const { startDate, endDate } = getThisWeekRangeFromSunday();

  // Last week (prev Sunday -> prev Saturday)
  const { startDate: lastStart, endDate: lastEnd } = getLastWeekRange();

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

  
  // limit table to top 10
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

  return (
    <main className={`mx-auto max-w-6xl p-6 text-zinc-100 ${BRAND.bg}`}>
      {/* HERO with logo + buttons column */}
      <section className={`rounded-3xl border border-zinc-800 bg-gradient-to-b ${BRAND.panelFrom} ${BRAND.panelTo} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Logo Slot */}
            <div className="relative h-16 w-48 sm:h-20 sm:w-64">
              <Image src="/logo.jpg" alt="Logo" fill className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Rainbet Leaderboards</h1>
              <p className="text-sm text-zinc-400">This Week · {startDate} → {endDate}</p>
              {/* UPDATED moved here (no wrap) */}
              <p className="mt-1 text-xs text-zinc-500 whitespace-nowrap">Updated: {updatedAt}</p>
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
          <StatCard label="Total Prize Pool" value={`$${totalPrizePool}`} />
        </div>

        {/* Last Week Winner */}
        {lastWeekWinner && (
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm">
            <span className="text-zinc-300">Last Week’s Winner: </span>
            <span className="font-semibold text-zinc-100">
              {maskUsername(lastWeekWinner.username ?? "")}
            </span>{" "}
            <span className={`${BRAND.accent} font-semibold`}>
              {formatMoney(parseAmount(lastWeekWinner.wagered_amount))}
            </span>
          </div>
        )}

        {/* Podium */}
        <div className="mt-6">
          <h2 className="mb-8 text-lg font-semibold">Champions Podium</h2>
          {top3.length ? (
            <Podium top={top3} />
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-zinc-400">No data available</div>
          )}
        </div>
      </section>

      {/* TABLE (Top 10) */}
      <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
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
                          ${prize}
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
      {error && <p className="mt-4 text-sm text-red-400">Error: {error}</p>}
    </main>
  );
}
