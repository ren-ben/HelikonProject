<template>
  <v-container class="settings-container" fluid>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="7">
        <v-card elevation="2" class="pa-0">
          <v-card-title class="settings-title">
            <v-icon start color="primary" size="large">mdi-cog</v-icon>
            Einstellungen
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <!-- Profil -->
            <v-row class="mb-6" align="center">
              <v-col cols="12" md="3" class="text-center">
                <v-avatar size="64" color="primary">
                  <v-icon size="36" color="white">mdi-account</v-icon>
                </v-avatar>
              </v-col>
              <v-col cols="12" md="9">
                <div class="font-weight-bold text-h6 mb-1">
                  {{ profile.name }}
                </div>
                <div class="text-body-2 text-grey-darken-1 mb-2">
                  {{ profile.email }}
                </div>
                <v-btn variant="text" color="primary" size="small" disabled>
                  <v-icon start size="small">mdi-lock</v-icon>
                  Passwort ändern
                </v-btn>
              </v-col>
            </v-row>

            <!-- UI-Einstellungen -->
            <v-card class="mb-5" variant="outlined">
              <v-card-title class="settings-section-title">
                <v-icon start color="primary">mdi-monitor-dashboard</v-icon>
                UI-Einstellungen
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="4">
                    <v-select
                      v-model="ui.theme"
                      :items="themes"
                      item-title="title"
                      item-value="value"
                      label="Theme"
                      prepend-inner-icon="mdi-theme-light-dark"
                      append-inner-icon="mdi-chevron-down"
                      variant="solo"
                      color="primary"
                      rounded
                      density="comfortable"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-select
                      v-model="ui.language"
                      :items="languages"
                      item-title="title"
                      item-value="value"
                      label="Sprache"
                      prepend-inner-icon="mdi-translate"
                      append-inner-icon="mdi-chevron-down"
                      variant="solo"
                      color="primary"
                      rounded
                      density="comfortable"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="4" class="d-flex align-center">
                    <v-switch
                      v-model="ui.sidebarExpanded"
                      label="Sidebar ausgeklappt"
                      color="primary"
                      inset
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- KI/API -->
            <v-card class="mb-5" variant="outlined">
              <v-card-title class="settings-section-title">
                <v-icon start color="primary">mdi-robot</v-icon>
                KI-/API-Einstellungen
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="7">
                    <v-text-field
                      v-model="api.geminiKey"
                      label="Gemini API-Key"
                      prepend-inner-icon="mdi-key"
                      :type="showApiKey ? 'text' : 'password'"
                      :append-inner-icon="showApiKey ? 'mdi-eye-off' : 'mdi-eye'"
                      @click:append-inner="showApiKey = !showApiKey"
                      hint="Optional: Eigener API-Key für KI-Generierung"
                      persistent-hint
                      variant="solo"
                      color="primary"
                      rounded
                      density="comfortable"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-select
                      v-model="api.defaultLevel"
                      :items="languageLevels"
                      item-title="title"
                      item-value="value"
                      label="Standard-Sprachniveau"
                      prepend-inner-icon="mdi-translate"
                      append-inner-icon="mdi-chevron-down"
                      variant="solo"
                      color="primary"
                      rounded
                      density="comfortable"
                      hide-details
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Export -->
            <v-card class="mb-5" variant="outlined">
              <v-card-title class="settings-section-title">
                <v-icon start color="primary">mdi-file-export-outline</v-icon>
                Export-Voreinstellungen
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="exportSettings.format"
                      :items="exportFormats"
                      item-title="title"
                      item-value="value"
                      label="Standard-Exportformat"
                      prepend-inner-icon="mdi-file-export"
                      append-inner-icon="mdi-chevron-down"
                      variant="solo"
                      color="primary"
                      rounded
                      density="comfortable"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="exportSettings.layout"
                      :items="exportLayouts"
                      item-title="title"
                      item-value="value"
                      label="Layout-Vorlage"
                      prepend-inner-icon="mdi-file-document-outline"
                      append-inner-icon="mdi-chevron-down"
                      variant="solo"
                      color="primary"
                      rounded
                      density="comfortable"
                      hide-details
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions class="justify-end">
            <v-btn color="primary" size="large" @click="saveSettings" :disabled="!settingsChanged">
              <v-icon start>mdi-content-save</v-icon>
              Änderungen speichern
            </v-btn>
          </v-card-actions>
        </v-card>
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top right">
          {{ snackbar.text }}
        </v-snackbar>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()

// Dummy-Profil (kann später aus Auth-Store kommen)
const profile = reactive({
  name: 'Max Mustermann',
  email: 'max@schule.de'
})

// UI-Einstellungen
const themes = [
  { title: 'Hell', value: 'light' },
  { title: 'Dunkel', value: 'dark' }
]
const languages = [
  { title: 'Deutsch', value: 'de' },
  { title: 'Englisch', value: 'en' }
]
const ui = reactive({
  theme: uiStore.currentTheme,
  language: 'de',
  sidebarExpanded: uiStore.sidebarExpanded
})

// KI-/API-Einstellungen
const languageLevels = [
  { title: 'A1', value: 'A1' }, { title: 'A2', value: 'A2' }, { title: 'B1', value: 'B1' }, { title: 'B2', value: 'B2' }, { title: 'C1', value: 'C1' }
]
const api = reactive({
  geminiKey: '',
  defaultLevel: 'B1'
})
const showApiKey = ref(false)

// Export-Voreinstellungen
const exportFormats = [
  { title: 'PDF', value: 'pdf' },
  { title: 'DOCX', value: 'docx' },
  { title: 'HTML', value: 'html' }
]
const exportLayouts = [
  { title: 'Standard', value: 'standard' },
  { title: 'Kompakt', value: 'compact' },
  { title: 'Präsentation', value: 'presentation' }
]
const exportSettings = reactive({
  format: 'pdf',
  layout: 'standard'
})

// Snackbar
const snackbar = reactive({ show: false, text: '', color: 'success' })

// Visuelles Feedback, ob Einstellungen geändert wurden
const initialSettings = JSON.stringify({
  theme: ui.theme,
  language: ui.language,
  sidebarExpanded: ui.sidebarExpanded,
  geminiKey: api.geminiKey,
  defaultLevel: api.defaultLevel,
  format: exportSettings.format,
  layout: exportSettings.layout
})
const settingsChanged = computed(() =>
  JSON.stringify({
    theme: ui.theme,
    language: ui.language,
    sidebarExpanded: ui.sidebarExpanded,
    geminiKey: api.geminiKey,
    defaultLevel: api.defaultLevel,
    format: exportSettings.format,
    layout: exportSettings.layout
  }) !== initialSettings
)

function saveSettings() {
  uiStore.currentTheme = ui.theme
  uiStore.sidebarExpanded = ui.sidebarExpanded
  // Sprache, API-Key, Export etc. ggf. in weiteren Stores oder localStorage persistieren
  snackbar.text = 'Einstellungen gespeichert!'
  snackbar.color = 'success'
  snackbar.show = true
}
</script>

<style scoped>
.settings-container {
  background: #f8f9fb;
  min-height: 100vh;
  padding-top: 32px;
}
.settings-title {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.settings-section-title {
  font-size: 1.1rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  margin-bottom: 0;
}
.v-card {
  border-radius: 18px;
}
.v-avatar {
  margin-bottom: 8px;
}
</style> 