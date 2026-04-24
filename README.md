# 🤝 Sahyog Connect

A full-stack social platform connecting NGOs, volunteers, and donors — built for real-world impact.

🌐 **Live App:** https://sahyog-connect.navenavelim.workers.dev/ 

---

## 📌 About the Project

Sahyog Connect is an NGO collaboration platform that enables volunteers, donors, and organizations to connect, coordinate, and contribute to social causes. It features a social feed, task management, activity tracking, and real-time notifications — all in one place.

---

## ✨ Features

- 🔐 **Authentication** — Secure login and registration
- 📰 **Social Feed** — Post updates, share activities, interact with the community
- ✅ **Task Management** — Assign and track volunteer tasks
- 📊 **Dashboard** — Overview of activities and contributions
- 📍 **Activity Tracker** — Track volunteer hours and participation
- 🔔 **Notifications** — Real-time alerts and updates
- 👤 **User Profiles** — Verified badges, profile management
- 🖼️ **Image Uploads** — Share photos from events and drives
- 🌙 **Dark/Light Theme** — Toggle between themes
- 📱 **Mobile-First Design** — Responsive bottom navigation for mobile

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| [TanStack Start](https://tanstack.com/start) | Full-stack React framework with SSR |
| [React](https://react.dev/) | UI library |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Vite](https://vitejs.dev/) | Build tool |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [Lucide React](https://lucide.dev/) | Icon library |

### Backend & Database
| Technology | Purpose |
|---|---|
| [Supabase](https://supabase.com/) | Database, Auth, Storage, Realtime |
| [Cloudflare Workers](https://workers.cloudflare.com/) | Serverless edge runtime |
| [Cloudflare Pages](https://pages.cloudflare.com/) | Frontend hosting |
| [Wrangler](https://developers.cloudflare.com/workers/wrangler/) | Cloudflare CLI & deployment |

### Tooling
| Technology | Purpose |
|---|---|
| [ESLint](https://eslint.org/) | Code linting |
| [Prettier](https://prettier.io/) | Code formatting |
| [Bun](https://bun.sh/) | JavaScript runtime & package manager |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or bun
- Supabase account
- Cloudflare account

### Installation

```bash
# Clone the repository
git clone https://github.com/navenavelimargam/sahyog-connect.git
cd sahyog-connect

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your Supabase and Cloudflare credentials in .env
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

```bash
npm run dev
```

### Build & Deploy

```bash
# Build the project
npm run build

# Deploy to Cloudflare
npx wrangler deploy --config dist/server/wrangler.json
```

---

## 📁 Project Structure

```
sahyog-connect/
├── src/
│   ├── components/     # Reusable UI components
│   ├── routes/         # TanStack Router pages
│   └── lib/            # Utilities and helpers
├── supabase/           # Supabase config and migrations
├── public/             # Static assets
├── vite.config.ts      # Vite configuration
├── wrangler.jsonc      # Cloudflare Workers config
└── package.json
```

---

## 🌐 Deployment

This project is deployed on **Cloudflare Workers** using the edge runtime.

- **Production:** https://tanstack-start-app.navenavelim.workers.dev/
- **Platform:** Cloudflare Workers + Pages
- **CI/CD:** Auto-deploy on push to `main` branch

---
