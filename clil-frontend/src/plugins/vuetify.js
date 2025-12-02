import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

// CLIL-KI Tool angepasstes Farbschema
const clilTheme = {
  dark: false,
  colors: {
    primary: '#3f51b5',    // Indigo
    secondary: '#5c6bc0',  // Helleres Indigo
    accent: '#ff4081',     // Rosa Akzent
    error: '#f44336',      // Rot
    info: '#2196F3',       // Blau
    success: '#4caf50',    // Grün
    warning: '#ff9800',    // Orange
    surface: '#ffffff',    // Weiß für Karten und Oberflächen
    background: '#f8f9fd'  // Heller Hintergrund
  }
}

export default createVuetify({
  components: {
    ...components,
  },
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    }
  },
  theme: {
    defaultTheme: 'clilTheme',
    themes: {
      clilTheme,
    }
  }
}) 