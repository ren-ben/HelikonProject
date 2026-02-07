<template>
  <div>
    <h1 class="text-h4 font-weight-bold mb-6">RAG-Abfrage</h1>

    <!-- Abfrage-Bereich -->
    <v-card class="mb-6" variant="outlined">
      <v-card-title class="text-h6">
        <v-icon class="mr-2">mdi-chat-question</v-icon>
        Frage stellen
      </v-card-title>
      <v-card-text>
        <v-textarea
          v-model="query"
          label="Stellen Sie eine Frage zu Ihren hochgeladenen Dokumenten..."
          variant="outlined"
          rows="3"
          auto-grow
          :disabled="loading"
        />
        <v-btn
          color="primary"
          :loading="loading"
          :disabled="!query.trim() || loading"
          @click="handleQuery"
          class="mt-2"
        >
          <v-icon left class="mr-2">mdi-send</v-icon>
          Abfrage senden
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Ergebnis -->
    <v-card v-if="answer || loading || error" variant="outlined">
      <v-card-title class="text-h6">
        <v-icon class="mr-2">mdi-message-reply-text</v-icon>
        Antwort
      </v-card-title>
      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
          {{ error }}
        </v-alert>

        <div v-if="answer" class="text-body-1 mb-6" style="white-space: pre-wrap;">{{ answer }}</div>

        <!-- Quellen -->
        <div v-if="sources.length > 0">
          <v-divider class="mb-4" />
          <div class="text-subtitle-2 font-weight-bold mb-3">
            <v-icon size="small" class="mr-1">mdi-link-variant</v-icon>
            Quellen ({{ sources.length }})
          </div>
          <v-list density="compact" variant="tonal" rounded>
            <v-list-item v-for="(source, i) in sources" :key="i">
              <template #prepend>
                <v-icon size="small">mdi-file-document-outline</v-icon>
              </template>
              <v-list-item-title class="text-body-2">{{ source.filename }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                Chunk {{ source.chunk_index != null ? source.chunk_index + 1 : '—' }}
                <span v-if="source.score"> · Relevanz: {{ (source.score * 100).toFixed(0) }}%</span>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </div>

        <!-- Leerer Zustand nach erfolgreicher Abfrage ohne Antwort -->
        <div v-if="!loading && !error && !answer && querySubmitted" class="text-center py-4 text-medium-emphasis">
          <p>Keine Antwort erhalten. Haben Sie bereits Dokumente hochgeladen?</p>
        </div>
      </v-card-text>
    </v-card>

    <!-- Hinweis wenn noch keine Abfrage -->
    <v-card v-if="!answer && !loading && !error && !querySubmitted" variant="outlined">
      <v-card-text class="text-center py-8 text-medium-emphasis">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-database-search</v-icon>
        <p class="text-body-1">Stellen Sie eine Frage zu Ihren hochgeladenen Dokumenten.</p>
        <p class="text-body-2">Die RAG-Abfrage durchsucht Ihre Dokumente und generiert eine kontextbasierte Antwort.</p>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/services/deepinfra-api'

const query = ref('')
const loading = ref(false)
const answer = ref('')
const sources = ref([])
const error = ref('')
const querySubmitted = ref(false)

async function handleQuery() {
  if (!query.value.trim()) return

  loading.value = true
  answer.value = ''
  sources.value = []
  error.value = ''
  querySubmitted.value = true

  const result = await api.queryDocuments(query.value)

  if (result.success && !result.data.error) {
    answer.value = result.data.answer || ''
    sources.value = result.data.sources || []
  } else {
    error.value = result.data?.error || result.error || 'Abfrage fehlgeschlagen.'
  }

  loading.value = false
}
</script>
