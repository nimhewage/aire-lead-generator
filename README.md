# A/RE Lead Generator Pipeline

Multi-market lead queue for the AIRE team — ICP targeting, market switching, expandable sales context.

Brand: [aire.inc/au](https://aire.inc/au)

## Data storage

By default the app can use **Supabase**. If Supabase is unavailable (or you set `AIRE_DATA_SOURCE=local`), it reads from:

| Path | Purpose |
|---|---|
| `data/campaigns/*.json` | Market / ICP config |
| `data/leads/leads-*.csv` | Scored lead queues |

## Local setup

```bash
npm install
cp .env.example .env.local
# Keep AIRE_DATA_SOURCE=local unless Supabase is healthy
npm run dev
```

Open [http://localhost:3100](http://localhost:3100)

### Optional: seed / refresh Supabase

```bash
# Requires a live SUPABASE_URL + SUPABASE_SECRET_KEY
AIRE_DATA_SOURCE=   # unset local mode
npm run seed:supabase
```

## Deploy on Vercel

Deploy **this** Next.js repo: [`nimhewage/aire-lead-generator`](https://github.com/nimhewage/aire-lead-generator)

Do **not** deploy `datamining-aire` to Vercel (Python bundle exceeds the 500 MB limit).

### Recommended Vercel env (works offline from committed CSVs)

```
AIRE_DATA_SOURCE=local
```

When you have a healthy Supabase project again, set the `SUPABASE_*` keys and remove `AIRE_DATA_SOURCE=local`.

## Markets included

- Dubai / UAE  
- Sydney / Melbourne / Brisbane  

## Notes

- Swarm mining needs local `agentworks` + xAI — not available on Vercel serverless.
