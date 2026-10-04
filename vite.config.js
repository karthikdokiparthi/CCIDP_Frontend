import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

function apiProxy() {
  return {
    target: 'http://localhost:8080',
    changeOrigin: true,
    configure(proxy) {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.removeHeader('origin');
      });
    },
  };
}

function normalizePrefix(value) {
  const trimmed = String(value || '').trim().replace(/\/$/, '');
  if (!trimmed || /^https?:\/\//i.test(trimmed)) {
    return '';
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, moduleDir, '');
  const contextPath = normalizePrefix(env.CCIDP_CONTEXT_PATH || env.VITE_API_BASE_URL);
  const prefix = (requestPath) => (contextPath ? `${contextPath}${requestPath}` : requestPath);

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 5173,
      proxy: {
        '/ccidp': apiProxy(),
        '/api': { ...apiProxy(), rewrite: prefix },
        '/actuator': { ...apiProxy(), rewrite: prefix },
        '/.well-known': { ...apiProxy(), rewrite: prefix },
      },
    },
    preview: {
      host: '127.0.0.1',
      port: 5173,
    },
  };
});
