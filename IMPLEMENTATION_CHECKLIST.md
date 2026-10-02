# Incremental implementation checklist

- [x] Phase 1: strict Next.js foundation, owner login, schema/RLS, application CRUD foundation, profile/settings UI, private resume upload, dashboard.
- [x] Phase 2 code: Gmail OAuth, encrypted token store, single-thread import, send/reply MIME, send-attempt state.
- [ ] Phase 2 live acceptance: connect a real owner Gmail account and complete an approved test send/reply cycle.
- [x] Phase 3 foundation: bounded + history sync, idempotent imports, checkpoints/locks, email list, drafts/send safety schema.
- [ ] Phase 3 UI completion: rich thread view, attachment retrieval, manual link/unlink controls, uncertain-send reconciliation.
- [x] Phase 4 foundation: Responses API structured drafts, fact boundaries, editable output, rate limits, usage metadata.
- [x] Phase 5 foundation: tasks, due buckets, reply-aware review state, Inngest daily preparation.
- [ ] Phase 5 completion: interview CRUD and configurable reminder notification preferences.
- [x] Phase 6 foundation: unit/E2E tests, CSV, setup/security/deployment/cost documentation.
- [ ] Phase 6 live checks: disposable Supabase RLS test matrix, provider credentials, Vercel preview, backup restore drill.
