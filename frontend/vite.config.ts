import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * En desarrollo, `/api` se reenvía al backend Express en el puerto 3000 para
 * que el widget funcione sin configuración adicional. En producción, Vercel
 * sirve el frontend estático y la API bajo el mismo origen.
 */
export default defineConfig({
  plugins: [react()],
  // Un solo archivo de configuracion para todo el proyecto: las variables
  // `VITE_*` se leen del `.env` de la raiz del repo (igual que el backend).
  envDir: '..',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY ?? 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // `widget.js` vive en `public/` y se copia tal cual a la raíz del deploy.
    assetsDir: 'assets',
  },
});
