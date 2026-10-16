/** Dev-only same-machine proxy example. Copy the server.proxy entry into Vite config.
 * Start Phase 5 workflow in ACTIVE state for the /webhook URL below.
 * Never use this as a production API security layer.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/municipal-ticket': {
        target: 'http://127.0.0.1:5678',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/municipal-ticket$/, '/webhook/municipal-ticket-phase5'),
      },
    },
  },
});
