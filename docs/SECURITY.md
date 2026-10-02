# Security notes

- Authentication is verified with `supabase.auth.getUser()`; `OWNER_EMAIL` adds an application allowlist. Every protected mutation repeats authorization. Proxy refresh is only an optimistic session refresh, not the authorization boundary.
- Public tables have owner RLS. Parent/child ownership is reinforced by composite foreign keys. Service-role access is server-only.
- Refresh tokens use AES-256-GCM with a random IV. Ciphertext lives in a non-exposed schema and is accessible only through service-role RPCs. Plan key rotation before changing `OAUTH_TOKEN_ENCRYPTION_KEY`.
- Resume objects are private and owner-prefixed. Uploads enforce a 10 MB limit, an allowlist, and magic bytes; downloads use 60-second signed URLs.
- Imported HTML is allowlisted; scripts, handlers, remote images, and unsafe protocols are removed. Plain text remains available.
- AI and send endpoints are rate-limited in PostgreSQL. Prompts and full email bodies are not logged. Errors returned to the browser are deliberately generic.
- Send attempts are persisted before Gmail. Idempotency keys prevent double clicks; ambiguous transport errors become `uncertain` and are not blindly retried.
- Disconnect attempts provider revocation, removes the local encrypted token, and marks the account disconnected. Add a user-facing local-mail deletion button only after explicitly confirming scope.
