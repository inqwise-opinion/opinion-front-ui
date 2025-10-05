import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  // Use relative paths only for production GitHub Pages deployment  
  // For development, always use root '/' and let our app handle base paths
  base: mode === 'production' ? './' : '/',
  publicDir: 'public',
  
  // Define environment variables for browser access
  define: {
    // Make process.env available in browser with Vite environment variables
    'process.env': JSON.stringify({
      VITE_BASE_URL: process.env.VITE_BASE_URL || '',
      NODE_ENV: process.env.NODE_ENV || mode || 'development',
      MODE: mode || 'development'
    })
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2020',
    rollupOptions: {
      output: {
        // Prevent inlining of assets - always generate separate files
        inlineDynamicImports: false,
        manualChunks: undefined,
        // Ensure proper file extensions for web serving
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Ensure JS files are never inlined as data URLs
    assetsInlineLimit: 0
  },
  server: {
    port: 3000,
    open: true,
    host: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/api': resolve(__dirname, 'src/api'),
      '@/assets': resolve(__dirname, 'src/assets')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Silence the legacy JS API deprecation warning
        silenceDeprecations: ['legacy-js-api']
      }
    },
    // Additional config to handle Sass warnings
    devSourcemap: true
  },
  esbuild: {
    target: 'es2020'
  }
}));
