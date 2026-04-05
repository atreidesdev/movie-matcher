import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { mockStreamPlugin } from './vite-plugin-mock-stream'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Режим pages — статический деплой на GitHub Pages без бэкенда, всегда с моками API
  const useMock = env.VITE_USE_MOCK === 'true' || mode === 'mock' || mode === 'pages'

  // Чтобы клиентский бандл точно получил флаг моков (Vite подставляет import.meta.env из process.env)
  if (useMock) {
    process.env.VITE_USE_MOCK = 'true'
    process.env.MODE = mode
  }

  const isPages = mode === 'pages'   // или mode === 'gh-pages'
  const base = isPages ? '/movie-matcher/' : '/'

  return {
  base,
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('/react/') || id.includes('react-dom') || id.includes('scheduler')) return 'react'
            if (id.includes('react-router')) return 'router'
            if (id.includes('framer-motion') || id.includes('@react-spring')) return 'motion'
            if (id.includes('@tiptap/')) return 'tiptap'
            if (id.includes('react-force-graph') || id.includes('d3-force')) return 'graph'
            if (id.includes('lucide-react')) return 'icons'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  define: {
    // Гарантированная подстановка в клиент при --mode mock (на случай если process.env не успел подхватиться)
    'import.meta.env.VITE_USE_MOCK': JSON.stringify(useMock ? 'true' : ''),
    'import.meta.env.MODE': JSON.stringify(mode),
  },
  plugins: [
    react(),
    ...(useMock ? [mockStreamPlugin()] : []),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Movie Matcher',
        short_name: 'Movie Matcher',
        description: 'Отслеживание фильмов, аниме, игр и персонализированные рекомендации',
        theme_color: '#53425f',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/vite.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any' },
          { src: '/vite.svg', type: 'image/svg+xml', sizes: '192x192', purpose: 'maskable' },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MiB (chunk ~2.37 MB)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', networkTimeoutSeconds: 10, expiration: { maxEntries: 100, maxAgeSeconds: 300 } },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    host: true, // 0.0.0.0 — доступ с телефона по http://<IP-ПК>:5173 в той же Wi‑Fi сети
    // В режиме mock (npm run dev:mock или --mode mock) прокси отключаем — запросы перехватывает axios mock adapter
    proxy: useMock
      ? {}
      : {
          '/api': {
            target: 'http://localhost:8080',
            changeOrigin: true,
          },
        },
  },
  }
})
