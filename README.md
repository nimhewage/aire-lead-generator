# A/RE Lead Generator Pipeline

Dedicated Next.js app for the AIRE team to configure ICP targeting, switch markets, review mined leads, and (locally) run lead-mining agent swarms.

Brand: [aire.inc/au](https://aire.inc/au)

## Markets included

| Market | Leads file |
|---|---|
| Dubai / UAE | `data/leads/leads-dubai*.csv` |
| Sydney | `data/leads/leads-sydney.csv` |
| Melbourne | `data/leads/leads-melbourne.csv` |
| Brisbane | `data/leads/leads-brisbane.csv` |

## Local setup

```bash
npm install
cp .env.example .env.local
# optional: AGENTWORKS_ROOT=/path/to/agentworks for swarm mining
npm run dev
```

Open [http://localhost:3100](http://localhost:3100)

## Deploy on Vercel

1. Import this GitHub repo in Vercel
2. Framework preset: **Next.js** (auto)
3. Build command: `npm run build`
4. No env vars required for browsing markets / leads
5. Optional later: `AGENTWORKS_ROOT` is only needed for local swarm execution (not available on Vercel serverless)

Market switching persists in `/tmp` on Vercel for the life of the serverless instance; default campaign loads from `data/campaigns/`.

## Notes

- Swarm mining needs local `agentworks` + xAI credits — use locally, not on Vercel.
- Config lives in `data/campaigns/*.json`.
