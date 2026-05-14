# Albis

Albis is deployed on **Cloudflare Workers/OpenNext**, not Vercel.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Production deploy

Production deploys run through GitHub Actions on push to `main` using `.github/workflows/deploy.yml`.

The workflow builds with OpenNext and deploys with Wrangler/Cloudflare:

```bash
npm run deploy
```

Required deploy secrets live in GitHub Actions / Cloudflare, including `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Do not use Vercel for Albis deploys.
