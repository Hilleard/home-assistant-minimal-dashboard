import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Deployed into HA's /config/www/minimal-dashboard/, served at
// /local/minimal-dashboard/ — the base path below must match wherever you
// actually copy the built `dist` folder. Only applied for `vite build`, so
// `npm run dev` still serves from `/`.
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: command === 'build' ? '/local/minimal-dashboard/' : '/',
    plugins: [react()],
    server: {
      // The app always fetches calendar data from a relative `/api/...`
      // path (see useCalendarEvents.ts) so it's same-origin in production
      // (served by HA itself). In dev, this proxies those requests to the
      // real HA instance server-side, avoiding a CORS round trip through
      // the browser entirely — no HA-side CORS config needed.
      proxy: env.VITE_HA_URL
        ? {
            '/api': {
              target: env.VITE_HA_URL,
              changeOrigin: true,
            },
          }
        : undefined,
    },
  };
})
