# Meridian — Deploy Guide

A circadian performance day-planner, packaged as an installable PWA with a serverless Claude proxy.

**Why this fixes the mobile AI failure:** in the Claude artifact, AI calls route through Claude's environment, which the mobile webview blocks. Here, the browser calls *your* `/api/claude` endpoint, which calls Anthropic server-side. Normal HTTPS request — works everywhere.

---

## What's in here

```
meridian/
├── api/
│   └── claude.js          serverless fn — holds your API key, proxies Claude
├── public/
│   ├── index.html         the whole app (engine + UI, self-contained)
│   ├── manifest.json      makes it installable
│   ├── sw.js              service worker (caches shell, never the API)
│   ├── icon-192.png
│   └── icon-512.png
├── vercel.json
├── package.json
└── README.md
```

---

## Deploy (about 10 minutes)

### 1. Get an Anthropic API key
- Go to https://console.anthropic.com → API Keys → Create Key
- Copy it (starts with `sk-ant-`)
- Add a few dollars of credit under Billing. Each AI call costs a fraction of a cent.

### 2. Push to GitHub
- Create a new repo (private is fine)
- Upload this entire folder

*(Or skip Git: install the Vercel CLI with `npm i -g vercel`, then run `vercel` from this folder and follow the prompts.)*

### 3. Deploy on Vercel
- https://vercel.com → sign up (free, use your GitHub account)
- **Add New → Project** → import your repo
- Framework preset: **Other**. Leave build settings empty — everything is static plus one function.
- Before clicking Deploy, open **Environment Variables** and add:
  - Name: `ANTHROPIC_API_KEY`
  - Value: your `sk-ant-...` key
- Click **Deploy**

You'll get a URL like `meridian-xyz.vercel.app`.

### 4. Install on your phone
- Open the URL in **Safari** (iOS) or **Chrome** (Android)
- iOS: Share → **Add to Home Screen**
- Android: menu → **Install app**

It launches fullscreen with its own icon. No App Store.

---

## Verify it works

1. Open the site on your phone
2. Tap any block → panel opens
3. Tap **Why this placement** → you should get real reasoning within a few seconds

If it fails, the error now shows the actual reason instead of a generic message:

| Error | Cause | Fix |
|---|---|---|
| `ANTHROPIC_API_KEY not set` | env var missing | Add it in Vercel → Settings → Environment Variables, then **redeploy** |
| `401` / `authentication_error` | bad key | Regenerate the key, update the env var |
| `400` / `credit balance too low` | no credit | Add credit in the Anthropic console |
| `404` | function not found | Confirm `api/claude.js` is at the repo root, not nested |

**Note:** changing an env var requires a redeploy to take effect (Deployments → ⋯ → Redeploy).

---

## Updating the app

Edit `public/index.html`, push to GitHub, Vercel auto-deploys. The service worker is network-first, so your phone picks up changes on next open (no reinstall).

---

## Cost

- **Vercel**: free tier is plenty
- **Anthropic API**: pay per call. Roughly a fraction of a cent per Why/Optimize. Ten testers using it daily for a month is a few dollars.

---

## Known limits (deliberate — this is still a prototype)

- **State is in-memory.** Refresh resets your week. This is the next real build: a Supabase table keyed to a user, plus auth. Everything it would wrap is already proven.
- **The curve constants are estimates.** The sigmas and ideal-window offsets in `scoreDay` are judgment calls, not sourced literature. Before this goes to an audience that checks the work, that calibration pass is the highest-value remaining task — it's the thing your whole "teach me the mechanism" positioning rests on.
- **Consistency needs multiple days built** to produce a real variance number.

---

## Where the engine lives

All in `public/index.html`:

- `scoreDay(blocks)` — the four pillars, penalty-weighted aggregation, flags
- `computeConsistency()` — real variance across built days
- `ACT` / `CUSTOM_DEFS` — the placement curves (ideal window + sigma per activity)
- `profileText()` — the physiological principles handed to the AI on every call

Change an anchor or a curve in one place and the whole app re-scores.
