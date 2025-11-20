import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  
  return {
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    base: '/dtj/service/',
    server: {
      host: process.env.VITE_DEV_SERVER_HOST || '0.0.0.0',
      port: parseInt(process.env.VITE_DEV_SERVER_PORT) || 3000,
      proxy: {
        '/auth': {
          target: `http://${process.env.VITE_DEV_SERVER_HOST}:${process.env.VITE_DEV_PERSONAL_PORT}`,
          changeOrigin: true,
          secure: false,
        },
        '/userapi': {
          target: `http://${process.env.VITE_DEV_SERVER_HOST}:${process.env.VITE_DEV_PERSONAL_PORT}/api`,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/userapi/, ''),
          secure: false,
        },
        '/userinfo': {
          target: `http://${process.env.VITE_DEV_SERVER_HOST}:${process.env.VITE_DEV_PLAN_PORT}/api`,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/userinfo/, ''),
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
  };
});
