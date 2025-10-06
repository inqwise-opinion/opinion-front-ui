import { defineConfig } from 'vite';
import { resolve } from 'path';

// Import build configuration
function getBuildConfigForVite() {
  const configName = process.env.BUILD_CONFIG || 'development';
  const runtimeBaseUrl = process.env.RUNTIME_BASE_URL;
  
  // Simple config mapping for Vite (without importing the full build config to avoid circular deps)
  const configs: Record<string, { baseUrl: string }> = {
    development: { baseUrl: '/' },
    production: { baseUrl: './' },
    'github-pages-pr': { baseUrl: runtimeBaseUrl || './' },
    'github-pages-main': { baseUrl: '/opinion-front-ui/' },
    test: { baseUrl: '/' }
  };
  
  return configs[configName] || configs.development;
}

export default defineConfig(({ mode }) => {
  const buildConfig = getBuildConfigForVite();
  const configName = process.env.BUILD_CONFIG || 'development';
  const runtimeBaseUrl = process.env.RUNTIME_BASE_URL;
  
  // Determine final configuration
  let finalConfig;
  if (configName === 'github-pages-pr' && runtimeBaseUrl) {
    finalConfig = {
      baseUrl: runtimeBaseUrl,
      enableSpaRouting: true,
      environment: 'production',
      enableDebugLogging: false
    };
  } else {
    const configs = {
      development: { baseUrl: '', enableSpaRouting: false, environment: 'development', enableDebugLogging: true },
      production: { baseUrl: '', enableSpaRouting: false, environment: 'production', enableDebugLogging: false },
      'github-pages-main': { baseUrl: '/opinion-front-ui', enableSpaRouting: true, environment: 'production', enableDebugLogging: false },
      test: { baseUrl: '', enableSpaRouting: false, environment: 'test', enableDebugLogging: false }
    };
    finalConfig = configs[configName] || configs.development;
  }
  
  
  return {
  base: buildConfig.baseUrl,
  define: {
    // Inject build configuration as compile-time constants
    __BUILD_CONFIG__: JSON.stringify(finalConfig)
  },
  publicDir: 'public',
  
  // Vite automatically handles import.meta.env.VITE_* variables
  // No need to manually define them
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
};
});
