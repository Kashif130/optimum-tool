# Optimum Developer Tools

Real-time toolkit for Optimum / mump2p validators — built with Next.js 14, deployable to Vercel in under 2 minutes.

## 5 Tools Included

| Tab | Tool | Real-time Data |
|-----|------|----------------|
| ◎ | **Network Simulator** | Visual RLNC vs Gossipsub propagation animation |
| ◈ | **ROI Calculator** | Live ETH price (CoinGecko) + staking APR (beaconcha.in) |
| ◉ | **Bandwidth Dashboard** | Real cloud provider pricing (AWS / GCP / Azure / Hetzner) |
| ◍ | **Validator Map** | Live validator count + total ETH staked (beaconcha.in) |
| ◌ | **Setup Wizard** | Latest mump2p version + real download URL (GitHub) |

## Live Data Sources

All external API calls run **server-side** via Next.js API routes — zero CORS issues, edge-cached.

| Data | Source | Refresh |
|------|--------|---------|
| ETH price + 24h change | CoinGecko free API | 30s |
| Staking APR (CL + EL) | beaconcha.in `/api/v1/ethstore/latest` | 30s |
| Active validators count | beaconcha.in `/api/v1/epoch/latest` | 60s |
| mump2p latest version | GitHub Releases API | 5 min |

## Deploy to Vercel (2 minutes)

```bash
# 1. Clone / download this folder
cd optimum-tools

# 2. Push to GitHub
git init && git add . && git commit -m "init"
git remote add origin https://github.com/YOUR_ORG/optimum-tools
git push -u origin main

# 3. Go to vercel.com → New Project → import repo
#    Build command: next build   (auto-detected)
#    Output dir:   .next         (auto-detected)
#    → Deploy
```

No environment variables required. The app works out of the box.

## Run Locally

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Project Structure

```
optimum-tools/
├── app/
│   ├── layout.js              # HTML shell + Google Fonts
│   ├── page.js                # Imports OptimumApp component
│   ├── globals.css            # Minimal resets
│   └── api/
│       ├── market/route.js    # ETH price + staking APR proxy
│       └── network/route.js   # Validator count + mump2p version proxy
└── components/
    └── OptimumApp.jsx         # All 5 tabs + real-time data hook
```

## Tech Stack

- **Next.js 14** (App Router) — server components + API routes
- **React 18** — client-side interactivity
- **recharts** — AreaChart + BarChart
- **Vercel** — zero-config deployment

## Customizing

- **Add API key for CoinGecko Pro**: set `COINGECKO_API_KEY` in Vercel env vars and update `app/api/market/route.js`
- **Change refresh interval**: edit `setInterval(fetchAll, 30_000)` in `useRealtimeData` hook inside `OptimumApp.jsx`
- **Add a new tab**: add entry to `TABS` array and create a new component — pattern is consistent throughout
