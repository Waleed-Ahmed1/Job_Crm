# Testing and verification

## Automated

`pnpm test` covers encryption/tamper boundaries, OAuth state comparison, reply MIME headers, unsafe HTML, ambiguous sends, idempotency fingerprints, AI output validation/prompt isolation, and Asia/Karachi reminders.

`pnpm test:e2e` starts read-only sample mode and verifies navigation plus honest disconnected state. Install Chromium first. Provider integrations must use mocks in CI.

`pnpm verify` runs lint, strict type checking, unit tests, and a production build.

## Database checks

Using two test Auth users in a disposable Supabase project:

1. Insert data as user A; assert user B cannot select, update, delete, or reference it.
2. Attempt a child row with user B’s owner ID and user A’s parent ID; assert the composite foreign key rejects it.
3. Assert anon/authenticated roles cannot call OAuth credential RPCs or access `private.oauth_credentials`.
4. Assert user B cannot list/download/delete user A’s resume object.
5. Repeat the same Gmail message import and assert one `(email_account_id, provider_message_id)` row.

## Failure drills

- Alter OAuth state and confirm callback 400.
- Revoke the Google grant and confirm `needs_reconnect`/safe error handling.
- Seed an expired history ID and confirm `needs_full_sync` without checkpoint corruption.
- Submit a send twice with one idempotency key and confirm one provider call.
- Mock a post-request timeout and confirm `uncertain`; reconcile before retry.
- Import HTML with scripts, handlers, remote pixels, and `javascript:` links; confirm all are removed.
- Attempt oversized/spoofed resume and attachment uploads; confirm rejection.

The live Gmail send/reply checklist is in `docs/GMAIL_SETUP.md` and must use an owner-approved test recipient.
