# Architecture and data flow

## Boundaries

- `src/app/(app)`: authenticated App Router screens. Server Components load user-owned rows; interactive forms use Server Actions or Route Handlers.
- `src/lib/supabase`: cookie-aware user client and server-only service-role client. The service role is restricted to OAuth and background work.
- `src/lib/email`: provider boundary for Gmail OAuth clients, MIME, import, sanitization, and synchronization. A future Outlook provider can implement the same responsibilities without changing CRM tables.
- `src/lib/ai`: pure prompt/schema code. The API route gathers only selected profile, application, draft, and conversation context.
- `src/inngest`: retry-safe sync/reminder functions. Email send is deliberately not an Inngest function.
- `supabase/migrations`: schema, composite ownership foreign keys, indexes, RLS, private token RPCs, and storage policies.

## Core data flows

Application write: browser form → Server Action → owner check → Zod → authenticated Supabase client → RLS → PostgreSQL.

Gmail connect: owner session → random state cookie → Google authorization-code consent → constant-time state validation → token exchange → Gmail profile → public account metadata + AES-256-GCM refresh token in `private.oauth_credentials`.

Gmail sync: Inngest/manual event → due connected account → persistent lock/checkpoint → Gmail list/history → complete thread fetch → idempotent upserts → checkpoint commit. Expired history becomes `needs_full_sync`; it never advances a broken checkpoint.

Send: editable local form → recipient/content confirmation → persisted `outbound_send_attempts` row → one Gmail call with automatic retries disabled → `sent`, `failed`, or `uncertain`. An uncertain result blocks blind retry until mailbox reconciliation.

AI draft: purpose + current draft + selected facts → untrusted-data delimiters → Responses API structured output → Zod-parsed subject/body/missing facts → editable client state. The route cannot send mail or update applications.

## Time and deletion

All database timestamps are `timestamptz` and therefore stored in UTC. UI formatting uses the profile timezone (default `Asia/Karachi`). Application archive preserves linked email. Application deletion removes link rows, not Gmail or synchronized email rows. Gmail remains the email source of truth.
