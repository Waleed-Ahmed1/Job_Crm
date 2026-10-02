# Gmail OAuth setup and proof of concept

## Google Cloud

1. Create a dedicated Google Cloud project and enable the Gmail API.
2. Configure OAuth branding/audience. For development, choose External/Testing and add only your Gmail address as a test user.
3. Create an OAuth client of type **Web application**.
4. Add exact redirect URIs:
   - Local: `http://localhost:3000/api/gmail/oauth/callback`
   - Production: `https://YOUR_DOMAIN/api/gmail/oauth/callback`
5. Add only:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
6. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`.

The code requests `access_type=offline`, validates a random state in an HTTP-only SameSite cookie, and requests consent/account selection. A refresh token may only be returned on first consent; reconnect code preserves an existing token when Google omits a new one.

## Testing-mode limitation

Google’s current audience documentation says authorizations in External/Testing expire seven days after consent; offline refresh tokens expire too. Expect a reconnect every seven days while using Gmail scopes in Testing. Moving to In production removes this testing-mode expiry, but verification rules still depend on scope, audience, and distribution.

Google documents a verification exception for true personal use (one user or a few personally known users), subject to the unverified-app warning and user cap. This is not a promise that a publicly distributed product is verification-free. Gmail read scopes are restricted; reassess verification and possible security assessment before broader distribution.

References: [web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [scope classifications](https://developers.google.com/workspace/gmail/api/auth/scopes), [personal-use exception](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification), [audience and seven-day expiry](https://support.google.com/cloud/answer/15549945).

## Live proof-of-concept checklist

Use a dedicated test recipient that you own. Never use a recruiter.

1. Sign into Northstar and connect Gmail in Settings.
2. Confirm the consent screen shows only read and send access.
3. POST a known Gmail thread ID to `/api/gmail/threads/{threadId}` and confirm all messages import once.
4. Compose to the approved test address, inspect To/CC/BCC/subject/body, and press Send once.
5. Confirm the send-attempt row becomes `sent` and stores Gmail message/thread IDs.
6. Reply using the stored Gmail `threadId`, RFC `Message-ID` in `In-Reply-To`, and accumulated `References`.
7. Confirm Gmail displays a single thread and the reply syncs without duplicate rows.
8. Simulate a timeout with the provider mock; confirm state is `uncertain` and retry is blocked pending reconciliation.

No live cycle has been run in this repository because credentials and an approved recipient were not provided.
