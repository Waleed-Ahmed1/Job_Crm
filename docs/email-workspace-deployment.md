# Deploying the simplified email workspace

1. Back up your Supabase database, as usual before a schema update.
2. Apply `supabase/migrations/0002_email_workspace.sql` in the existing Supabase project before deploying the updated app. It adds owner-only CV and target tables, tracker archiving, and indexes. It does not remove existing data or tables. Existing tracking columns are retained.
3. Deploy the code to Vercel using your normal workflow. No new environment variables, npm dependencies, or Inngest registration changes are needed.
4. Check Gmail connection, sync recent email, send one test email, check its tracker and reply, save targets, and upload/edit/download a test CV.

The Inngest function IDs, schedules, event names, route, signing keys, and credential setup are preserved. The legacy task reminder job remains registered for compatibility; task/application screens redirect to the simplified workspace.

The inbox sync lists at most 50 recent threads per run. It imports only messages from the last 72 hours. Older tracked conversations are checked separately, up to 25 per run, so replies can still be detected. Saved sync history tokens are left in the database for compatibility but the new bounded inbox scan does not use them.

Tracker deletion archives a completed or failed send, stops new open recording, and removes it from the tracker. Gmail messages and send idempotency records remain. Dashboard totals include archived sends. Unresolved delivery cannot be deleted.

Daily/monthly targets are progress goals, not provider quota enforcement. Dates use Asia/Karachi. Metrics count successfully sent messages from Northstar, not historical Gmail sends; open/reply totals count unique emails.

CVs use UTF-8 .txt import and plain-text editing, saved privately through Supabase RLS. PDF export runs in the browser, without a server rendering service. The single-column, selectable-text PDF supports English/Western European text; other scripts can use the browser's Print / Save as PDF option. Avoid tables, images, and decorative layouts. ATS compatibility or ranking is not guaranteed.

For rollback, redeploy the previous app version. The additive migration can remain installed; do not delete send records or drop tables during a rollback.
