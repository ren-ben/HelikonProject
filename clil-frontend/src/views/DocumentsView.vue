<template>
  <div>
    <h1 class="text-h4 font-weight-bold mb-6">Dokumente</h1>

    <!-- Upload-Bereich -->
    <v-card class="mb-6" variant="outlined">
      <v-card-title class="text-h6">
        <v-icon class="mr-2">mdi-upload</v-icon>
        Dokument hochladen
      </v-card-title>
      <v-card-text>
        <v-file-input
          v-model="selectedFile"
          label="Datei auswählen (.pdf, .docx, .txt)"
          accept=".pdf,.docx,.txt"
          prepend-icon="mdi-paperclip"
          variant="outlined"
          density="comfortable"
          :disabled="uploading"
          show-size
        />
        <v-btn
          color="primary"
          :loading="uploading"
          :disabled="!selectedFile || uploading"
          @click="handleUpload"
          class="mt-2"
        >
          <v-icon left class="mr-2">mdi-cloud-upload</v-icon>
          Hochladen
        </v-btn>

        <v-alert
          v-if="uploadMessage"
          :type="uploadSuccess ? 'success' : 'error'"
          variant="tonal"
          density="compact"
          closable
          class="mt-4"
          @click:close="uploadMessage = ''"
        >
          {{ uploadMessage }}
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- Dokumentenliste -->
    <v-card variant="outlined">
      <v-card-title class="text-h6">
        <v-icon class="mr-2">mdi-file-document-multiple</v-icon>
        Hochgeladene Dokumente
        <v-spacer />
        <v-btn
          icon
          variant="text"
          size="small"
          :loading="loadingDocs"
          @click="fetchDocuments"
        >
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-progress-linear v-if="loadingDocs" indeterminate color="primary" class="mb-4" />

        <div v-if="!loadingDocs && documents.length === 0" class="text-center py-8 text-medium-emphasis">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-file-question-outline</v-icon>
          <p class="text-body-1">Noch keine Dokumente hochgeladen.</p>
          <p class="text-body-2">Laden Sie ein PDF, DOCX oder TXT hoch, um die RAG-Abfrage zu nutzen.</p>
        </div>

        <v-table v-else density="comfortable">
          <thead>
            <tr>
              <th>Dateiname</th>
              <th>Hochgeladen</th>
              <th>Chunks</th>
              <th class="text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in documents" :key="doc.doc_id">
              <td>
                <v-icon size="small" class="mr-2">{{ getFileIcon(doc.filename) }}</v-icon>
                {{ doc.filename }}
              </td>
              <td>{{ formatDate(doc.uploaded_at) }}</td>
              <td>{{ doc.chunk_count }}</td>
              <td class="text-right">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="error"
                  :loading="deletingId === doc.doc_id"
                  @click="confirmDelete(doc)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <!-- Lösch-Bestätigung -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Dokument löschen?</v-card-title>
        <v-card-text>
          Möchten Sie <strong>{{ deleteTarget?.filename }}</strong> wirklich löschen?
          Alle zugehörigen Chunks werden entfernt.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Abbrechen</v-btn>
          <v-btn color="error" variant="flat" @click="handleDelete">Löschen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/deepinfra-api'

const selectedFile = ref(null)
const uploading = ref(false)
const uploadMessage = ref('')
const uploadSuccess = ref(false)

const documents = ref([])
const loadingDocs = ref(false)

const deleteDialog = ref(false)
const deleteTarget = ref(null)
const deletingId = ref(null)

onMounted(() => {
  fetchDocuments()
})

async function fetchDocuments() {
  loadingDocs.value = true
  const result = await api.listDocuments()
  if (result.success) {
    documents.value = result.data
  }
  loadingDocs.value = false
}

async function handleUpload() {
  if (!selectedFile.value) return

  uploading.value = true
  uploadMessage.value = ''

  const result = await api.uploadDocument(selectedFile.value)

  if (result.success && !result.data.error) {
    uploadSuccess.value = true
    uploadMessage.value = `"${result.data.filename}" erfolgreich hochgeladen (${result.data.chunk_count} Chunks).`
    selectedFile.value = null
    await fetchDocuments()
  } else {
    uploadSuccess.value = false
    uploadMessage.value = result.data?.error || result.error || 'Upload fehlgeschlagen.'
  }

  uploading.value = false
}

function confirmDelete(doc) {
  deleteTarget.value = doc
  deleteDialog.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return

  const docId = deleteTarget.value.doc_id
  deleteDialog.value = false
  deletingId.value = docId

  const result = await api.deleteDocuments([docId])

  if (result.success) {
    await fetchDocuments()
  }

  deletingId.value = null
  deleteTarget.value = null
}

function getFileIcon(filename) {
  if (!filename) return 'mdi-file'
  const ext = filename.split('.').pop().toLowerCase()
  if (ext === 'pdf') return 'mdi-file-pdf-box'
  if (ext === 'docx' || ext === 'doc') return 'mdi-file-word-box'
  if (ext === 'txt') return 'mdi-file-document-outline'
  return 'mdi-file'
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>
