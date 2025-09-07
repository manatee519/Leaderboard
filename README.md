This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


# === Required for Rainbet API integration ===
RAINBET_API_BASE=https://services.rainbet.com/v1
RAINBET_API_KEY=your-api-key-here
RAINBET_REFERRAL_URL=https://rainbet.com/?ref=yourcode

# === External links ===
DISCORD_INVITE_URL=https://discord.gg/yourinvite
KICK_URL=https://kick.com/yourchannel
INSTAGRAM_URL=https://instagram.com/youraccount

# === Leaderboard theme ===
# Options: "manatee" | "mobbin"
LEADERBOARD_THEME=manatee

# === Prize pool configuration ===
# Accepted formats:
#   CSV: "400,200,125"
#   JSON numbers: [400,200,125]
#   JSON objects: [{"rank":1,"amount":400}, ...]
PRIZES=400,200,125

# Currency code (ISO-4217) e.g. USD, CAD, EUR, GBP
PRIZE_CURRENCY=USD
# Optional override symbol, otherwise defaults (USD=$, CAD=C$, EUR=€, GBP=£)
PRIZE_CURRENCY_SYMBOL=$

# === Periods (leaderboard timeframe) ===
# Options:
#   - monthly  (1st → last day of month UTC)
#   - weeklysaturdaynight  (Sun → Sat, ends Sat 23:59 UTC)
#   - weeklysundaynight    (Mon → Sun, ends Sun 23:59 UTC)
#   - custom   (define below)
PERIOD_MODE=monthly

# If PERIOD_MODE=custom:
# Start date of first period in YYYY-MM-DD (UTC)
PERIOD_START=2024-09-01
# Length of each period in days
PERIOD_LENGTH_DAYS=14
