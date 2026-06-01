# Albis Intelligence Wiki

The Albis Intelligence Wiki is the private compiled knowledge layer for Albis.

## Location

`albis-intelligence/`

## Why it exists

Raw scans and comments are not enough. The wiki lets Albis accumulate learning across days/weeks/months:

- narrative frames
- regional blind spots
- topic histories
- source/outlet context
- PGI/GAI patterns
- community comment signals
- editorial/product/SEO lessons

## How to view it now

Open this folder in Obsidian, VS Code, Cursor, or any markdown viewer:

```bash
open /Users/treelight/.openclaw/workspace/albis-app/albis-intelligence
```

## Local commands

```bash
npm run intelligence:wiki:status
npm run intelligence:wiki:ingest-latest
```

`status` checks the wiki shape and writes a status report.  
`ingest-latest` copies the newest safe scan/community-weather source packet into `raw/` and updates source registers/logs.

## Future viewer

A private admin viewer can live at:

`/admin/intelligence`

V0 keeps the actual wiki markdown off the public site bundle. Public-facing intelligence pages should be deliberately promoted from reviewed wiki synthesis, not exposed wholesale.
