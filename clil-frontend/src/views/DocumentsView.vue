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
        <v-combobox
          v-model="selectedSubject"
          :items="subjects"
          label="Fach (optional)"
          placeholder="Fach wählen oder eingeben"
          prepend-inner-icon="mdi-book-open-variant"
          variant="outlined"
          density="compact"
          clearable
          class="mt-2"
          :disabled="uploading"
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

        <template v-else>
          <!-- Fach-Filter -->
          <v-chip-group
            v-if="availableSubjects.length > 0"
            v-model="filterSubject"
            selected-class="text-primary"
            class="mb-4"
          >
            <v-chip :value="''" variant="outlined" filter>Alle</v-chip>
            <v-chip
              v-for="subj in availableSubjects"
              :key="subj"
              :value="subj"
              variant="outlined"
              filter
            >
              {{ subj }}
            </v-chip>
          </v-chip-group>

          <v-data-table
            :headers="headers"
            :items="filteredDocuments"
            :items-per-page="10"
            items-per-page-text="Dokumente pro Seite"
            density="comfortable"
            item-value="doc_id"
          >
            <template v-slot:item.filename="{ item }">
              <v-icon size="small" class="mr-2">{{ getFileIcon(item.filename) }}</v-icon>
              {{ item.filename }}
            </template>

            <template v-slot:item.subject="{ item }">
              <v-chip v-if="item.subject" size="small" color="primary" variant="tonal">{{ item.subject }}</v-chip>
              <span v-else class="text-medium-emphasis">—</span>
            </template>

            <template v-slot:item.uploaded_at="{ item }">
              {{ formatDate(item.uploaded_at) }}
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn
                icon
                variant="text"
                size="small"
                color="error"
                :loading="deletingId === item.doc_id"
                @click="confirmDelete(item)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </template>
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
import { ref, computed, onMounted } from 'vue'
import api from '@/services/deepinfra-api'
import { useSubjectStore } from '@/stores/subjects'
import { useNotificationStore } from '@/stores/notifications'

const subjectStore = useSubjectStore()
const subjects = computed(() => subjectStore.subjectNames())

const notificationStore = useNotificationStore()

const selectedFile = ref(null)
const selectedSubject = ref('')
const uploading = ref(false)
const uploadMessage = ref('')
const uploadSuccess = ref(false)

const documents = ref([])
const loadingDocs = ref(false)
const filterSubject = ref('')

const deleteDialog = ref(false)
const deleteTarget = ref(null)
const deletingId = ref(null)

const headers = [
  { title: 'Dateiname', key: 'filename', sortable: true },
  { title: 'Fach', key: 'subject', sortable: true },
  { title: 'Hochgeladen', key: 'uploaded_at', sortable: true },
  { title: 'Chunks', key: 'chunk_count', sortable: true },
  { title: 'Aktionen', key: 'actions', sortable: false, align: 'end' },
]

const availableSubjects = computed(() => {
  const unique = new Set(documents.value.map(d => d.subject).filter(Boolean))
  return [...unique].sort()
})

const filteredDocuments = computed(() => {
  if (!filterSubject.value) return documents.value
  return documents.value.filter(d => d.subject === filterSubject.value)
})

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

  const result = await api.uploadDocument(selectedFile.value, selectedSubject.value || '')

  if (result.success && !result.data.error) {
    uploadSuccess.value = true
    uploadMessage.value = `"${result.data.filename}" erfolgreich hochgeladen (${result.data.chunk_count} Chunks).`
    notificationStore.add({ title: 'Dokument hochgeladen', message: `"${result.data.filename}" (${result.data.chunk_count} Chunks)`, type: 'success', icon: 'mdi-file-upload' })
    selectedFile.value = null
    selectedSubject.value = ''
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

  const deletedFilename = deleteTarget.value.filename
  const result = await api.deleteDocuments([docId])

  if (result.success) {
    notificationStore.add({ title: 'Dokument gelöscht', message: `"${deletedFilename}" wurde entfernt`, type: 'info', icon: 'mdi-delete' })
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
