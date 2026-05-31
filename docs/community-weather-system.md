# Albis Community Weather System

Purpose: prove the community-media direction safely with weather first.

The system starts from traditional/public sources, then creates a daily "what we are learning from the community" report. In v0 the community layer is a structured prompt/status layer: it identifies where on-the-ground human context is most needed. Later we can ingest Albis comments, Telegram/X replies, partner/local submissions, and verified eyewitness media.

## Daily command

```bash
cd /Users/treelight/.openclaw/workspace/albis-app
npx tsx scripts/run-community-weather-daily.ts --limit=100 --media-per-city=3 --media-scope=active
```

Outputs:

- `data/community-weather/YYYY-MM-DD.json` — canonical run data
- `public/community-weather/YYYY-MM-DD.json` — public-readable JSON
- `public/community-weather/latest.json` — latest public-readable JSON
- `reports/community-weather/YYYY-MM-DD.md` — editorial/community learning report
- `reports/community-weather/YYYY-MM-DD-social.txt` — daily social copy

To post to X via Postiz:

```bash
npx tsx scripts/run-community-weather-daily.ts --limit=100 --media-per-city=3 --media-scope=active --post
```

Requires `POSTIZ_API_KEY`; defaults to the Albis X integration ID unless `POSTIZ_X_INTEGRATION_ID` is set.

## Current v0 source layers

1. **Weather data:** Open-Meteo public forecast/current conditions.
2. **Traditional media:** GDELT article search for city-level weather/disruption mentions.
3. **Community learning layer:** generated status and prompts for where local lived context is needed.

## Status language

- `routine` — no automated threshold and no current media signal.
- `media-mentioned` — traditional media has a weather/disruption signal, but automated weather risk is low.
- `weather-watch` — automated weather thresholds plus media signal.
- `community-watch-needed` — automated weather thresholds with no media signal; this is where local human truth may matter most.

## Product principle

Do not rank people. The report should answer: **what are we learning from people and communities as events unfold?**

Weather is the proving ground because it is globally relevant, human-lived, easier to verify than politics, and useful to media if Albis becomes a trusted updater of local conditions.

## Next build steps

1. Add a `/community-weather` page that renders `latest.json` as a simple public city watchlist.
2. Add an Albis submission/comment intake for city updates.
3. Add trust fields: contributor locality, evidence type, corroboration count, moderation status.
4. Add daily scheduling through the existing cron/launchd pattern once the output format is approved.
5. Expand from weather into disruption, transport, power, protests, conflict, and civic emergencies only after moderation and verification rules are stronger.
