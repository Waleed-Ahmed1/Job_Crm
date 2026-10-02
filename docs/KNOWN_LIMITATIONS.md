# Known limitations and deferred work

- Live Supabase, Gmail, OpenAI, Inngest, and Vercel verification requires user-owned credentials and has not been claimed as complete.
- Gmail push notifications are deferred; polling is scheduled. Very large initial imports advance in bounded pages, but a production UI should expose richer progress and reconciliation tooling.
- The email list foundation imports and stores complete threads, but richer thread rendering, attachment download-on-demand, manual association controls, and uncertain-send reconciliation UI need another pass.
- Profile settings fields are displayed but the full edit action and experience/portfolio list editor are not yet wired.
- Interview CRUD and a dedicated calendar presentation are not yet complete.
- Notifications remain in-app task state; no external reminder channel is configured. Follow-up mail is never automatic.
- Outlook, job-site scraping, mass outreach, automatic applications, billing, teams, and native mobile apps are intentionally deferred.
