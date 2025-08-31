import { defineConfig } from 'vite'
import postcss from './postcss.config.js'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';
  
  return {
    server: {
      port: 5174,
      strictPort: true,
      host: true
    },
    define: {
      'process.env': process.env,
      // Ensure environment variables are available
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.REACT_APP_ENVIRONMENT': JSON.stringify(process.env.REACT_APP_ENVIRONMENT || 'dev'),
      'process.env.REACT_APP_API_BASE_URL': JSON.stringify(process.env.REACT_APP_API_BASE_URL || ''),
      'process.env.REACT_APP_BACKEND_URL': JSON.stringify(process.env.REACT_APP_BACKEND_URL || '')
    },
    css: {
      postcss,
    },
    plugins: [react()],
    resolve: {
      alias: [
        {
          find: /^~.+/,
          replacement: (val) => {
            return val.replace(/^~/, "");
          },
        },
      ],
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      // Production build optimizations
      minify: isProduction ? 'terser' : false,
      sourcemap: !isProduction,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            aws: ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb'],
            ui: ['@tailwindcss/forms', 'react-router-dom']
          }
        }
      }
    },
    // Environment-specific configuration
    ...(isProduction && {
      base: './',
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true
      }
    })
  }
})
