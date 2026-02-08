import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify' // Stelle sicher, dass vite-plugin-vuetify installiert ist
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true, // Ermöglicht das automatische Importieren von Vuetify-Komponenten
      // styles: { configFile: 'src/styles/settings.scss' } // Optional: Falls du Vuetify-spezifische SCSS-Einstellungen hast
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // additionalData: `@import "@/styles/variables.scss";` // Importiere die globalen Variablen (auskommentiert, falls die Datei nicht existiert)
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
    fs: {
      allow: [
        __dirname,
      ],
    },
  },
}) 