# Smaglinski family portfolio

A localhost-first portfolio for Ian, Jacob, and Isaac Smaglinski. The interface
uses full-screen tabs for the brothers, shared builds, and each individual
profile instead of a long scrolling landing page.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

On this Windows machine, PowerShell may block `npm.ps1`. If that happens, use:

```powershell
npm.cmd install
npm.cmd run dev
```

The server binds only to `127.0.0.1`, so it is available on this computer and
is not exposed to the local network. There is no Sites, ChatGPT, Cloudflare,
database, or authentication integration in this project.

## Keyboard controls

- Press `1` or `2` to switch the home tabs.
- Press `1` through `4` to switch profile tabs.
- Use arrow keys, Home, and End while focused on a tab.
- Press Escape in Built Together to return to the brothers.
- Browser Back and Forward restore previous tab choices.

## Updating content

- Profile, resume, and project content: `app/site-data.ts`
- Home tab interface: `app/home-tabs.tsx`
- Profile tab interface: `app/profile-tabs.tsx`
- Warm responsive theme: `app/warm.css`
- Base component styles: `app/globals.css`
- Project photography: `public/images/projects/`
- Temporary portrait stand-ins: `public/images/portraits/`
- Portfolio assistant UI: `app/family-chat.tsx`
- Local preview answers: `app/assistant-knowledge.ts`
- Future model API seam: `app/api/assistant/route.ts`

Each person in `app/site-data.ts` has a `primaryPortrait` headshot and a
`hoverPortrait` full-body image. Replace those paths when the real photos are
ready; the card interaction and profile layout will update automatically. Raw
resume PDFs, phone numbers, and street addresses remain outside the
public-facing UI.

The portfolio assistant currently calls a local API route and returns
deterministic answers from the site content. It is visibly labeled as a preview;
no custom model or external service is connected yet. When a model is ready,
replace the answer implementation inside the server route and keep its API keys
in `.env.local`—never in browser code or a `NEXT_PUBLIC_*` variable.

## Checks

```bash
npm run lint
npm test
```
