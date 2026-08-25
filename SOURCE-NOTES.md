# SkyScan V1 Data Source Notes

## Aircraft
- adsb.lol API: https://api.adsb.lol/
- V1 uses `/v2/point/{lat}/{lon}/{radius}`.
- Documented maximum radius: 250 NM.
- Provider states public data/API under ODbL 1.0.

## Aviation weather
- AviationWeather.gov API: https://aviationweather.gov/data/api/
- METAR: `/api/data/metar?ids={ICAO}&format=json`
- TAF: `/api/data/taf?ids={ICAO}&format=json`

## Maps
- OpenFreeMap: https://openfreemap.org/
- MapLibre GL JS

## Singapore aviation references
SkyScan's WSSS/WSSL frequency and airport reference data is curated from Civil Aviation Authority of Singapore AIP/AIM publications. Frequency information can change and should never be used for operational aviation purposes.

## ATC audio
SkyScan does not scrape, proxy, copy, embed or rebroadcast LiveATC audio. The app only opens the provider's own airport search/listening page.
