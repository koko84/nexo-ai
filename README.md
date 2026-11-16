# NEXO AI — Web MVP

NEXO AI is a responsive multilingual AI chat starter with six server-enforced assistant modes. Version 1.2.0 is an MVP foundation, not a finished commercial AI platform.

## Included and implemented
- Responsive web interface in English, Arabic (RTL), French and Spanish: UI text is translated, the choice is remembered in the browser, and it is sent to the server as a reply-language hint.
- Chat session context held temporarily in the current browser tab.
- Six distinct assistant modes: general chat, learning, writing, coding, translation, and document-text assistance.
- Server-side provider integration using an OpenAI-compatible chat-completions API.
- API-key protection: provider credentials are read only from server environment variables.
- Input validation (up to 20 messages, 6,000 chars per user message, 12,000 per assistant message, 60,000 chars total), malformed-JSON handling (400), request-size limit of 256kb (413), security headers, per-IP rate limiting, provider timeout, output-token cap, no-store API responses, and generic error responses.
- Health endpoint at `/api/health` and JSON 404 responses for unknown API routes.
- About, Privacy, Terms and Contact starter pages.

## Not implemented
No user accounts, cloud conversation storage, PDF/file upload or parsing, image generation, voice, multi-agent orchestration, admin dashboard, subscription/payment system, native Android app, or live advertising. Do not advertise these as available features.

## Requirements and local run
Node.js 18 or newer.

1. Extract the ZIP.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Set `AI_API_KEY` and `AI_MODEL` in `.env`. `AI_API_URL` is optional and must be a trusted OpenAI-compatible chat-completions endpoint.
5. Run `npm run check` and `npm test` (unit tests plus end-to-end HTTP tests against a fake AI provider).
6. Commit the `package-lock.json` that `npm install` creates, so installs are reproducible (use `npm ci` in deployment).
7. Run `npm start` and open `http://localhost:3000`.

Without valid provider credentials, the chat endpoint intentionally returns a clear configuration error.

## Deployment
Deploy to a Node.js host that supports Node 18+ and server-side environment variables. This Express build is not a static-only website: do not deploy it as a static site. Do not commit `.env` or put API keys in `public/` or browser JavaScript. Configure the environment variables in the hosting provider's secure dashboard. Set `TRUST_PROXY=1` (number of proxy hops) if the host places the app behind a trusted reverse proxy; without it all users share one rate-limit bucket, and the server logs a warning when it sees `X-Forwarded-For`. Set `AI_MAX_TOKENS` to control the maximum generated output (128–2000; default 1200).

## Before public launch
- Replace legal-page templates with accurate operator identity, contact details, data processing, retention, cookies, user rights, and provider information.
- Add authentication, database security, account deletion and privacy controls before introducing accounts.
- Add secure upload validation and malware scanning before accepting files.
- Implement and test all advertised image, voice, document, Android, admin and payment features before announcing them.
- Review current AdSense/AdMob policies and obtain approval before adding live ads. Approval is not guaranteed.
- If the project operator is under 18, a parent or legal guardian must handle applicable publisher and payment account requirements.

## Security notes
This starter limits requests by IP in a single server process. Behind a reverse proxy, configure trusted proxy handling carefully or client-IP limits may not work as intended. For a multi-instance deployment, use a shared rate-limit store. Restrict `AI_API_URL` to a provider you trust. Add monitoring, abuse controls, privacy review and operational backups before public production use.
