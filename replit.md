# KYC – Know Your Campus

A polished, production-ready campus information platform built with Expo React Native.

## Architecture

- **Frontend**: Expo Router (file-based routing), React Native, TypeScript
- **Backend**: Express.js with TypeScript (port 5000)
- **State Management**: React Context (AuthContext, PostsContext)
- **Persistence**: AsyncStorage for posts and user auth
- **AI**: OpenAI via Replit AI Integrations (gpt-5-mini) — no API key required
- **Fonts**: Poppins (Google Fonts via @expo-google-fonts/poppins)
- **Theme**: Cyan/sky-400 palette with dark navy background, glassmorphism cards

## Key Features

1. **Authentication** – College email login with role selection (Student, Admin, Department, Club, Placement Cell)
2. **Personalized Feed** – Posts filtered by department/role, category filters
3. **AI Summary** – Per-post AI summary: What / Who / Deadline via OpenAI
4. **Natural Language Search** – Ask "Any hackathons for CSE?" and get AI-matched results
5. **Admin/Publish Panel** – Role-gated post creation with category, visibility, deadline, tags
6. **Campus Calendar** – Aggregated view of all deadlines and events by month
7. **Student Dashboard** – Profile + attendance view (read-only)

## File Structure

```
app/
  _layout.tsx          # Root layout (fonts, providers)
  index.tsx            # Auth redirect
  (auth)/
    _layout.tsx
    login.tsx          # Login with role/department/year selection
  (tabs)/
    _layout.tsx        # Tabs (NativeTabs on iOS 26+, classic otherwise)
    index.tsx          # Feed
    calendar.tsx       # Campus Calendar
    search.tsx         # AI Natural Language Search
    admin.tsx          # Publish Post (role-gated)
    profile.tsx        # Profile + Attendance
  post/
    [id].tsx           # Post detail with AI summary

components/
  PostCard.tsx         # Animated post card component

context/
  AuthContext.tsx      # User auth (AsyncStorage backed)
  PostsContext.tsx     # Posts CRUD (AsyncStorage backed + seed data)

server/
  routes.ts            # /api/ai/summary and /api/ai/search endpoints

constants/
  colors.ts            # COLORS, CATEGORY_COLORS, CATEGORY_LABELS
```

## User Roles

- **Student**: Read-only access, personalized by department/year
- **Admin**: Full post creation/deletion
- **Department**: Create department-specific content
- **Club**: Create club activity/recruitment posts
- **Placement Cell**: Create internship/drive posts

## AI Endpoints

- `POST /api/ai/summary` – Summarizes a notice into What/Who/Deadline
- `POST /api/ai/search` – Returns IDs of posts matching a natural language query
