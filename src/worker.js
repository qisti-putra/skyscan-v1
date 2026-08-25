const APP_VERSION = '1.0.2';

const WSSS = {
  icao: 'WSSS',
  name: 'Singapore Changi Airport',
  lat: 1.359167,
  lon: 103.989444,
  elevationFt: 22,
  liveAtcUrl: 'https://www.liveatc.net/search/?icao=WSSS',
  frequencies: [
    { service: 'Singapore Arrival', mhz: '119.300', role: 'Intermediate/final approach' },
    { service: 'Singapore Departure', mhz: '120.300', role: 'Departure primary' },
    { service: 'Singapore Approach', mhz: '124.050', role: 'Approach/flow control' },
    { service: 'Singapore Approach', mhz: '124.600', role: 'Approach' },
    { service: 'Singapore Approach', mhz: '126.300', role: 'Approach' },
    { service: 'Singapore Tower', mhz: '118.600', role: 'RWY 02L/20R' },
    { service: 'Singapore Tower', mhz: '118.250', role: 'RWY 02C/20C' },
    { service: 'Singapore Tower', mhz: '131.400', role: 'RWY 02R/20L' },
    { service: 'Singapore Ground', mhz: '124.300', role: 'Ground sector' },
    { service: 'Singapore Ground', mhz: '121.725', role: 'Ground sector' },
    { service: 'Singapore Ground', mhz: '121.850', role: 'Ground sector' },
    { service: 'Singapore Delivery', mhz: '121.650', role: 'Clearance delivery' }
  ],
  runways: [
    { id: '02L/20R', headingA: 23, headingB: 203, a: { lat: 1.348964, lon: 103.97745 }, b: { lat: 1.376117, lon: 103.988914 }, tower: '118.600' },
    { id: '02C/20C', headingA: 23, headingB: 203, a: { lat: 1.328753, lon: 103.984961 }, b: { lat: 1.362047, lon: 103.999017 }, tower: '118.250' },
    { id: '02R/20L', headingA: 23, headingB: 203, a: { lat: 1.322386, lon: 103.999847 }, b: { lat: 1.355681, lon: 104.013903 }, tower: '131.400' }
  ]
};

const WSSL = {
  icao: 'WSSL',
  name: 'Seletar Airport',
  lat: 1.41695,
  lon: 103.86765,
  elevationFt: 36,
  liveAtcUrl: 'https://www.liveatc.net/search/?icao=WSSL',
  frequencies: [
    { service: 'Seletar Tower', mhz: '118.450', role: 'Tower primary' },
    { service: 'Seletar Tower', mhz: '130.200', role: 'Tower secondary' },
    { service: 'Seletar Ground', mhz: '121.600', role: 'Ground' },
    { service: 'Seletar Approach', mhz: '126.025', role: 'Intermediate approach' },
    { service: 'Singapore Approach', mhz: '124.050', role: 'Approach/flow control' },
    { service: 'Singapore Approach', mhz: '124.600', role: 'Approach' },
    { service: 'Singapore Approach', mhz: '126.300', role: 'Approach' },
    { service: 'Seletar Airport Information', mhz: '128.425', role: 'ATIS' }
  ],
  runways: []
};

const AIRPORTS = { WSSS, WSSL };

const AIRCRAFT_PROVIDERS = [
  { name: 'ADSB One', base: 'https://api.adsb.one/v2/point', license: 'provider terms' },
  { name: 'adsb.lol', base: 'https://api.adsb.lol/v2/point', license: 'ODbL 1.0' },
  { name: 'Airplanes.live', base: 'https://api.airplanes.live/v2/point', license: 'provider terms' }
];

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-skyscan-version': APP_VERSION,
      ...extra
    }
  });
}

function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
function finiteNumber(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }
function cleanFlight(v) { return typeof v === 'string' ? v.trim() : ''; }

async function fetchJson(url, { ttl = 0, headers = {}, timeoutMs = 6500 } = {}) {
  const cache = caches.default;
  const cacheKey = new Request(url, { method: 'GET' });
  if (ttl > 0) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached.json();
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json', ...headers },
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`Upstream ${res.status}`);

    if (ttl > 0) {
      const clone = res.clone();
      const cacheable = new Response(clone.body, clone);
      cacheable.headers.set('cache-control', `public, max-age=${ttl}`);
      await cache.put(cacheKey, cacheable);
    }
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

