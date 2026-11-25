'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

const WAQI_TOKEN = (process.env.WAQI_TOKEN || '').trim();
const FRONTEND_ORIGIN = (process.env.FRONTEND_ORIGIN || '').trim();
const ALLOWED_ORIGINS = FRONTEND_ORIGIN
  ? FRONTEND_ORIGIN.split(',').map((x) => x.trim().replace(/\/+$/, '')).filter(Boolean)
  : [];

const AI_PROVIDER_ENV = (process.env.AI_PROVIDER || '').trim().toLowerCase();
const AI_API_KEY = (process.env.AI_API_KEY || process.env.GROQ_API_KEY || '').trim();
const AI_BASE_URL = (process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1').trim().replace(/\/+$/, '');
const AI_MODEL_ENV = (process.env.AI_MODEL || '').trim();
const OLLAMA_URL = (process.env.OLLAMA_URL || (IS_PROD ? '' : 'http://localhost:11434')).trim().replace(/\/+$/, '');
const OLLAMA_MODEL = (process.env.OLLAMA_MODEL || 'llama3.2:3b').trim();

function resolveAIConfig() {
  if (AI_PROVIDER_ENV === 'ollama') {
    return {
      provider: 'ollama',
      model: OLLAMA_MODEL,
      configured: Boolean(OLLAMA_URL),
    };
  }
  if (AI_PROVIDER_ENV === 'groq' || AI_PROVIDER_ENV === 'openai' || AI_API_KEY) {
    return {
      provider: 'groq',
      model: AI_MODEL_ENV || 'llama-3.1-8b-instant',
      configured: Boolean(AI_API_KEY),
    };
  }
  if (!IS_PROD && OLLAMA_URL) {
    return {
      provider: 'ollama',
      model: OLLAMA_MODEL,
      configured: true,
    };
  }
  return {
    provider: 'unconfigured',
    model: AI_MODEL_ENV || 'llama-3.1-8b-instant',
    configured: false,
  };
}

const AI_CONFIG = resolveAIConfig();
const openaiClient = AI_API_KEY
  ? new OpenAI({ apiKey: AI_API_KEY, baseURL: AI_BASE_URL, timeout: 30000 })
  : null;

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(cors({ origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : true }));
app.use(express.json({ limit: '1mb' }));

// Small in-memory limiter suitable for a single-instance demo; use a shared store for multi-instance scale.
const rateStore = new Map();
app.use('/api', (req, res, next) => {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60_000;
  const limit = 40;
  let item = rateStore.get(key);
  if (!item || now - item.start > windowMs) item = { start: now, count: 0 };
  item.count++;
  rateStore.set(key, item);
  if (item.count > limit) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
  }
  next();
});
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateStore) {
    if (now - v.start > 120000) rateStore.delete(k);
  }
}, 60000).unref();

function str(v, max = 4000) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function category(aqi) {
  if (aqi == null) return 'Unavailable';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

function advice(aqi) {
  if (aqi == null) return 'Air quality data unavailable.';
  if (aqi <= 50) return 'Air quality is generally good. Enjoy outdoor activities while monitoring conditions.';
  if (aqi <= 100) return 'Most people can continue normal activities; sensitive people should monitor symptoms.';
  if (aqi <= 150) return 'Sensitive groups should reduce prolonged outdoor exertion.';
  if (aqi <= 200) return 'Reduce outdoor exertion; consider a well-fitting respirator when exposure is unavoidable.';
  if (aqi <= 300) return 'Reduce outdoor exposure and avoid strenuous outdoor activity.';
  return 'Avoid outdoor exposure as much as possible and follow local health advisories.';
}

async function fetchJSON(url, timeout = 12000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeout);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

async function geocode(location) {
  const d = await fetchJSON(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=5&language=en&format=json`
  );
  if (!d.results?.length) return null;
  const target = location.split(',')[0].trim().toLowerCase();
  return d.results.find((x) => x.name?.toLowerCase() === target) || d.results[0];
}

async function waqiFeed(feed) {
  if (!WAQI_TOKEN) return null;
  try {
    const d = await fetchJSON(
      `https://api.waqi.info/feed/${feed}/?token=${encodeURIComponent(WAQI_TOKEN)}`,
      10000
    );
    if (d.status !== 'ok' || !d.data || typeof d.data.aqi !== 'number') return null;
    const x = d.data;
    const iaqi = x.iaqi || {};
    return {
      aqi: x.aqi,
      location: x.city?.name || null,
      station: x.city?.name || null,
      pm25: iaqi.pm25?.v ?? null,
      pm10: iaqi.pm10?.v ?? null,
      ozone: iaqi.o3?.v ?? null,
      nitrogen_dioxide: iaqi.no2?.v ?? null,
      carbon_monoxide: iaqi.co?.v ?? null,
      sulphur_dioxide: iaqi.so2?.v ?? null,
      readingTime: x.time?.iso || x.time?.s || null,
      dataSource: 'WAQI',
      dataType: 'WAQI feed (station/provider data; not automatically CPCB)',
      sourceUrl: x.city?.url || 'https://aqicn.org/',
    };
  } catch (e) {
    console.warn('WAQI lookup failed:', e.message);
    return null;
  }
}

