# AirCare AI 🌿

AirCare AI is a React/Vite environmental-health dashboard with an Express API and a local Ollama-powered assistant. It provides AQI context, pollutant information, daily guidance, indoor-air tips and a lightweight sustainable-habits tracker.

## AQI data transparency
- When configured, backend attempts WAQI feed data.
- If the feed is unavailable, the app falls back to Open-Meteo modelled data.
- Open-Meteo's `us_aqi` is a **US AQI estimate**, not India's CPCB AQI.
- WAQI feed data is not automatically a CPCB official reading.
- The dashboard displays source/type and timestamp when supplied.
- Indoor Air guidance is not indoor sensor monitoring; Eco Impact checklist points are not measured emissions estimates.

## Requirements
- Node.js 18+ (tested target: Node 22)
- Ollama installed and running
- Ollama model `llama3.2:3b` pulled locally

## Start

### Frontend (project root)
```bash
npm install
npm run dev
```

### Backend (second terminal)
```bash
cd backend
npm install
```
Copy `backend/.env.example` to `backend/.env` and fill in a **newly generated** WAQI token if you have one. Do not commit `.env` files. `dotenv` loads backend environment configuration.

```bash
node server.js
```

The backend runs on `http://localhost:5000`. The Vite frontend runs on `http://localhost:5173`.

If deployed, set `VITE_API_URL` in a root `.env` file to the backend URL, and set `FRONTEND_ORIGIN` in backend environment variables to the frontend origin (comma-separated origins are supported). Ensure Ollama is reachable from the backend deployment environment; a local Ollama server is not automatically available on cloud hosts.

## API
- `GET /` health information
- `GET /api/aqi?location=Delhi`
- `GET /api/aqi?lat=28.6&lon=77.2&label=Delhi`
- `POST /api/chat` with `{messages, context}`
- `POST /api/plan` with `{aqi, pm25, activity, location, source, dataType}`

## Limitations
- In-memory rate limiting is intended for a demo, not multi-instance production deployment.
- WAQI feed coverage, availability and token access may vary by location.
- Health content is informational, not medical diagnosis or treatment.
- The app does not currently include physical indoor air sensors, validated exposure models, or measured emissions accounting.

## Demo flow
1. Open the dashboard and check source and timestamp.
2. Use location detection or change coordinates via location permission.
3. Ask the assistant about the current conditions.
4. Generate a daily plan.
5. Review indoor air tips and mark sustainable habits.

## Build
```bash
npm run build
```
