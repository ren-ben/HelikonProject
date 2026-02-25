<template>
  <div class="conversation-history-view">
    <v-toolbar density="compact" flat class="mb-4">
      <v-btn icon @click="goBack">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title class="text-h6">
        <v-icon start>mdi-history</v-icon>
        Chatverlauf
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-chip v-if="material" variant="tonal" color="primary">
        {{ material.topic }}
      </v-chip>
    </v-toolbar>

    <!-- Loading State -->
    <v-container v-if="loading" class="text-center pa-8">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-h6">Lade Konversationsverlauf...</p>
    </v-container>

    <!-- Error State -->
    <v-alert v-else-if="error" type="error" class="ma-4" prominent>
      <v-alert-title>Fehler</v-alert-title>
      {{ error }}
    </v-alert>

    <!-- Empty State -->
    <v-container v-else-if="!conversationHistory.length">
      <v-card class="mx-auto" max-width="500">
        <v-card-text class="text-center pa-8">
          <v-icon size="64" color="grey">mdi-chat-outline</v-icon>
          <div class="text-h6 mt-4">Kein Verlauf</div>
          <p class="text-body-2 text-grey mt-2">Keine Konversationshistorie verfügbar.</p>
          <v-btn color="primary" class="mt-4" @click="goBack">
            Zurück zum Material
          </v-btn>
        </v-card-text>
      </v-card>
    </v-container>

    <!-- Chat Timeline -->
    <v-container v-else fluid>
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <v-timeline side="end" align="start" truncate-line="both">
            <v-timeline-item
              v-for="(message, index) in conversationHistory"
              :key="message.id"
              :dot-color="message.role === 'user' ? 'blue' : 'green'"
              size="small"
            >
              <template v-slot:icon>
                <v-icon size="small" color="white">
                  {{ message.role === 'user' ? 'mdi-account' : 'mdi-robot' }}
                </v-icon>
              </template>

              <v-card
                :color="message.role === 'user' ? 'blue-lighten-5' : 'green-lighten-5'"
                elevation="2"
                class="mb-4"
              >
                <v-card-title class="text-subtitle-2 d-flex align-center pa-3">
                  <v-chip
                    size="small"
                    :color="message.role === 'user' ? 'blue' : 'green'"
                    class="mr-2"
                  >
                    {{ message.role === 'user' ? 'Sie' : 'AI Assistant' }}
                  </v-chip>
                  <v-spacer></v-spacer>
                  <span class="text-caption text-grey">
                    {{ formatTimestamp(message.timestamp) }}
                  </span>
                </v-card-title>

                <v-divider></v-divider>

                <v-card-text class="pa-4">
                  <!-- User messages: plain text -->
                  <div v-if="message.role === 'user'" class="text-body-2 user-message">
                    {{ message.message }}
                  </div>

                  <!-- Assistant messages: rendered HTML -->
                  <div v-else class="assistant-message">
                    <div class="preview-content" v-html="sanitizeHtml(message.message)"></div>
                  </div>

                  <!-- Model info footer -->
                  <div v-if="message.modelUsed" class="mt-3 pt-3" style="border-top: 1px solid rgba(0,0,0,0.1);">
                    <div class="text-caption text-grey d-flex align-center gap-2">
                      <v-icon size="x-small">mdi-chip</v-icon>
                      <span>Modell: <strong>{{ message.modelUsed }}</strong></span>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-timeline-item>
          </v-timeline>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMaterialsStore } from '@/stores/materials';
import apiClient from '@/services/deepinfra-api';
import DOMPurify from 'dompurify';

const route = useRoute();
const router = useRouter();
const materialsStore = useMaterialsStore();

const conversationHistory = ref([]);
const material = ref(null);
const loading = ref(false);
const error = ref(null);

const goBack = () => {
  router.push(`/edit/${route.params.id}`);
};

const loadData = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Load material
    material.value = await materialsStore.fetchMaterialById(route.params.id);

    // Load conversation history
    const response = await apiClient.getConversationHistory(route.params.id);

    if (!response.success) {
      throw new Error(response.error || 'Failed to load conversation history');
    }

    conversationHistory.value = response.data;
  } catch (err) {
    console.error('Error loading conversation history:', err);
    error.value = err.message || 'Fehler beim Laden des Verlaufs';
  } finally {
    loading.value = false;
  }
};

const sanitizeHtml = (html) => {
  return DOMPurify.sanitize(html);
};

const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.conversation-history-view {
  min-height: calc(100vh - 64px);
}

.user-message {
  background: white;
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid #2196F3;
}

.assistant-message {
  background: white;
  border-radius: 8px;
  padding: 12px;
  border-left: 3px solid #4CAF50;
}

.preview-content {
  max-height: 500px;
  overflow-y: auto;
}

.preview-content :deep(h1),
.preview-content :deep(h2),
.preview-content :deep(h3) {
  margin-top: 0.75em;
  margin-bottom: 0.5em;
  color: #333;
}

.preview-content :deep(p) {
  margin-bottom: 1em;
  line-height: 1.6;
}

.preview-content :deep(ul),
.preview-content :deep(ol) {
  margin-left: 1.5em;
  margin-bottom: 1em;
}

.preview-content :deep(li) {
  margin-bottom: 0.5em;
}

.preview-content :deep(code) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.preview-content :deep(pre) {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  margin-bottom: 1em;
}

.preview-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1em;
}

.preview-content :deep(th),
.preview-content :deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.preview-content :deep(th) {
  background-color: #f5f5f5;
  font-weight: bold;
}
</style>
