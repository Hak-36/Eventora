\# Eventora



Event management with an AI assistant. Hosts create events and send

announcements, participants register and get a ticket code, and an

AI agent answers questions and polishes announcements.



\## Features

\- Create and browse events with capacity limits and registration deadlines

\- Registration with unique ticket codes, duplicate and sold-out checks

\- Host approval, rejection and check-in

\- Announcements with audience targeting, pinning and scheduling

\- AI assistant powered by an Agent37 instance:

&#x20; - `POST /api/ai/ask` answers questions about an event using its live data

&#x20; - `POST /api/ai/polish-announcement` rewrites a host's draft in a chosen tone



\## Tech stack

React + Vite frontend, Express + TypeScript backend, JSON file storage,

Agent37 (hosted Hermes agent) for AI.



\## Run locally

1\. `npm install --legacy-peer-deps`

2\. Copy `.env.example` to `.env` and fill in your Agent37 instance ID and API key

3\. `npm run dev`, then open http://localhost:3000



\## Agent37 integration

The backend calls the agent's `/v1/responses` endpoint (see `agent37.ts`).

Attendee personal data is never sent to the agent, only event details and

registration counts. API keys live in `.env`, which is git-ignored.

