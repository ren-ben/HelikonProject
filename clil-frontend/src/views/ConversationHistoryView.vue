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

      <v-btn
        v-if="conversationHistory.length > 0"
        icon
        @click="exportDialog = true"
        class="ml-2"
      >
        <v-icon>mdi-download</v-icon>
        <v-tooltip activator="parent" location="bottom">
          Chatverlauf exportieren
        </v-tooltip>
      </v-btn>
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
              v-for="message in conversationHistory"
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

                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    @click="copyToClipboard(message.message)"
                    class="mr-2"
                  >
                    <v-icon size="small">mdi-content-copy</v-icon>
                    <v-tooltip activator="parent" location="top">
                      Text kopieren
                    </v-tooltip>
                  </v-btn>

                  <span class="text-caption text-grey">
                    {{ formatTimestamp(message.timestamp) }}
                  </span>
                </v-card-title>

                <v-divider></v-divider>

                <v-card-text class="pa-4">
                  <div
                    :class="message.role === 'user' ? 'user-message' : 'assistant-message'"
                    class="text-body-2 message-container"
                  >
                    {{ message.message }}
                  </div>

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

    <!-- ✅ Export Dialog -->
    <v-dialog v-model="exportDialog" max-width="800" scrollable>
      <v-card>
        <v-toolbar color="primary" dark density="compact">
          <v-btn icon @click="exportDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>Chatverlauf exportieren</v-toolbar-title>
        </v-toolbar>

        <v-card-text class="pa-6">
          <v-row>
            <v-col cols="12">
              <h3 class="text-subtitle-1 mb-3">Format auswählen</h3>
              <v-chip-group
                v-model="exportFormat"
                column
                mandatory
                selected-class="text-primary"
              >
                <v-chip value="pdf" filter label>
                  <v-icon start color="red">mdi-file-pdf-box</v-icon>
                  PDF
                </v-chip>
                <v-chip value="docx" filter label>
                  <v-icon start color="blue">mdi-file-word-box</v-icon>
                  Word (DOCX)
                </v-chip>
                <v-chip value="md" filter label>
                  <v-icon start color="grey">mdi-language-markdown</v-icon>
                  Markdown
                </v-chip>
                <v-chip value="txt" filter label>
                  <v-icon start color="grey-darken-2">mdi-text-box</v-icon>
                  Text
                </v-chip>
              </v-chip-group>

              <v-divider class="my-4"></v-divider>

              <h3 class="text-subtitle-1 mb-3">Optionen</h3>

              <v-checkbox
                v-model="includeTimestamps"
                label="Zeitstempel einschließen"
                color="primary"
                hide-details
                density="compact"
                class="mb-2"
              ></v-checkbox>

              <v-checkbox
                v-model="includeModelInfo"
                label="Modellinformationen einschließen"
                color="primary"
                hide-details
                density="compact"
                class="mb-2"
              ></v-checkbox>

              <v-checkbox
                v-model="includeMetadata"
                label="Material-Metadaten einschließen"
                color="primary"
                hide-details
                density="compact"
                class="mb-4"
              ></v-checkbox>

              <v-text-field
                v-model="exportFilename"
                label="Dateiname"
                variant="outlined"
                density="comfortable"
                hide-details
                :suffix="'.' + exportFormat"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="exportDialog = false">
            Abbrechen
          </v-btn>
          <v-btn
            color="primary"
            @click="performExport"
            :loading="exporting"
            :disabled="exporting"
          >
            <v-icon start>mdi-download</v-icon>
            Exportieren
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Copy Success Snackbar -->
    <v-snackbar
      v-model="copySnackbar"
      :timeout="2000"
      color="success"
    >
      Text in Zwischenablage kopiert!
      <template v-slot:actions>
        <v-btn variant="text" @click="copySnackbar = false">
          Schließen
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Export Success Snackbar -->
    <v-snackbar
      v-model="exportSnackbar.show"
      :timeout="3000"
      :color="exportSnackbar.color"
    >
      {{ exportSnackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="exportSnackbar.show = false">
          Schließen
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMaterialsStore } from '@/stores/materials';
import apiClient from '@/services/deepinfra-api';
import { convertMarkdownToDocx } from '@mohtasham/md-to-docx';

const route = useRoute();
const router = useRouter();
const materialsStore = useMaterialsStore();

const conversationHistory = ref([]);
const material = ref(null);
const loading = ref(false);
const error = ref(null);
const copySnackbar = ref(false);

// Export state
const exportDialog = ref(false);
const exportFormat = ref('pdf');
const exportFilename = ref('chatverlauf');
const includeTimestamps = ref(true);
const includeModelInfo = ref(true);
const includeMetadata = ref(true);
const exporting = ref(false);
const exportSnackbar = reactive({ show: false, message: '', color: 'success' });

const goBack = () => {
  router.push(`/edit/${route.params.id}`);
};

const loadData = async () => {
  loading.value = true;
  error.value = null;

  try {
    material.value = await materialsStore.fetchMaterialById(route.params.id);
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

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    copySnackbar.value = true;
  } catch (err) {
    console.error('Failed to copy text:', err);
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      copySnackbar.value = true;
    } catch (e) {
      console.error('Fallback copy failed:', e);
    }
    document.body.removeChild(textArea);
  }
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


const buildMetadataHeader = () => {
  if (!includeMetadata.value) return '';

  return `Material: ${material.value?.topic || 'N/A'}
Fach: ${material.value?.subject || 'N/A'}
Typ: ${material.value?.type || 'N/A'}
Exportiert: ${new Date().toLocaleString('de-DE')}
Anzahl Nachrichten: ${conversationHistory.value.length}

${'='.repeat(60)}

`;
};

const buildTextContent = () => {
  let content = buildMetadataHeader();

  conversationHistory.value.forEach((msg, index) => {
    const role = msg.role === 'user' ? 'SIE' : 'AI ASSISTANT';
    const timestamp = includeTimestamps.value ? ` [${formatTimestamp(msg.timestamp)}]` : '';
    const modelInfo = includeModelInfo.value && msg.modelUsed ? `\nModell: ${msg.modelUsed}` : '';

    content += `${index + 1}. ${role}${timestamp}${modelInfo}\n`;
    content += `${'-'.repeat(60)}\n`;
    content += `${msg.message}\n\n`;
  });

  return content;
};

const buildMarkdownContent = () => {
  let content = '';

  if (includeMetadata.value) {
    content += `# Chatverlauf: ${material.value?.topic || 'Untitled'}\n\n`;
    content += `**Fach:** ${material.value?.subject || 'N/A'}  \n`;
    content += `**Typ:** ${material.value?.type || 'N/A'}  \n`;
    content += `**Exportiert:** ${new Date().toLocaleString('de-DE')}  \n`;
    content += `**Anzahl Nachrichten:** ${conversationHistory.value.length}\n\n`;
    content += `---\n\n`;
  }

  conversationHistory.value.forEach((msg, index) => {
    const role = msg.role === 'user' ? '👤 **Sie**' : '🤖 **AI Assistant**';
    const timestamp = includeTimestamps.value ? ` - *${formatTimestamp(msg.timestamp)}*` : '';
    const modelInfo = includeModelInfo.value && msg.modelUsed ? `\n> Modell: ${msg.modelUsed}` : '';

    content += `## ${index + 1}. ${role}${timestamp}\n\n`;
    content += `${msg.message}\n`;
    if (modelInfo) content += `${modelInfo}\n`;
    content += `\n---\n\n`;
  });

  return content;
};

const exportToPDF = async (content) => {
  const { jsPDF } = await import('jspdf');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper to add new page
  const checkPageBreak = (neededSpace = 10) => {
    if (yPosition + neededSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Title
  if (includeMetadata.value) {
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text(`Chatverlauf: ${material.value?.topic || 'Untitled'}`, margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Fach: ${material.value?.subject || 'N/A'}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Exportiert: ${new Date().toLocaleString('de-DE')}`, margin, yPosition);
    yPosition += 10;
  }

  // Messages
  conversationHistory.value.forEach((msg, index) => {
    checkPageBreak(20);

    // Role header
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    const role = msg.role === 'user' ? 'Sie' : 'AI Assistant';
    const timestamp = includeTimestamps.value ? ` [${formatTimestamp(msg.timestamp)}]` : '';
    pdf.text(`${index + 1}. ${role}${timestamp}`, margin, yPosition);
    yPosition += 7;

    // Model info
    if (includeModelInfo.value && msg.modelUsed) {
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'italic');
      pdf.text(`Modell: ${msg.modelUsed}`, margin, yPosition);
      yPosition += 5;
    }

    // Message content
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    const lines = pdf.splitTextToSize(msg.message, maxWidth);

    lines.forEach((line) => {
      checkPageBreak(6);
      pdf.text(line, margin, yPosition);
      yPosition += 6;
    });

    yPosition += 8; // Space between messages
  });

  const blob = pdf.output('blob');
  downloadBlob(blob, `${exportFilename.value}.pdf`);
};

const exportToDOCX = async (markdownContent) => {
  const blob = await convertMarkdownToDocx(markdownContent);
  downloadBlob(blob, `${exportFilename.value}.docx`);
};

const exportToMarkdown = (markdownContent) => {
  const blob = new Blob([markdownContent], { type: 'text/markdown' });
  downloadBlob(blob, `${exportFilename.value}.md`);
};

const exportToText = (textContent) => {
  const blob = new Blob([textContent], { type: 'text/plain' });
  downloadBlob(blob, `${exportFilename.value}.txt`);
};

const downloadBlob = (blob, filename) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

const performExport = async () => {
  if (!conversationHistory.value.length) return;

  exporting.value = true;

  try {
    switch (exportFormat.value) {
      case 'pdf':
        await exportToPDF(buildTextContent());
        break;
      case 'docx':
        await exportToDOCX(buildMarkdownContent());
        break;
      case 'md':
        exportToMarkdown(buildMarkdownContent());
        break;
      case 'txt':
        exportToText(buildTextContent());
        break;
    }

    exportSnackbar.message = 'Export erfolgreich!';
    exportSnackbar.color = 'success';
    exportSnackbar.show = true;
    exportDialog.value = false;
  } catch (err) {
    console.error('Export error:', err);
    exportSnackbar.message = 'Fehler beim Exportieren: ' + err.message;
    exportSnackbar.color = 'error';
    exportSnackbar.show = true;
  } finally {
    exporting.value = false;
  }
};

onMounted(() => {
  loadData();
  exportFilename.value = `chatverlauf_${route.params.id}`;
});
</script>

<style scoped>
.conversation-history-view {
  min-height: calc(100vh - 64px);
}

.message-container {
  max-height: 500px;
  overflow-y: auto;
  overflow-x: hidden;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Roboto', sans-serif;
  line-height: 1.6;
}

.user-message {
  background: white;
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid #2196F3;
}

.assistant-message {
  background: white;
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid #4CAF50;
}

.message-container::-webkit-scrollbar {
  width: 8px;
}

.message-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.message-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.message-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
