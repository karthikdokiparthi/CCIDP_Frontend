import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  loadEnv(mode, moduleDir, '');
  return {
    plugins: [react()],
    server: {
      host: true,
      allowedHosts: true,
      port: 5173,
      strictPort: true,
    },
    preview: {
      host: true,
      allowedHosts: true,
      port: 5173,
    },
  };
});
