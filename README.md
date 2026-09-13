# Daily Deebs

Daily Dead by Daylight icon quiz. The frontend publishes to GitHub Pages from main.

## Run locally

Use Node 22 and pnpm 11.25.0. Run `pnpm install --frozen-lockfile`, `node scripts/restore-assets.mjs`, then `pnpm exec vite --config vite.pages.config.ts`.

## Publish

In Settings → Pages choose GitHub Actions. The included workflow downloads the versioned image/font catalogue, verifies SHA-256 checksums, builds the frontend, and publishes it. Assets are served by GitHub Pages after deployment. The existing Daily Deebs service supplies the build assets and shared statistics API; keep that service live.

## Data and support

Game descriptions and assets belong to their respective owners. Gameplay reference: https://deadbydaylight.wiki.gg/ . The current playable catalogue excludes entries without usable icons. Support payments are optional and use NZD. The public Stripe link is configured in app/support-config.ts. Donations from NZ$0.50 to NZ$10,000 are supported; amounts are prefilled in NZD cents and can be edited at Stripe checkout. USD figures are indicative Frankfurter reference-rate estimates; Stripe determines any conversion at checkout.

Monthly catalogue changes must update app/data/catalog.json and scripts/assets.json, alongside the statistics service catalogue, so daily questions remain consistent.
