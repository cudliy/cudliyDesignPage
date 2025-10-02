import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      // Proxy requests to replicate.delivery to avoid CORS issues during development
      '/api/proxy/replicate': {
        target: 'https://replicate.delivery',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy\/replicate/, ''),
        configure: (proxy: any, _options: any) => {
          // Only add logging in development mode
          if (process.env.NODE_ENV === 'development') {
            proxy.on('error', (err: any, _req: any, _res: any) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (_proxyReq: any, req: any, _res: any) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes: any, req: any, _res: any) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          }
        },
      }
    }
  }
})
