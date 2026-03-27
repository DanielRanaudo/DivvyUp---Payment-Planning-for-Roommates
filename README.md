# DivvyUp — Payment Planning for Roommates

Split rent, utilities, and shared expenses with your roommates. Features smart settlement algorithms that minimize the number of payments needed.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/              # Next.js App Router (layout, page, styles)
├── components/
│   ├── screens/      # Welcome, CreateGroup, JoinGroup
│   └── tabs/         # Dashboard, Rent, Utilities, Expenses, Settle, Members
├── lib/
│   ├── types.ts      # TypeScript interfaces
│   ├── tokens.ts     # Apple-style design tokens
│   ├── settlements.ts # Smart + simple settlement algorithms
│   └── utils.ts      # Helpers (uid, groupCode, getInitials)
```

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript**
- **Tailwind CSS v4**
- State managed in React (Supabase backend coming soon)

## Deploy

Push to GitHub and import on [Vercel](https://vercel.com) — zero config needed.
