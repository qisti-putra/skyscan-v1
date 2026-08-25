# SkyScan V1

**See it. Hear it. Understand it.**

SkyScan is a mobile-first live airspace intelligence PWA. It combines nearby ADS-B aircraft, aviation weather, Singapore airport/runway intelligence, ATC frequency guidance and sky-finding tools.

## Phone-only deployment

This repository is intentionally prepared so deployment can be done from a phone browser without Node.js, Terminal, a laptop, API keys or a database.

### Deploy with Cloudflare

1. Sign in to the Cloudflare dashboard on your phone.
2. Open **Workers & Pages**.
3. Tap **Create application**.
4. Choose **Import a repository**.
5. Connect GitHub if prompted.
6. Choose **qisti-putra/skyscan-v1**.
7. Keep the project root as the repository root.
8. The Worker name must be **skyscan-v1** to match `wrangler.jsonc`.
9. Keep the default deploy command **`npx wrangler deploy`**.
10. Tap **Save and Deploy**.
11. Open the `workers.dev` address Cloudflare gives you.
12. Tap **Use My Location** and allow location access.
13. On iPhone Safari, use **Share > Add to Home Screen** to install SkyScan like an app.

Every future commit to the production branch can be automatically rebuilt and deployed by Cloudflare once Git integration is connected.

## Included in V1

- Live aircraft around GPS or manual coordinates
- Radar range up to 250 NM (provider permitting)
- Aircraft callsign, registration/type, altitude, speed, heading and vertical rate when available
- Distance/bearing calculations and short session trails
- “What’s That Plane?” nearest/direction-matched aircraft selection
- Sky Finder bearing and approximate elevation angle
- MapLibre + OpenFreeMap geographic map
- METAR + TAF aviation weather
- Changi runway-flow inference from wind and aircraft movement
- Flight-phase inference
- Singapore Changi and Seletar ATC frequency guidance
- External LiveATC listening links; SkyScan does not rebroadcast third-party audio
- PWA installation and offline app-shell caching

## Data sources

- Aircraft: adsb.lol
- Weather: AviationWeather.gov
- Maps: OpenFreeMap + MapLibre GL JS
- Singapore airport/frequency/runway references: CAAS AIP
- ATC listening: external provider page only

## Important limitation

SkyScan is for education, situational awareness and plane spotting only. It is not an aviation navigation, flight-safety, dispatch, surveillance or ATC system. ADS-B coverage can be incomplete or stale. “Likely runway”, “Likely ATC service”, flight phases and plane matching are algorithmic inferences, not official ATC instructions.

Version 1.0.1 — phone-first deployment edition.
