# Cost register: external services used by the plans

**Rule (project owner, 2026-09-28):** nothing paid is used without the owner's explicit permission. Every plan defaults to the free option below. Anything marked **Needs approval** must not be bought, upgraded or enabled until the owner says yes.

**Owner decisions (2026-09-28):** this is a **practice project**. Web and API both run on **Vercel Hobby (free)**, and the AI uses the **Groq free tier**. See [DEPLOYMENT.md](./DEPLOYMENT.md) for what this changes.

Pricing was checked on 2026-09-28 unless marked *unverified*. Re-check before signing up.

| Service | Used by | Free option | Limits on the free option | Status |
|---------|---------|-------------|---------------------------|--------|
| **Vercel** (web and API hosting) | all | Hobby plan, two projects | Non-commercial use only; function bodies capped at 4.5 MB; functions run for 300 s at most; cron jobs daily only; 1 hour of logs | **Decided: Hobby, free** (practice project). Pro ($20 per seat per month) would need approval before any commercial launch. |
| **Vercel Web Analytics** (custom events `inquiry_submitted`, `whatsapp_clicked`) | 001, 002 | 50,000 events per month on Hobby | Whether custom events are included on Hobby is *unverified* | Free. Use Hobby Web Analytics for page views. If custom events turn out not to be included on Hobby, record `inquiry_submitted` and `whatsapp_clicked` in our own Postgres table (free) instead of upgrading. |
| **API hosting** (FastAPI) | all | Vercel Hobby (Python runtime) | See the Vercel row | **Decided: Vercel Hobby, free.** Railway and Render are not used. |
| **Neon Postgres** | all | Free plan | Small storage and compute that pauses when idle (*limits unverified*) | Free. Render's free Postgres is **not** used: it expires after 30 days. |
| **Groq API** (AI) | 008, 009, 010 | Free tier | GPT-OSS models: 30 requests per minute, 1K requests per day, 8K tokens per minute, 200K tokens per day | **Decided: free tier only.** The Developer plan (pay per token) would need approval. On the free tier, a limit hit shows visitors the contact options. |
| **Resend** (email) | 001, 003, 007, 009 | Free plan | About 3,000 emails a month and 100 a day (*unverified*) | Free |
| **Cloudflare Turnstile** | 001, 007, 008, 009, 010 | Free | None relevant | Free |
| **Cloudinary** (images, private CVs) | 004, 005, 007 | Free plan (monthly credits) | Credit-based (*limits unverified*) | Free |
| **Cal.com** (discovery calls) | 006 | Free forever plan | Webhooks, workflow reminders, embeds, custom booking questions and the per-booker upcoming-booking limit are all included (verified on the pricing page) | Free |
| **Google PageSpeed Insights API** | 009 | Free with an API key | Daily quota (*unverified*) | Free |
| **Sentry** (error reporting) | 002 | Developer plan | Event quota (*unverified*) | Free |
| **Have I Been Pwned range API** | 003 | Free | None relevant | Free |
| **Domain `thebuzzcrew.com`** | 002 | — | — | Assumed already owned by the agency |

Open-source libraries in the plans (FastAPI, SQLModel, WeasyPrint, python-docx, APScheduler, next-themes, dnd-kit and others) are free.