async function openMeteo(lat, lon, location) {
  const d = await fetchJSON(
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,carbon_monoxide,sulphur_dioxide&timezone=auto`
  );
  const c = d.current || {};
  const aqi = c.us_aqi ?? null;
  return {
    aqi,
    location,
    station: null,
    pm25: c.pm2_5 ?? null,
    pm10: c.pm10 ?? null,
    ozone: c.ozone ?? null,
    nitrogen_dioxide: c.nitrogen_dioxide ?? null,
    carbon_monoxide: c.carbon_monoxide ?? null,
    sulphur_dioxide: c.sulphur_dioxide ?? null,
    readingTime: c.time ?? null,
    dataSource: 'Open-Meteo',
    dataType: 'Modelled US AQI estimate (US scale)',
    sourceUrl: 'https://open-meteo.com/',
  };
}

async function lookupByCoordinates(lat, lon, label = 'Coordinates') {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error('Invalid coordinates');
  }
  let station = null;
  if (WAQI_TOKEN) station = await waqiFeed(`geo:${lat};${lon}`);
  if (station) {
    return {
      ...station,
      requestedLocation: label,
      category: category(station.aqi),
      advice: advice(station.aqi),
      fallbackReason: null,
      latitude: lat,
      longitude: lon,
    };
  }
  const model = await openMeteo(lat, lon, label);
  return {
    ...model,
    requestedLocation: label,
    category: category(model.aqi),
    advice: advice(model.aqi),
    fallbackReason: WAQI_TOKEN ? 'WAQI station/feed unavailable; modelled fallback used' : 'WAQI token not configured',
    latitude: lat,
    longitude: lon,
  };
}

async function lookupLocation(location) {
  let station = null;
  if (WAQI_TOKEN) station = await waqiFeed(encodeURIComponent(location));
  if (station) {
    return {
      ...station,
      requestedLocation: location,
      category: category(station.aqi),
      advice: advice(station.aqi),
      fallbackReason: null,
    };
  }
  const place = await geocode(location);
  if (!place) return { requestedLocation: location, error: 'Location not found.' };
  const label = [place.name, place.admin1, place.country].filter(Boolean).join(', ');
  const model = await lookupByCoordinates(place.latitude, place.longitude, label);
  return {
    ...model,
    requestedLocation: location,
    fallbackReason: WAQI_TOKEN ? 'WAQI location feed unavailable; modelled fallback used' : 'WAQI token not configured',
  };
}

async function generateWithOllama(messages, temp = 0.2) {
  if (!OLLAMA_URL) {
    const err = new Error('Ollama URL is not configured.');
    err.code = 'AI_UNCONFIGURED';
    throw err;
  }
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 120000);
  try {
    const r = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: c.signal,
      body: JSON.stringify({ model: AI_CONFIG.model, messages, stream: false, options: { temperature: temp } }),
    });
    if (!r.ok) throw new Error(`Ollama HTTP ${r.status}`);
    const d = await r.json();
    return d.message?.content || '';
  } finally {
    clearTimeout(t);
  }
}

async function generateWithOpenAICompatible(messages, temp = 0.2) {
  if (!openaiClient) {
    const err = new Error('AI API key is not configured.');
    err.code = 'AI_UNCONFIGURED';
    throw err;
  }
  const completion = await openaiClient.chat.completions.create({
    model: AI_CONFIG.model,
    messages,
    temperature: temp,
    max_tokens: 900,
  });
  return completion.choices?.[0]?.message?.content?.trim() || '';
}

async function generateAIResponse(messages, temp = 0.2) {
  if (!AI_CONFIG.configured) {
    const err = new Error('AI service is not configured on the server.');
    err.code = 'AI_UNCONFIGURED';
    throw err;
  }
  if (AI_CONFIG.provider === 'ollama') {
    return generateWithOllama(messages, temp);
  }
  return generateWithOpenAICompatible(messages, temp);
}

function cleanMessages(ms) {
  return Array.isArray(ms)
    ? ms
        .slice(-20)
        .filter((m) => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
        .map((m) => ({ role: m.role, content: str(m.content) }))
    : [];
}

const SYSTEM =
  'You are AirCare AI, an environmental-health assistant. Use only AQI values supplied in the context; never invent or alter measurements. Distinguish WAQI feed/provider data from Open-Meteo modelled US-AQI estimates. Do not claim WAQI is CPCB. Clearly mention the US scale for Open-Meteo estimates. Give practical, non-diagnostic advice. If data is absent, say so. Respond in the user\'s language.';

function healthPayload() {
  return {
    service: 'AirCare AI',
    status: 'online',
    aiProvider: AI_CONFIG.provider,
    model: AI_CONFIG.model,
    aiConfigured: AI_CONFIG.configured,
    WAQIConfigured: Boolean(WAQI_TOKEN),
    endpoints: ['/health', '/api/aqi?location=Delhi', '/api/aqi?lat=28.6&lon=77.2', '/api/chat', '/api/plan'],
  };
}

app.get('/', (req, res) => res.json(healthPayload()));
app.get('/health', (req, res) => res.json(healthPayload()));

app.get('/api/aqi', async (req, res) => {
  try {
    if (req.query.lat !== undefined && req.query.lon !== undefined) {
      const lat = Number(req.query.lat);
      const lon = Number(req.query.lon);
      return res.json(await lookupByCoordinates(lat, lon, str(req.query.label, 200) || 'Detected location'));
    }
    const location = str(req.query.location, 200);
    if (!location) return res.status(400).json({ error: 'Provide location or latitude/longitude.' });
    return res.json(await lookupLocation(location));
  } catch (e) {
    console.error('AQI endpoint:', e.message);
    res.status(502).json({
      error: 'AQI data unavailable. Please retry.',
      details: process.env.NODE_ENV === 'development' ? e.message : undefined,
    });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const messages = cleanMessages(req.body?.messages);
    if (!messages.length) return res.status(400).json({ error: 'Messages required.' });

    const context = req.body?.context || {};
    let requested = [];
    const latest = messages
      .filter((x) => x.role === 'user')
      .slice(-2)
      .map((x) => x.content)
      .join(' ');
    const matches = latest.match(/(?:in|for|about)\s+([A-Z][a-zA-Z .,-]{1,60})/g);
    if (matches) requested = matches.slice(0, 2).map((x) => x.replace(/^(?:in|for|about)\s+/i, '').trim());

    const locations = await Promise.all(
      requested.map((x) => lookupLocation(x).catch(() => ({ requestedLocation: x, error: 'Unavailable' })))
    );

    const dash = {
      location: str(context.location, 200) || 'Unknown',
      aqi: context.currentAQI ?? null,
      pm25: context.pm25 ?? null,
      status: str(context.aqiStatus, 100) || 'Unknown',
      dataSource: context.dataSource || null,
      dataType: context.dataType || null,
      readingTime: context.readingTime || null,
    };

    const contextMsg = `Dashboard context:\n${JSON.stringify(dash)}\nRequested data:\n${JSON.stringify(
      locations
    )}\nUse dashboard values only as provided; identify their source/type if known. Requested location data takes priority. Never claim a source that isn't supplied.`;

    const reply = await generateAIResponse([{ role: 'system', content: SYSTEM + '\n\n' + contextMsg }, ...messages], 0.2);
    res.json({ reply, locations });
  } catch (e) {
    console.error('Chat error:', e.message);
    const status = e.code === 'AI_UNCONFIGURED' ? 503 : 502;
    const errorMsg =
      e.code === 'AI_UNCONFIGURED'
        ? 'AI assistant is not configured on the server.'
        : 'AI assistant is temporarily unavailable. Please try again.';
    res.status(status).json({ error: errorMsg });
  }
});

