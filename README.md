# Your expenses

A responsive personal expense-tracking app built with React, Vite, Recharts, and Lucide icons. It is designed to be easy to run locally and deploy to GitHub Pages.

## Features

- Dashboard with income, expenses, net cash flow, recent transactions, and category spending chart.
- Create, edit, search, filter, and delete income/expense records.
- Category budgets with progress and overspending indicators.
- Reports with category charts and CSV exports.
- Currency display preferences and monthly income/savings goals.
- Browser persistence with `localStorage`.
- Responsive layout for desktop, tablet, and mobile.

## Requirements

- Node.js 20.19+ or 22.12+ recommended
- npm
- A GitHub account for hosting

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Production build

```bash
npm run build
npm run preview
```

Vite writes the production site into `dist/`.

## Deploy to GitHub Pages

1. Create a GitHub repository named `your-expenses` (or use another name).
2. Extract this project and open a terminal in its root directory.
3. Run `npm install`.
4. If the repository is **not** named `your-expenses`, edit `vite.config.js` to include the matching base path:

   ```js
   import { defineConfig } from "vite";
   import react from "@vitejs/plugin-react";

   export default defineConfig({
     plugins: [react()],
     base: "/YOUR-REPOSITORY-NAME/",
   });
   ```

   For a repository named `your-expenses`, the equivalent base is `/your-expenses/`. If you plan to deploy to a custom domain or a `username.github.io` repository, use `base: "/"`.

5. Add and push the project:

   ```bash
   git init
   git add .
   git commit -m "Build Your expenses app"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/your-expenses.git
   git push -u origin main
   ```

6. In GitHub, open **Settings → Pages** and choose **GitHub Actions** as the build and deployment source. Commit the included workflow if it is not already on `main`.
7. Wait for the Pages workflow to finish. Your site URL will appear under **Settings → Pages**.

### GitHub Actions deployment workflow

This repository includes `.github/workflows/deploy.yml`, which installs dependencies, builds the site, and publishes `dist/` to GitHub Pages on each push to `main`.

## Real-life use of arrays

Arrays are used as the core data model in `src/App.jsx`:

- `transactions`: the list of income and expense records.
- `budgets`: category spending limits.
- `CATEGORIES`: allowed transaction categories.
- `.filter()`: find records matching the selected month, type, or search query.
- `.map()`: render transaction rows and budget cards, and update one record without mutating the original array.
- `.reduce()`: calculate income, expenses, cash flow, and budget totals.
- `.sort()`: show the newest transaction first.
- `.find()` / `.some()`: locate records and check whether a budget exists.
- Spread syntax (`...old`) creates updated arrays instead of mutating state directly.

Example:

```js
const monthlyExpenses = transactions
  .filter(t => t.type === "Expense" && t.date.startsWith(month))
  .reduce((total, transaction) => total + transaction.amount, 0);

setTransactions(current =>
  current.map(t => t.id === edited.id ? edited : t)
);
```

## Data storage and limitations

This version stores data in the browser's `localStorage`. It persists on the same browser/device but is not synced between devices and can be erased by clearing browser data. Export CSV backups regularly. The sample records are demo data; delete them when you start using the app for real records.

This is a front-end app, not a banking app. It does not connect to banks or process payments. Currency selection changes display formatting only; it does not convert amounts. There is no authentication or cloud database in this version, so do not use it for sensitive multi-user financial data without adding a secure backend.

## Suggested production upgrades

For multi-device access and real users, add a backend (for example, Supabase or Firebase), authentication, server-side authorization, database backups, and automated tests before collecting sensitive financial information.