function normalizeAircraft(item) {
  if (!item || !Number.isFinite(item.lat) || !Number.isFinite(item.lon)) return null;
  const altRaw = item.alt_baro === 'ground' ? 0 : finiteNumber(item.alt_baro);
  return {
    id: String(item.hex || '').toUpperCase(),
    callsign: cleanFlight(item.flight),
    registration: item.r || '',
    type: item.t || '',
    lat: item.lat,
    lon: item.lon,
    altitudeFt: altRaw,
    geometricAltitudeFt: finiteNumber(item.alt_geom),
    speedKt: finiteNumber(item.gs),
    trackDeg: finiteNumber(item.track ?? item.true_heading ?? item.mag_heading),
    verticalRateFpm: finiteNumber(item.baro_rate ?? item.geom_rate),
    squawk: item.squawk || '',
    emergency: item.emergency || '',
    category: item.category || '',
    seenSeconds: finiteNumber(item.seen),
    sourceType: item.type || ''
  };
}

async function fetchAircraftWithFailover(lat, lon, radius) {
  const attempts = [];

  for (const provider of AIRCRAFT_PROVIDERS) {
    const endpoint = `${provider.base}/${lat}/${lon}/${radius}`;
    const started = Date.now();
    try {
      const data = await fetchJson(endpoint, { ttl: 5, timeoutMs: 5500 });
      const aircraft = Array.isArray(data?.ac) ? data.ac.map(normalizeAircraft).filter(Boolean) : [];
      attempts.push({ provider: provider.name, ok: true, ms: Date.now() - started, count: aircraft.length });
      return { provider, aircraft, attempts };
    } catch (err) {
      attempts.push({
        provider: provider.name,
        ok: false,
        ms: Date.now() - started,
        error: String(err?.message || err)
      });
    }
  }

  const error = new Error('All aircraft providers unavailable');
  error.attempts = attempts;
  throw error;
}

async function aircraftApi(url) {
  const lat = finiteNumber(url.searchParams.get('lat'));
  const lon = finiteNumber(url.searchParams.get('lon'));
  const radius = clamp(Math.round(finiteNumber(url.searchParams.get('radius')) ?? 50), 1, 250);
  if (lat === null || lon === null || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return json({ error: 'Valid lat/lon required.' }, 400);
  }

  const qLat = Math.round(lat * 200) / 200;
  const qLon = Math.round(lon * 200) / 200;

  try {
    const result = await fetchAircraftWithFailover(qLat, qLon, radius);
    return json({
      source: result.provider.name,
      sourceLicense: result.provider.license,
      fetchedAt: new Date().toISOString(),
      center: { lat, lon, radiusNm: radius },
      aircraft: result.aircraft,
      providerAttempts: result.attempts
    });
  } catch (err) {
    return json({
      error: 'Aircraft feed unavailable.',
      detail: String(err?.message || err),
      providerAttempts: Array.isArray(err?.attempts) ? err.attempts : []
    }, 502);
  }
}

async function weatherApi(url) {
  const icao = (url.searchParams.get('icao') || 'WSSS').trim().toUpperCase();
  if (!/^[A-Z0-9]{4}$/.test(icao)) return json({ error: 'ICAO must be 4 characters.' }, 400);
  const metarUrl = `https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(icao)}&format=json`;
  const tafUrl = `https://aviationweather.gov/api/data/taf?ids=${encodeURIComponent(icao)}&format=json`;
  try {
    const [metar, taf] = await Promise.all([
      fetchJson(metarUrl, { ttl: 60 }),
      fetchJson(tafUrl, { ttl: 300 }).catch(() => [])
    ]);
    return json({
      source: 'aviationweather.gov',
      fetchedAt: new Date().toISOString(),
      icao,
      metar: Array.isArray(metar) ? (metar[0] || null) : null,
      taf: Array.isArray(taf) ? (taf[0] || null) : null
    });
  } catch (err) {
    return json({ error: 'Weather feed unavailable.', detail: String(err?.message || err) }, 502);
  }
}

function airportApi(url) {
  const icao = (url.searchParams.get('icao') || 'WSSS').trim().toUpperCase();
  const airport = AIRPORTS[icao];
  if (airport) return json({ source: 'SkyScan curated from official AIP', airport });
  return json({
    source: 'SkyScan',
    airport: {
      icao,
      name: icao,
      liveAtcUrl: `https://www.liveatc.net/search/?icao=${encodeURIComponent(icao)}`,
      frequencies: [],
      runways: []
    },
    note: 'Detailed airport intelligence is currently curated for WSSS and WSSL.'
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') return json({ ok: true, version: APP_VERSION, time: new Date().toISOString() });
    if (url.pathname === '/api/aircraft') return aircraftApi(url);
    if (url.pathname === '/api/weather') return weatherApi(url);
    if (url.pathname === '/api/airport') return airportApi(url);
    return env.ASSETS.fetch(request);
  }
};
