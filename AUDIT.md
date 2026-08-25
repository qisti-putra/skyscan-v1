# SkyScan V1.0.1 — Audit Record

Audit date: 26 August 2026

## Result before Cloudflare deployment

**PASS — repository is deployment-ready.**

The exact GitHub repository contains the required Cloudflare Worker configuration, static PWA assets and API worker.

## Checks completed

- JavaScript syntax passed for the Cloudflare Worker.
- JavaScript syntax passed for the self-contained browser application.
- JavaScript syntax passed for the service worker.
- `manifest.webmanifest` parses as valid JSON.
- `wrangler.jsonc` parses as valid JSON-compatible configuration.
- Cloudflare Worker name is `skyscan-v1` and matches the intended project name.
- Static assets are served from `/public` through Cloudflare Workers Assets.
- `/api/*` is routed through the Worker before static assets.
- `/api/health`, `/api/aircraft`, `/api/weather` and `/api/airport` routes are present.
- Aircraft source is isolated behind the SkyScan Worker rather than called directly from the phone.
- AviationWeather.gov is isolated behind the Worker, avoiding browser CORS dependency.
- No paid API key is required by V1.
- No database is required by V1.
- No user account/login system is required by V1.
- Live ATC audio is not embedded, proxied, copied or rebroadcast. SkyScan opens the provider's own page.
- Service-worker offline caching excludes `/api/*`, preventing stale live aircraft/weather responses from being stored as offline live data.
- The mobile UI includes Radar, Map, Sky Finder, ATC, Weather and Settings views.
- The interface includes GPS and manual-coordinate fallback.
- Runway and ATC outputs are labelled as likely/inferred rather than authoritative ATC information.
- Singapore Changi departure reference was corrected to include Singapore Departure 120.300 MHz.
- Seletar references were expanded before release.

## Data-contract verification

The current adsb.lol documentation still exposes `/v2/point/{lat}/{lon}/{radius}` for aircraft surrounding a point up to 250 NM and states the public API/data license as ODbL.

AviationWeather.gov currently exposes worldwide METAR and TAF JSON endpoints under `/api/data` and requests responsible/rate-limited use.

## Architecture amendment made during audit

The original multi-file front end was simplified into one self-contained `public/index.html`. This removes two extra first-party asset dependencies and lowers the chance of missing-file deployment errors during phone-only management.

The PWA service-worker cache list was amended to match this self-contained structure.

## Remaining external gate

A true production smoke test can only be completed after the GitHub repository is connected to the user's Cloudflare account and deployed. After deployment, verify:

1. `/api/health` returns `ok: true`.
2. SkyScan shows `LIVE` rather than `DEMO`.
3. GPS permission works on the user's iPhone.
4. Nearby aircraft populate from the live ADS-B source.
5. WSSS METAR/TAF populate.
6. MapLibre/OpenFreeMap render on the user's mobile network.
7. ATC provider link opens externally.
8. Add to Home Screen installs and launches the PWA.
9. Refreshing/reopening does not surface stale API data.
10. No Cloudflare build/deploy errors are present.

## Important note

No software can truthfully be guaranteed error-free under all future browser, provider, network or API changes. This release has passed the checks available before deployment; the post-deployment smoke test is the final release gate.
