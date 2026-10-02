# Configuration and deployment

## Supabase

Create a project, apply `supabase/migrations/0001_foundation.sql`, create the single owner in Auth, disable public signup, and configure `OWNER_EMAIL`. The migration creates a private `resumes` bucket and RLS policies. Never expose the service-role key.

For backups, enable the database backup/PITR option appropriate to your Supabase plan and periodically verify a restore into a non-production project. Storage objects require a separate export plan if your selected plan does not include them.

## OpenAI

Create a project-scoped API key and set `OPENAI_API_KEY`. `OPENAI_MODEL` defaults to `gpt-6-luna`, selected for focused, cost-sensitive drafting. The model is configurable without code changes. Configure project spend/rate limits in the OpenAI dashboard. The application sends only selected profile/application/conversation text and records token usage without prompt bodies.

## Inngest

Create an app, set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`, and register `https://YOUR_DOMAIN/api/inngest`. The 15-minute cron is a dispatcher; each account’s configured interval is checked before work. Sync operations are idempotent and retryable. Gmail sending is not retried by Inngest.

## Vercel

Import the Git repository, select Next.js, add every `.env.example` variable with production values, and deploy. Set `APP_URL` and the Google redirect URI to the exact HTTPS deployment domain. Keep preview deployments on separate Google/Supabase projects or omit Gmail credentials there.

Run before deployment:

```bash
pnpm install --frozen-lockfile
pnpm verify
```

Do not run production migrations or publish the OAuth app without reviewing the SQL diff, backups, audience, consent text, privacy disclosures, and live checklist.
