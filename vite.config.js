// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Vite configuration for EduScope Terminal
 *
 * Key settings:
 * - React plugin: enables JSX transform + Fast Refresh (hot reload)
 * - server.proxy: forwards /api/* requests to Flask on port 5001
 *   This avoids CORS issues during development — the browser only
 *   talks to Vite (port 5173), which proxies to Flask internally.
 *   In production, configure nginx or your host to do the same proxy.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // All /api/* requests go to Flask
      "/api": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
        // No rewrite needed — Flask routes are already /api/colleges
      },
    },
  },
});
