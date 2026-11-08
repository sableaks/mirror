# Site mirror

1. Edit `.github/workflows/mirror.yml` and set `SITE_URL` to the site you want.
2. Go to Actions → mirror → Run workflow (first sync).
3. Import the repo in Vercel (framework: Other). `vercel.json` already points it at `site/`.

It re-syncs every 15 minutes and only commits when something changed.