app.post('/api/plan', async (req, res) => {
  try {
    const { aqi, pm25, activity, location, source, dataType } = req.body || {};
    const prompt = `Create a practical daily air-protection plan. Location: ${str(location, 200) || 'unspecified'}. AQI: ${
      aqi ?? 'Unavailable'
    }. PM2.5: ${pm25 ?? 'Unavailable'} µg/m³. Source: ${str(source, 200) || 'unknown'}. Data type: ${
      str(dataType, 200) || 'unknown'
    }. Activity preferences: ${
      str(activity, 500) || 'general'
    }. Use these exact section headings: Air Quality Overview; Outdoor Activity; Workout Advice; Personal Protection; Indoor Air Tips; Today's Action Plan. Do not invent readings. Keep advice non-diagnostic.`;

    const plan = await generateAIResponse([{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }], 0.3);
    res.json({ plan });
  } catch (e) {
    console.error('Plan error:', e.message);
    const status = e.code === 'AI_UNCONFIGURED' ? 503 : 502;
    const errorMsg =
      e.code === 'AI_UNCONFIGURED'
        ? 'AI plan service is not configured on the server.'
        : 'Unable to generate plan right now. Please try again.';
    res.status(status).json({ error: errorMsg });
  }
});

app.listen(PORT, () =>
  console.log(
    `\n🌿 AirCare AI Backend | Port ${PORT} | Provider ${AI_CONFIG.provider} | Model ${AI_CONFIG.model} | AI configured: ${AI_CONFIG.configured} | WAQI configured: ${Boolean(WAQI_TOKEN)}\n`
  )
);
