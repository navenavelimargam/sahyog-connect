# 🤝 Sahyog Connect

A full-stack social platform connecting NGOs, volunteers, and donors — built for real-world impact, with AI-powered triage, multilingual support, and live geospatial coordination.

🌐 **Live App:** https://sahyog-connect.navenavelim.workers.dev/

---

## 📌 About the Project

Sahyog Connect is an NGO collaboration platform that enables citizens, volunteers, donors, and organizations to connect, coordinate, and contribute to social causes. It features AI-assisted help request triage, a live volunteer-matching dashboard, a community feed, multilingual UI, and real-time updates — all in one place.

---

## ✨ Features

- 🔐 **Authentication** — Secure login and registration via Supabase Auth
- 🆘 **SOS Help Requests** — Citizens submit help requests with category, description, photos, and automatic GPS location capture
- 🤖 **AI Priority Triage** — Google Gemini analyzes each request's description to classify urgency (critical / high / medium / low) with a short reasoning summary for NGO supervisors
- 🧭 **AI Volunteer Matching** — Algorithmic matching of available volunteers to requests based on skill overlap and proximity, with one-click assignment
- 🤝 **B2B Peer NGO Matching** — Gemini-powered matching for NGO-to-NGO emergency resource requests in the shortage marketplace
- 🗺️ **Live Heatmap** — Real-time Leaflet/OpenStreetMap heatmap showing help requests and volunteer locations on the NGO dashboard
- 📰 **Social Feed** — Post updates, share success stories with photos, interact with the community
- 📊 **NGO Supervisor Dashboard** — Live view of pending/active/completed requests, volunteer roster, and assignment tools, synced in real time via Supabase Realtime
- 📍 **Status Tracker** — Step-by-step tracking of request status (accepted → on the way → delivered)
- 🌐 **Multilingual UI** — Full interface translation across English, Hindi, Marathi, and Telugu, with AI-assisted dynamic translation of user-generated content
- 🔔 **Notifications** — Real-time alerts and updates via Supabase Realtime subscriptions
- 👤 **User Profiles** — Verified badges for NGOs and volunteers, profile management
- 🖼️ **Image Uploads** — Share photos as evidence with help requests and event posts
- 🌙 **Dark/Light Theme** — Toggle between themes
- 📱 **Mobile-First Design** — Responsive layout with bottom navigation for mobile, sidebar layout for desktop

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| [TanStack Start](https://tanstack.com/start) | Full-stack React framework with file-based routing |
| [TanStack Router](https://tanstack.com/router) | Type-safe routing |
| [React](https://react.dev/) | UI library |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Vite](https://vitejs.dev/) | Build tool |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [Lucide React](https://lucide.dev/) | Icon library |
| [Leaflet](https://leafletjs.com/) | Interactive maps and live heatmap rendering |
| [i18next / react-i18next](https://www.i18next.com/) | Static UI translation (English, Hindi, Marathi, Telugu) |

### AI & Intelligence

| Technology | Purpose |
|---|---|
| [Google Gemini API](https://ai.google.dev/) (gemini-2.0-flash) | Help request priority triage, peer NGO matching, and dynamic content translation |
| [OpenStreetMap Nominatim](https://nominatim.org/) | Reverse geocoding of GPS coordinates to readable addresses |

### Backend & Database

| Technology | Purpose |
|---|---|
| [Supabase](https://supabase.com/) | PostgreSQL database, Auth, Storage, and Realtime subscriptions |
| [Cloudflare Workers](https://workers.cloudflare.com/) | Serverless edge runtime for hosting |
| [Wrangler](https://developers.cloudflare.com/workers/wrangler/) | Cloudflare CLI & deployment |

### Tooling

| Technology | Purpose |
|---|---|
| [ESLint](https://eslint.org/) | Code linting |
| [Prettier](https://prettier.io/) | Code formatting |
| [npm](https://www.npmjs.com/) | Package manager |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm
- Supabase account
- Google AI Studio account (for Gemini API key)
- Cloudflare account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/navenavelimargam/sahyog-connect.git
cd sahyog-connect

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

> ⚠️ Never commit `.env` to version control — it is excluded via `.gitignore`.

### Development

```bash
npm run dev
```

App runs at `http://localhost:8080`.

### Build & Deploy

```bash
# Build the project
npm run build

# Deploy to Cloudflare
npx wrangler deploy
```

---

## 📁 Project Structure

```
sahyog-connect/
├── src/
│   ├── components/     # Reusable UI components (StatusTimeline, HelpHeatmap, etc.)
│   ├── routes/         # TanStack Router pages (help, dashboard, feed, tracker, etc.)
│   ├── lib/             # AI functions, matchmaking, translation, geolocation utilities
│   ├── i18n/            # Locale files (en, hi, mr, te) and i18next setup
│   └── integrations/    # Supabase client configuration
├── supabase/            # Supabase config and migrations
├── public/              # Static assets
├── vite.config.ts       # Vite configuration
├── wrangler.jsonc        # Cloudflare Workers config
└── package.json
```

---

## 🧠 How the AI Features Work

1. **Request submission** — A citizen selects a category, writes a short description, and the app auto-captures GPS coordinates and reverse-geocodes them to a readable address.
2. **Priority triage** — Gemini reads the category and description, classifies the request as critical/high/medium/low, and returns a short reason shown to NGO supervisors.
3. **Volunteer matching** — A scoring algorithm ranks available volunteers by skill match and distance from the incident; the top match is suggested for one-click assignment.
4. **B2B peer matching** — For NGO-to-NGO shortage requests, Gemini compares the request against peer NGO capability tags and recommends the best-fit partner organization.
5. **Live sync** — Supabase Realtime pushes new requests and status changes to the NGO dashboard instantly.
6. **Translation** — Static UI strings are translated via i18next locale files; dynamic content (post titles, descriptions) is translated on demand via Gemini and cached locally.

---

## 🌐 Deployment

This project is deployed on **Cloudflare Workers** using the edge runtime.

- **Production:** https://sahyog-connect.navenavelim.workers.dev/
- **Platform:** Cloudflare Workers (via TanStack Start's Nitro adapter)
- **CI/CD:** Manual deploy via `npx wrangler deploy`

---

## 🔮 Roadmap / Future Enhancements

- Native Android app (Kotlin + Jetpack Compose) for offline-first field volunteer telemetry
- Push notification support for instant mobile alerts
- Expanded language support beyond Hindi, Marathi, and Telugu
