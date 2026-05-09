# AGENTS.md

## Developer Commands

```bash
npm run dev      # Start dev server (HMR)
npm run build   # Production build (dist/)
npm run lint    # ESLint (flat config)
npm run preview # Preview production build
```

**Verify before committing:** Run `npm run lint` - no typecheck script exists.

## Architecture

- **Entry:** `src/main.jsx` → `App.jsx` → `AppRoutes.jsx`
- **Roles:** STUDENT, PROGRAM_HEAD, PROGRAM_CURRICULUM_COMMITTEE, PROJECT_DIRECTOR, EXAMINER, SUPERADMIN
- **Auth:** JWT stored in localStorage, Bearer token attached via axios interceptor (`src/api/axios.js`)
- **Public routes:** `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password` (no token required)

## API Configuration

- **Desarrollo local:** `VITE_API_URL=http://localhost:8080` (`.env.local`)
- **Producción:** `https://api.modalidad.grado.fac-ingenieria-usco.com` (`.env.production`)
- Override vía variable `VITE_API_URL`
- Cypress tests run against producción: `https://modalidad.grado.fac-ingenieria-usco.com`

## Key Patterns

- Layouts in `src/layouts/` match role names (e.g., `StudentLayout.jsx` for students)
- Services in `src/services/` map to roles (e.g., `studentService.js`, `adminService.js`)
- Protected routes enforce roles via `ProtectedRoute.jsx`

## Testing

- E2E: Cypress in `cypress/` → `npm run cypress run` or open UI
- Fixtures in `cypress/fixtures/`