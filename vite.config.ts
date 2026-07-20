import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from "vite-plugin-singlefile"
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'


/**
 * A custom Vite plugin to automatically remove version specifiers from import statements.
 * For example:
 *   import { Slot } from "@radix-ui/react-slot@1.1.2";
 * becomes:
 *   import { Slot } from "@radix-ui/react-slot";
 */

function removeVersionSpecifiers(): Plugin {
  const VERSION_PATTERN = /@\d+\.\d+\.\d+/;

  return {
    name: 'remove-version-specifiers',

    resolveId(id: string, importer) {
      if (VERSION_PATTERN.test(id)) {
        const cleanId= id.replace(VERSION_PATTERN, '');
        return this.resolve(cleanId, importer, { skipSelf: true });
      }
      return null;
    },
  }
}


/**
 * A custom Vite plugin to resolve imports with the "figma:assets/" prefix.
 */
function figmaAssetsResolver(): Plugin {
  const FIGMA_ASSETS_PREFIX = 'figma:asset/';

  return {
    name: 'figma-assets-resolver',

    resolveId(id: string) {
      if (id.startsWith(FIGMA_ASSETS_PREFIX)) {
        const assetPath = id.substring(FIGMA_ASSETS_PREFIX.length);
        return path.resolve(__dirname, './src/assets', assetPath);
      }
      return null;
    },
  };
}


const produceSingleFile = process.env.SINGLE_FILE === 'true'

function manualChunks(id: string) {
  // Vite의 동적 import helper가 거대한 3D vendor 청크에 흡수되는 것을 막는다.
  if (id.includes('vite/preload-helper')) {
    return 'vite-preload-helper';
  }
  if (!id.includes('node_modules')) return;
  if (id.includes('/three/') || id.includes('/three-stdlib/') || id.includes('/@react-three/')) {
    return 'campus-3d-vendor';
  }
  if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router') || id.includes('/scheduler/')) {
    return 'react-vendor';
  }
  if (id.includes('/framer-motion/')) {
    return 'motion-vendor';
  }
  if (id.includes('/@supabase/')) {
    return 'supabase';
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    figmaAssetsResolver(),
    removeVersionSpecifiers(),
    ...(produceSingleFile ? [] : [VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'push-handler.js'],
      manifest: {
        name: 'UNIBUS - 순천향대 버스',
        short_name: 'UNIBUS',
        description: '순천향대학교 통학버스 실시간 정보 앱',
        theme_color: '#1e3a8a',
        background_color: '#1e3a8a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'ko',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        importScripts: ['push-handler.js'],
        // 첫 설치에서는 앱 셸만 저장한다. 화면별 해시 청크는 실제 방문 시 런타임 캐시에 들어간다.
        globPatterns: [
          'index.html',
          'registerSW.js',
          'assets/index-*.{js,css}',
          'assets/react-vendor-*.js',
          'assets/vite-preload-helper-*.js',
        ],
        navigateFallbackDenylist: [/^\/api(?:\/|$)/, /^\/assets(?:\/|$)/, /\.[^/]+$/],
        // 인증/실시간 API 응답은 사용자별 헤더를 캐시 키로 구분하지 못하므로 저장하지 않는다.
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) =>
              url.origin === self.location.origin &&
              url.pathname.startsWith('/assets/') &&
              ['script', 'style', 'worker'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'hashed-static-assets',
              cacheableResponse: {
                statuses: [200],
              },
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ url, request }) =>
              url.origin === self.location.origin && request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30일
              },
            },
          },
        ],
      },
    })]),
    ...(produceSingleFile ? [viteSingleFile()] : []),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['framer-motion'],
  },
  build: {
    rollupOptions: {
      output: produceSingleFile ? {} : { manualChunks },
    },
  },
})
