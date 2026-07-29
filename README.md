# A/RE Lead Generator Pipeline

Multi-market lead queue for the AIRE team — ICP targeting, market switching, expandable sales context.

Brand: [aire.inc/au](https://aire.inc/au)

## Storage

Lead + campaign data lives in **Supabase** (not in the Vercel bundle):

| Table | Purpose |
|---|---|
| `campaigns` | Market / ICP config JSON |
| `leads` | Scored accounts + full CSV payload |
| `app_state` | Active campaign id |

## Local setup

```bash
npm install
cp .env.example .env.local
# fill SUPABASE_* keys
npm run seed:supabase   # one-time: upload local CSVs → Supabase
npm run dev
```

Open [http://localhost:3100](http://localhost:3100)

## Deploy on Vercel

**Important:** deploy this Next.js repo  
[`nimhewage/aire-lead-generator`](https://github.com/nimhewage/aire-lead-generator)  

Do **not** deploy `datamining-aire` to Vercel — that Python mining bundle exceeds the 500 MB function limit.

### Vercel env vars

```
SUPABASE_URL=https://rcgplklpktfqcjuzgjhs.supabase.co
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
SUPABASE_JWKS_URL=https://rcgplklpktfqcjuzgjhs.supabase.co/auth/v1/.well-known/jwks.json
NEXT_PUBLIC_SUPABASE_URL=https://rcgplklpktfqcjuzgjhs.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Framework: Next.js · Build: `npm run build`

## Markets seeded

- Dubai / UAE  
- Sydney / Melbourne / Brisbane  

## Notes

- Swarm mining needs local `agentworks` + xAI — not available on Vercel serverless.
- Reseed anytime with `npm run seed:supabase` from a machine that has `data/leads/*.csv`.
