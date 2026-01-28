# 📌 Pinterest Clone (APW)

A Pinterest-like web application for discovering, saving, and sharing visual content. Built with React 19, TypeScript, and Supabase.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss)

## ✨ Features

- 🔐 **Authentication** - Email/password login & signup with Supabase Auth
- 🏠 **Home Feed** - Pinterest-style masonry grid layout
- 📌 **Pin Management** - Create, view, and save pins
- 👤 **User Profiles** - Customizable avatars and profile settings
- 📁 **Photo Albums** - Organize saved pins into collections
- 💬 **Comments** - Comment on pins
- 🔄 **Image Sync** - Consistent image display across navigation
- 📱 **Responsive** - Mobile-first design

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite |
| Styling | TailwindCSS |
| State | React Context, TanStack Query |
| Routing | React Router 7 |
| Backend | Supabase (Auth, Database, Storage) |
| Icons | Lucide React |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd apw

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Environment Variables

Create `.env.local` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Development

```bash
npm run dev
```

Open http://localhost:5173

### Build

```bash
npm run build
npm run preview  # Test production build
```

## 📁 Project Structure

```
src/
├── api/          # External API clients (Unsplash)
├── components/   # Reusable UI components
├── contexts/     # React Context providers
├── hooks/        # Custom React hooks
├── pages/        # Route page components
├── services/     # Backend service layer
├── types/        # TypeScript definitions
└── App.tsx       # Main app component
```

## 📖 Documentation

Detailed documentation available in [`docs/`](./docs/):

- [Project Overview](./docs/project-overview-pdr.md)
- [System Architecture](./docs/system-architecture.md)
- [Codebase Summary](./docs/codebase-summary.md)
- [Deployment Guide](./docs/deployment-guide.md)
- [Database Schema](./docs/database/schema.md)

### Feature Documentation
- [Authentication](./docs/features/authentication.md)
- [Avatar System](./docs/features/avatar-system.md)
- [Image Sync](./docs/features/image-sync.md)

## 🧪 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |

## 📝 License

MIT License - feel free to use for learning and portfolio purposes.

---

Built with ❤️ as a learning project
