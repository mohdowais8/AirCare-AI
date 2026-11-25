# AirCare AI 🌿

AirCare AI is a React/Vite environmental-health dashboard with an Express API. It provides AQI context, pollutant information, daily guidance, indoor-air tips, a lightweight sustainable-habits tracker, and an AI assistant powered by Groq (cloud) or Ollama (local development).

## AQI data transparency
- When configured, the backend attempts WAQI feed data.
- If the feed is unavailable or `WAQI_TOKEN` is omitted, the app falls back to Open-Meteo modelled data.
- Open-Meteo's `us_aqi` is a **US AQI estimate**, not India's CPCB AQI.
- WAQI feed data is not automatically a CPCB official reading.
- The dashboard displays source/type and timestamp when supplied.
- Indoor Air guidance is not indoor sensor monitoring; Eco Impact checklist points are not measured emissions estimates.

## Local Development

### Requirements
- Node.js 22+ (matches `openai` SDK requirement)
- Either:
  - **Local AI**: Ollama installed and running with `llama3.2:3b` (`ollama pull llama3.2:3b`), or
  - **Cloud AI**: A free Groq API key from https://console.groq.com/

### 1. Backend
```bash
cd backend
npm install
```
Copy `backend/.env.example` to `backend/.env` and configure either `AI_PROVIDER=ollama` (for local Ollama) or `AI_PROVIDER=groq` + `AI_API_KEY=...` (for Groq). Optionally set `WAQI_TOKEN`. Never commit `.env` files.

```bash
npm start
```
The backend runs on `http://localhost:5000`.

### 2. Frontend (from `AirCare_AI` root)
```bash
npm install
npm run dev
```
The Vite frontend runs on `http://localhost:5173`. Copy `.env.example` to `.env` if you want to customize `VITE_API_URL`.

## Free Cloud Deployment (Vercel + Render + Groq)

1. **Get a free Groq API key** (no credit card required) at https://console.groq.com/.
2. **Deploy Backend on Render** (free Web Service, no credit card required):
   - Connect your GitHub repo (`AirCare_AI` root).
   - Set **Root Directory** to `backend`, **Build Command** to `npm install`, **Start Command** to `npm start`, and **Health Check Path** to `/health` (or deploy via `render.yaml`).
   - Add environment variables in Render (`NODE_ENV=production`, `AI_PROVIDER=groq`, `AI_BASE_URL=https://api.groq.com/openai/v1`, `AI_MODEL=llama-3.1-8b-instant`, `AI_API_KEY`, optional `WAQI_TOKEN`, and `FRONTEND_ORIGIN` once Vercel is deployed).
3. **Deploy Frontend on Vercel** (free Hobby tier):
   - Import the GitHub repo in Vercel (framework: Vite, build: `npm run build`, output: `dist`).
   - Set `VITE_API_URL` in Vercel Environment Variables to your Render backend URL (e.g. `https://your-backend.onrender.com`, no trailing slash).
   - Redeploy Vercel after setting `VITE_API_URL`, then update `FRONTEND_ORIGIN` in Render to your Vercel URL.

## API
- `GET /` and `GET /health` service status & non-secret configuration state
- `GET /api/aqi?location=Delhi`
- `GET /api/aqi?lat=28.6&lon=77.2&label=Delhi`
- `POST /api/chat` with `{messages, context}`
- `POST /api/plan` with `{aqi, pm25, activity, location, source, dataType}`

## Limitations
- Render's free web service spins down after 15 minutes of inactivity (~30–60s cold start on the first request).
- In-memory rate limiting is intended for a single-instance demo, not multi-instance production deployment.
- WAQI feed coverage, availability, and token access may vary by location.
- Health content is informational, not medical diagnosis or treatment.
- The app does not currently include physical indoor air sensors, validated exposure models, or measured emissions accounting.

## Build
```bash
npm run build
```
