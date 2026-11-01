# Duet Slides

Bilingual live slides and giving for multilingual churches. Built on OBS, so it reaches any live stage next.

A church with an English service and a Spanish one (or Korean, or Chinese) usually runs two of everything: two slide decks, two announcement slides, two ways to give. Duet Slides puts both languages on one slide, line under line, and puts giving on the same screen: a QR code, a live goal bar per purpose, and a thank-you on the livestream when a gift comes in.

PayPal handles the money. Claude drafts the second-language lines and the giving campaign. A person checks everything before it reaches the screen.

- Demo: https://duet-slides.onrender.com
- Video (under 3 minutes): {{VIDEO_URL}}
- License: AGPL-3.0

## What it does

**Slides in two languages.** Paste lyrics, sermon points or announcements, or type a Bible reference. Each slide shows the main language with the second language under it. Public domain Bibles are built in: World English Bible, King James Version and Reina-Valera 1909, matched verse by verse. The presenter window (`/?view=presenter`) goes to the projector, and a transparent version goes into OBS.

**AI draft for the second line.** In the Foreign language window, press ✨ AI draft and pick a language. Claude fills only the empty slides. Each draft gets a dashed outline until someone reads or edits it, and nothing reaches the screen until the operator presses Apply.

**Giving, split by purpose.** The giving page (`/give/`) lets a donor split one gift across purposes, for example $25 for travel and $10 for clinic supplies, then pay with PayPal. The page is built for phones and shows both languages.

**Live on the screen and the stream.** When PayPal confirms a payment, the server updates the totals and pushes them out over server-sent events:
- the giving screen (`/screen/`): a 16:9 slide with a QR code, a goal bar for each purpose and a note when a new gift arrives
- the OBS overlay (`/overlay/`): a transparent 1920x1080 browser source with the goal bar and a two-language thank-you

**Giving assistant (agent).** On `/host/`, the operator describes the need in plain words: "Our youth are going to Guatemala in March. We need $3,000..." Claude then works through three tools in order:
1. `get_giving_state` reads the current campaign and what has been given
2. `check_paypal` confirms the PayPal account can take donations
3. `propose_campaign` submits a bilingual draft (title, purposes, goals)

The server validates the draft and sends errors back for the model to fix. The operator edits the draft and approves it with the admin token. The giving page, the overlay and the giving screen switch to the new campaign right away.

## How PayPal is used

- **Orders v2.** The server creates an order with one line per purpose. Amounts come from the server's own record of the order, never from the browser at capture time.
- **Capture.** After the donor approves in the PayPal window, the server captures the order and records the gift.
- **Webhooks.** `PAYMENT.CAPTURE.COMPLETED` is verified with PayPal's signature check (`/v1/notifications/verify-webhook-signature`). A gift seen by both the capture response and the webhook is counted once, matched by capture id.
- **Sandbox only** for this hackathon. The `DONATION` item category needs an approved PayPal account, so items are sent without it.

## How AI is used

- Model: Claude Sonnet 5.5 (`claude-sonnet-5-5`) through the official Anthropic SDK.
- Translation uses a JSON schema so the answer always has one line per slide. The prompt asks for a fresh translation and forbids quoting published song or Bible translations.
- The agent uses strict tool schemas. The server checks every proposal (goals, names, number of purposes) and returns errors as tool results, so the model corrects itself.
- If a request is declined by a safety filter, it is retried on Anthropic's recommended fallback model.
- AI never publishes on its own. The operator applies translations and approves campaigns.
- A public demo needs limits: 20 AI requests per IP per 10 minutes and 300 per day (`AI_PER_IP_10MIN`, `AI_DAILY_LIMIT`).

## Try it (judges)

Hosted demo: https://duet-slides.onrender.com

