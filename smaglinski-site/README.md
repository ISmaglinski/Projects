# Smaglinski family portfolio

The shared portfolio for Ian, Jacob, and Isaac Smaglinski. The site combines a
family landing page, group project gallery, and individual resume-style profile
pages.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
npm test
```

## Updating the site

- Edit profile and resume content in `app/site-data.ts`.
- Add primary and hover portraits through the portrait component in
  `app/components.tsx`; the placeholder system already supports both states.
- Add shared project photos under `public/images/projects/` and update
  `sharedProjects` in `app/site-data.ts`.
- Page structure lives in `app/page.tsx` and `app/[person]/page.tsx`.
- The visual system and responsive behavior live in `app/globals.css`.

The first release intentionally keeps phone numbers, street addresses, and raw
resume PDFs out of the public site. Add redacted resume files later if download
links are desired.

## Hosting

The project uses vinext and the Sites-compatible Cloudflare Worker output. Site
configuration is stored in `.openai/hosting.json`.
