# Cost drivers and plan requirements

Check vendor pricing immediately before deployment; plans and quotas change.

- **Supabase:** database/storage size, egress, Auth usage, backup retention, and PITR. RLS and private buckets are platform features, but backup/PITR availability varies by plan.
- **Vercel:** function duration/invocations, build minutes, bandwidth, and log retention. Gmail sync cadence is the main background invocation driver.
- **Inngest:** function runs, steps, concurrency, and retention. A 15-minute dispatcher plus paginated imports can exceed entry-tier quotas as mailbox coverage grows.
- **Google:** Gmail API is quota-governed rather than assumed unlimited. Restricted-scope verification/security assessment can be a significant non-API cost for public distribution.
- **OpenAI:** input/output tokens. `gpt-6-luna` is the configurable default for focused drafting; bounded context and 1,600 output tokens cap routine cost. Set project spend limits.
- **Domain/operations:** a domain, monitoring/error reporting, backup validation, and possibly a Google-approved security assessment.

Do not assume all production requirements are free merely because a personal prototype fits a free tier.
