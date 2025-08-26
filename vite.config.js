import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
  host: '0.0.0.0',
  port: 3000,
  proxy: {
  
    '/auth': {
      target: 'http://192.168.1.20:9177',
      changeOrigin: true,
      secure: false,
    },

    '/userapi': {
      target: 'http://192.168.1.20:9177/api',
      changeOrigin: true,
      rewrite: path => path.replace(/^\/userapi/, ''),
      secure: false,
    },
    
    '/userinfo': {
      target: 'http://192.168.1.20:9179/api',
      changeOrigin: true,
      rewrite: path => path.replace(/^\/userinfo/, ''),
      secure: false,
    },
  },
},

});
