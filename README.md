🌿 AirCare AI — Know the air. Protect your health.
AirCare AI is an AI-powered air quality companion designed to help people understand pollution levels and take practical steps to protect their health.
Live Demo
https://air-care-ai-ruddy.vercel.app/
Repository
https://github.com/mohdowais8/AirCare-AI
Features
- AQI and PM2.5 dashboard
- AI air quality assistant for pollution, masks, indoor air, and health-protection questions
- Daily Health Plan
- City search
- Indoor Air Toolkit
- Eco Impact guidance
- Data-source transparency, including distinction between modeled estimates and sensor feeds where applicable
Technology Stack
- Frontend: React, Vite
- Backend: Node.js, Express
- AI: Groq API (OpenAI-compatible API)
- Air quality data: Open-Meteo; optional WAQI integration
- Deployment: Vercel (frontend), Render (backend)
Local Development
Backend
1. Open a terminal in the backend directory.
2. Install dependencies:npm install
3. Configure environment variables in backend/.env (see backend/.env.example).
4. Start the server:npm start
Frontend
1. In the project root, install dependencies:npm install
2. Set VITE_API_URL as appropriate in your environment (see .env.example).
3. Start the development server:npm run dev
Mission
Make air quality information easier to understand and help people make smarter everyday decisions for healthier living.
AirCare AI — Know the air. Protect your health.
