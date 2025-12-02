// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // Importiere den Router
import { createPinia } from 'pinia' // Importiere Pinia
import vuetify from './plugins/vuetify' // Importiere die Vuetify-Konfiguration
// import PrimeVue from 'primevue/config' // Entfernt

// Importiere PrimeVue CSS (optional, je nach Bedarf)
// import 'primevue/resources/themes/lara-light-blue/theme.css' // Entfernt

// Vuetify Styles
import 'vuetify/styles'


// Lade globale CSS-Stile oder andere Initialisierungen hier
// import './assets/main.css'

const app = createApp(App)
const pinia = createPinia() // Erstelle Pinia Instanz

// Globaler Error Handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err)
  console.error('Error info:', info)
  
  // Spezielle Behandlung für Router-Fehler
  if (err.message && err.message.includes('Failed to fetch dynamically imported module')) {
    console.error('Module loading error - attempting recovery')
    // Optional: Zeige eine Benutzerbenachrichtigung
    if (window.confirm('Ein Fehler ist aufgetreten. Möchten Sie die Seite neu laden?')) {
      window.location.reload()
    }
  }
}

// Globaler Promise Rejection Handler
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason)
  // Verhindere, dass der Fehler die Konsole spammt
  event.preventDefault()
})

app.use(router) // Registriere den Router
app.use(pinia) // Registriere Pinia
app.use(vuetify) // Verwende das Vuetify-Plugin
// app.use(PrimeVue, { // Entfernt
//   ripple: true,
//   inputStyle: 'filled'
// })

// Warte bis Router bereit ist
router.isReady().then(() => {
  app.mount('#app')
}).catch(err => {
  console.error('Router initialization failed:', err)
})
