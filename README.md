# Orim — Liquid Glass Hero

A single-page React + TypeScript + Vite + Tailwind hero section with a "liquid glass"
navbar over a looping background video. Icons by `lucide-react`.

## Requirements
- Node.js 18 or newer (`node -v` to check)

## Run locally
```bash
npm install      # installs dependencies into node_modules (not committed)
npm run dev      # starts the dev server, usually http://localhost:5173
```

## Build for production
```bash
npm run build    # type-checks and outputs static files to /dist
npm run preview  # serves the built /dist locally to test it
```

## Deploy (Vercel — recommended)
1. Push this repo to GitHub.
2. Go to vercel.com -> New Project -> import the repo.
3. Vercel auto-detects Vite. Build command `npm run build`, output dir `dist`.
4. Deploy. Every push to `main` redeploys automatically.

## Customize
- Brand name / logo: `src/App.tsx` — the logo `<div>` (Infinity icon + "Orim").
- Headline & copy: `src/App.tsx` — the `<h1>` and `<p>` in the hero block.
- Background video: `src/App.tsx` — the `BG_VIDEO` constant (host your own .mp4).
- Glass effect & fonts: `src/index.css`.
