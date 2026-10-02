# Northstar job-search CRM

A private, owner-only job-search workspace built with Next.js App Router, strict TypeScript, Tailwind CSS, shadcn/ui-style source components, Supabase, Gmail, OpenAI Responses API, and Inngest.

## Implemented

- Owner-only Supabase login (no signup UI), server authorization, and RLS-backed data access.
- Responsive dashboard, application table/Kanban/detail/create flows, tasks, email workspace, compose flow, profile/settings, CSV export, and clearly labeled read-only sample mode.
- Relational PostgreSQL migration covering profiles, companies, contacts, applications, resumes, tasks, interviews, Gmail data, drafts, send attempts, sync checkpoints, activity, and AI usage.
- Private resume storage with content signature, MIME, size, ownership, and signed-link controls.
- Gmail server OAuth, encrypted refresh tokens, bounded/full and history sync foundations, complete-thread imports, safe HTML, manual thread retrieval, MIME send/reply support, and uncertain-send handling.
- OpenAI Responses API structured drafting with bounded relevant context, prompt-injection boundaries, editable output, missing-fact notes, rate limits, and usage metadata.
- Inngest scheduled and requested synchronization plus timezone-aware reminder preparation.
- Unit tests for token encryption, OAuth state comparison, reply MIME headers, HTML safety, ambiguous sends, AI grounding, structured output, and Asia/Karachi date boundaries.

No integration is presented as live until credentials are configured and the live checklist is completed.

## Local setup

Requirements: Node.js 24 (Node 22 LTS is also suitable), pnpm 11+, Supabase CLI for migrations, and a Supabase project.

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
pnpm dev
```

Create the sole user in Supabase Authentication, set the same address in `OWNER_EMAIL`, and disable new-user signup in Supabase. Do not expose `SUPABASE_SERVICE_ROLE_KEY`, Google secrets, the encryption key, or `OPENAI_API_KEY` to the browser.

For a credential-free UI review only, set `NEXT_PUBLIC_DEMO_MODE=true`. Sample mode is read-only, displays a persistent label, and always reports Gmail as disconnected.

Generate the OAuth encryption key:

```bash
openssl rand -base64 32
```

## Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm verify
```

Playwright requires a browser binary (`pnpm exec playwright install chromium`). Automated tests never use a real Gmail account or send external messages.

## Documentation

- [Architecture and data flow](docs/ARCHITECTURE.md)
- [Gmail OAuth and live proof-of-concept setup](docs/GMAIL_SETUP.md)
- [Supabase, OpenAI, Inngest, and Vercel deployment](docs/DEPLOYMENT.md)
- [Testing and manual verification](docs/TESTING.md)
- [Security notes](docs/SECURITY.md)
- [Known limitations and deferred work](docs/KNOWN_LIMITATIONS.md)
- [Cost drivers](docs/COSTS.md)
- [Implementation checklist](IMPLEMENTATION_CHECKLIST.md)

## Official references checked

The implementation was checked against the current official documentation on 2026-10-01: [Next.js App Router](https://nextjs.org/docs/app), [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers), [Tailwind](https://tailwindcss.com/docs), [shadcn/ui](https://ui.shadcn.com/docs), [Supabase Auth](https://supabase.com/docs/guides/auth), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [Google OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes), [Gmail sync](https://developers.google.com/workspace/gmail/api/guides/sync), [Gmail threading](https://developers.google.com/workspace/gmail/api/guides/threads), [Gmail sending](https://developers.google.com/workspace/gmail/api/guides/sending), [OpenAI text generation](https://developers.openai.com/api/docs/guides/text), [Inngest triggers](https://www.inngest.com/docs/features/events-triggers), [Inngest retries](https://www.inngest.com/docs/features/inngest-functions/error-retries/retries), and [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).
