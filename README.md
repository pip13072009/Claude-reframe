# Tally — a free drinks tracker

A lightweight, free alternative to apps like Reframe for planning and
tracking your drinking week. Plan a daily drink target for the week
ahead, log what actually happens each day, and see how you did once
the week's over.

Everything runs in the browser and is stored in `localStorage` on your
device — no account, no backend, no data leaves your machine.

## Features

- **Plan ahead** — set a target number of drinks per day (or a whole
  week) before the week starts.
- **Track as you go** — log actual drinks per day with a couple of
  taps; today's date is highlighted, future days are locked until
  they arrive.
- **Weekly summary** — running total vs. your weekly limit, alcohol-free
  days, and how many days you kept within plan.
- **History** — every past week you've tracked, with plan vs. actual so
  you can see trends over time.
- **Settings** — customize the unit label (drinks, units, beers, …),
  the default daily target for new weeks, and your alcohol-free day
  goal.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## Build for production

```bash
npm run build
```

This outputs a static site to `dist/` that can be hosted for free on
any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages,
etc.) — there's no server component.

## Tech stack

- [Vite](https://vite.dev) + [React](https://react.dev) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) for styling
- [date-fns](https://date-fns.org) for date/week math
- Browser `localStorage` for persistence
