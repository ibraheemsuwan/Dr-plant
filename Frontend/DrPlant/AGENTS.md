# DrPlant frontend

React 19 + Vite + TypeScript + Tailwind 4.

## Layout

```
src/app/
  api/              HTTP client, mappers, token storage, domain services
  components/       Shared UI (pages import from here)
  contexts/         Auth, language, theme
  data/             Static seed data (e.g. seasonal crops)
  lib/              Pure helpers (dates, alerts, blog types)
  pages/            Route-level screens (BlogPage, AdminDashboard/*)
  routes.tsx        React Router config
src/config/         Third-party keys (EmailJS)
```

## Conventions

- API calls only through `src/app/api/services/*` and `http.ts`.
- Map backend JSON in `mappers.ts`; keep UI types in `lib/blogTypes.ts` or `api/types.ts`.
- Cross-page refresh signals live in `api/events.ts`.
- Admin UI: `pages/AdminDashboard/` — `useAdminDashboard.ts` for logic, `Admin*Tab.tsx` per section.
- Do not add unused localStorage layers; categories and posts come from the API.
- Palestine timezone: use `lib/dateTime.ts` for display.
