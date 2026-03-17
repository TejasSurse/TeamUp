import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  build: {
    // Code splitting: vendor chunks cached separately by browser
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['sweetalert2'],
          'vendor-http': ['axios'],
        },
      },
    },
    // Faster build reporting
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    // Target modern browsers (smaller bundle)
    target: 'es2015',
  },
})