1. **Slides.** Open https://duet-slides.onrender.com. Five public domain hymns are loaded on your first visit. On a song card, press 🌐 Foreign language, then ✨ AI draft. Check the drafts and press Apply. Press ▶ Present to open the presenter window.
2. **Giving.** Open https://duet-slides.onrender.com/give/ (or scan the QR code on https://duet-slides.onrender.com/screen/). Enter amounts, press the PayPal button and log in with the sandbox buyer below. Keep https://duet-slides.onrender.com/screen/ or https://duet-slides.onrender.com/overlay/ open in another window to watch the total change.
3. **Giving assistant.** Open https://duet-slides.onrender.com/host/, press "Use the example", then Draft campaign. Edit if you like and approve with the admin token below. The giving page now shows the new campaign.

Test accounts (sandbox, no real money):
- PayPal sandbox buyer: `sb-ssdqs53638045@personal.example.com` / `DuetZQ8s7Dvv!7`
- Admin token for `/host/`: `duet-judges-2026` (the demo returns to the sample campaign 30 minutes after a change)

The demo runs on a free plan, so the first request after a quiet period can take up to a minute while the server wakes up.

## Run it yourself

Requirements: Node.js 20 or newer, a free PayPal developer account (sandbox), and optionally a Claude API key.

```bash
git clone https://github.com/autogongbang-hub/duet-slides
cd duet-slides
npm install
cp .env.example .env
```

Fill in `.env`:
- `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` from developer.paypal.com, Apps & Credentials, Sandbox
- `ADMIN_TOKEN`: any long random string (protects campaign changes)
- `CLAUDE_API_KEY` (optional): turns on the AI draft and the giving assistant

```bash
npm start
```

Then open:

| Address | What |
|---|---|
| http://127.0.0.1:8787/ | slide editor |
| http://127.0.0.1:8787/?view=presenter | presenter window |
| http://127.0.0.1:8787/give/ | giving page |
| http://127.0.0.1:8787/screen/ | giving screen with QR |
| http://127.0.0.1:8787/overlay/ | OBS browser source (add `?demo=1` to rehearse) |
| http://127.0.0.1:8787/host/ | giving assistant |

Webhooks need a public address. Deploy it, or open a tunnel, then register the hook:

```bash
node tools/paypal-webhook.mjs create https://<your-host>/api/paypal/webhook
```

This writes `PAYPAL_WEBHOOK_ID` to `.env`. Without a webhook, gifts are still recorded from the capture response.

Deploying to Render: `render.yaml` is included. Secrets are typed into the Render dashboard, never committed.

## Built during the hackathon

Duet Slides grew out of a Korean worship slide tool I started in September 2026 for a church I work with. It already had the slide editor, two-line slides and public domain Bibles. During the submission period (from October 1, 2026) I built the English edition and everything for this hackathon:
- the English-only build, with the Korean hymnal and Korean Bible removed (they are copyrighted)
- PayPal giving split by purpose, capture and verified webhooks
- the giving screen with QR and live goal bars
- the OBS overlay with two-language thank-yous
- the AI draft for the second-language line
- the giving assistant agent and the operator page
- the server, deployment files and this README

## What's next

- A native OBS plugin, so the slides and the overlay live inside OBS
- Streamers and conferences, using the same overlay with general wording
- Licensed modern Bible translations, paid through the same giving flow
- More languages in the AI draft and in the built-in Bibles

## Content and licenses

- Code: AGPL-3.0 (see `LICENSE`).
- Bibles: World English Bible, King James Version, Reina-Valera 1909, all public domain.
- Sample hymns, all public domain: "Amazing Grace" (John Newton, 1779), "Holy, Holy, Holy" (Reginald Heber, 1826), "It Is Well with My Soul" (Horatio G. Spafford, 1873), "Blessed Assurance" (Fanny Crosby, 1873) and the Doxology (Thomas Ken, about 1674).
- Churches paste their own songs and are responsible for their own song licenses (for example CCLI).
- Libraries: Anthropic SDK (MIT) on the server; qrcode-generator 1.4.4 (MIT), bundled for the giving screen; PptxGenJS 3.12.0 (MIT, from a CDN, for PowerPoint export); MQTT.js 5 (MIT, from a CDN, only when wireless remote control is used).
