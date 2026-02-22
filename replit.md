# Avatar Auto Responder

## Overview
AI-powered social media automation platform that monitors Instagram, Facebook, YouTube, and Threads for keyword triggers and automatically sends DMs and comment replies. Built with an Apple-inspired modern UI with glassmorphism effects.

## Architecture
- **Stack**: Express + Vite + React + TypeScript + PostgreSQL (Drizzle ORM)
- **Auth**: Dual auth - Email/password (bcrypt) + Google OAuth (Replit OIDC). Admin: admin@avatar.app / admin123
- **AI**: OpenAI via Replit AI Integrations for generating reply variations
- **YouTube**: YouTube Data API v3 with OAuth 2.0 for channel authorization, HMAC-signed state for CSRF protection
- **Frontend**: React with Tailwind CSS, shadcn/ui, wouter routing, TanStack Query
- **Backend**: Express REST API with Drizzle ORM

## Project Structure
```
shared/schema.ts          - Database schema (8 tables) and types
server/routes.ts          - All API endpoints (platforms, keywords, comments, DMs, activity, webhooks)
server/storage.ts         - Storage interface and database implementation
server/services/          - Platform API service classes
  instagram.ts            - Instagram Graph API (Meta v22.0)
  facebook.ts             - Facebook Graph API (Meta v22.0)
  youtube.ts              - YouTube Data API v3 (quota-aware)
  threads.ts              - Threads API (Meta v22.0)
client/src/
  App.tsx                 - Main layout with nav bar and routing
  pages/Dashboard.tsx     - Stats overview and quick actions
  pages/Platforms.tsx     - Connect/manage social accounts
  pages/Keywords.tsx      - Create keyword triggers with DM/reply config
  pages/CommentHub.tsx    - Unified inbox with platform/status filters
  pages/Activity.tsx      - Activity log timeline with filters
  index.css               - Theme colors and glassmorphism styles
```

## Database Tables
- `platform_connections` - Connected social media accounts
- `keyword_triggers` - Keywords that trigger auto-responses
- `comments` - Incoming comments from all platforms
- `direct_messages` - Outgoing DMs
- `activity_log` - System activity timeline
- `engagement_metrics` - CTR, open rates, response rates
- `api_quotas` - API usage tracking per platform
- `background_jobs` - Async job queue for webhooks/polling

## Key Design Decisions
- Single admin user initially, designed for future multi-tenancy (userId on all tables)
- Monitors ALL content types: Reels, videos, photos, stories, shorts
- Comment replies support 3-5 random variations or AI-generated responses
- YouTube polling is quota-aware (10,000 units/day limit)
- Meta webhook endpoint at `/api/webhooks/meta`

## User Preferences
- Apple-inspired UI with glassmorphism effects and gradient text
- Clean typography with Inter font
- Smooth staggered animations on page load
