This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Dashboard data

The dashboard caches recently loaded workspace data in tab-scoped `sessionStorage` for up to five minutes. Cached data is shown on reload; data older than five minutes is revalidated on startup. Use the refresh button to sync the current section immediately. Signing out clears the cached workspace. Browser session storage is not encrypted, so sign out when using a shared device.

The recycle bin is fetched only when opened. Directory searches are debounced, and superseded directory/refresh requests are aborted. Workspace cache writes are deferred briefly to avoid serializing large state updates on every render.

Invoices are loaded only when the Invoices section is opened. Opening an invoice fetches its full detail once per tab session and reuses the cached response; invoice PDFs and the `jspdf` library are loaded/generated on demand. Dashboard directories, forms, and dialogs are split into client-side chunks and loaded when needed.

Policy documents are fetched only after selecting **Load documents** in a policy's details. Their signed view links are kept in memory, and **Refresh documents** requests new links when needed.

The sign-in page is server-rendered, but protected workspace data is currently fetched in the browser because the access token is stored in `localStorage`. To safely server-render authenticated data, move authentication to a server-managed `HttpOnly`, `Secure`, `SameSite` cookie and proxy/authorize API requests on the server. Rate limiting and login brute-force protection must be enforced by the backend or API gateway; browser-side throttling is not a security control.

The frontend does not automatically retry throttled or failed requests. It surfaces HTTP 429 responses and honors the server's `Retry-After` guidance so retries do not amplify request load.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
