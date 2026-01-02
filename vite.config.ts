import path from 'path';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['@supabase/supabase-js'],
  },
  build: {
    // Optimizaciones de bundle
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'query-vendor': ['@tanstack/react-query'],
          'chart-vendor': ['recharts'],
          'map-vendor': ['leaflet', 'react-leaflet'],
          'export-vendor': ['jspdf', 'jspdf-autotable', 'xlsx', 'file-saver'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
    // Aumentar límite de advertencia de chunk size
    chunkSizeWarningLimit: 600,
    // Minificación
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Eliminar console.log en producción
        drop_debugger: true,
      },
    },
    // Source maps solo en desarrollo
    sourcemap: false,
  },
  // Optimizaciones de desarrollo
  server: {
    port: 5173,
    strictPort: false,
    hmr: {
      overlay: true,
    },
  },
  // Pre-bundling de dependencias
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'date-fns',
      'lucide-react',
      '@supabase/supabase-js',
    ],
    esbuildOptions: {
      // Necesario para que Supabase funcione correctamente
      target: 'esnext',
    },
  },
});