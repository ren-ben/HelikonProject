<template>
  <div>
    <v-toolbar density="compact" flat class="mb-4">
       <v-btn icon @click="router.push('/materials')">
           <v-icon>mdi-arrow-left</v-icon>
       </v-btn>
        <v-toolbar-title class="text-h6">
            <span v-if="material">{{ material.title || 'Material bearbeiten' }}</span>
            <v-skeleton-loader v-else type="text" width="200"></v-skeleton-loader>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-chip size="small" class="mr-2" :color="saveStatusColor" variant="tonal">
          <v-icon start size="small">{{ saveStatusIcon }}</v-icon>
          {{ saveStatusText }}
        </v-chip>
        <!-- Weitere Aktionen wie Export, Teilen könnten hierhin -->
        <v-btn color="primary" @click="forceSave">
            <v-icon start>mdi-content-save</v-icon>
            Speichern
        </v-btn>
        <v-btn color="secondary" @click="handleExport">
          <v-icon start>mdi-export</v-icon>
          Exportieren
        </v-btn>
    </v-toolbar>

    <v-row>
      <!-- Haupt-Editor-Bereich -->
      <v-col cols="12" md="8">
          <v-skeleton-loader v-if="loading" type="image, article"></v-skeleton-loader>
          <monaco-editor
            v-else-if="material"
            v-model="editableContent"
            language="markdown"
          />
          <v-alert v-else type="error">
              Material konnte nicht geladen werden.
          </v-alert>
      </v-col>


      <!-- Sidebar für Metadaten -->
      <v-col cols="12" md="4">
        <v-card elevation="1" v-if="material">
           <v-card-title class="text-subtitle-1">Metadaten</v-card-title>
           <v-divider></v-divider>
           <v-card-text>
              <v-text-field
                v-model="editableTitle"
                label="Titel"
                variant="outlined"
                density="compact"
                class="mb-3"
              ></v-text-field>
              <v-select
                v-model="editableType"
                :items="materialTypes"
                item-title="title"
                item-value="id"
                label="Material-Typ"
                variant="outlined"
                density="compact"
                class="mb-3"
              ></v-select>
               <v-combobox
                v-model="editableSubject"
                :items="subjects"
                label="Fach"
                placeholder="Wählen oder eingeben"
                variant="outlined"
                density="compact"
                class="mb-3"
              ></v-combobox>

               <v-divider class="my-3"></v-divider>
                <h4 class="text-subtitle-2 mb-2">CLIL-Parameter</h4>
               <v-select
                  v-model="editableLanguageLevel"
                  :items="languageLevels"
                  label="Sprachniveau"
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                ></v-select>
                <v-slider
                    v-model="editableVocabPercentage"
                    :min="10"
                    :max="50"
                    :step="5"
                    label="Fachvokabular (%)"
                    color="primary"
                    thumb-label
                    class="mb-1"
                >
                    <template v-slot:append>
                        <v-chip size="small" label>{{ editableVocabPercentage }}%</v-chip>
                    </template>
                </v-slider>

               <v-divider class="my-3"></v-divider>
                <div class="text-caption">
                    Erstellt: {{ formatDate(material.created) }}
                </div>
                <div class="text-caption">
                    Zuletzt geändert: {{ formatDate(material.modified) }}
                </div>
                <v-divider class="my-3"></v-divider>
                <v-btn block variant="text" @click="router.push(`/materials/${material.id}/history`)">
                  <v-icon start>mdi-history</v-icon>
                  Chatverlauf anzeigen
                </v-btn>
           </v-card-text>
           <v-divider></v-divider>
           <v-card-actions>
               <v-spacer></v-spacer>
                <v-btn color="error" variant="text" @click="confirmDeleteDialog = true">
                   <v-icon start>mdi-delete-outline</v-icon>
                   Löschen
               </v-btn>
           </v-card-actions>
        </v-card>
         <v-skeleton-loader v-else type="card"></v-skeleton-loader>
      </v-col>




            <!-- AI Chat Assistant -->
            <v-col cols="12" md="8">
              <v-card elevation="1" class="mt-4">
                <v-card-title class="text-subtitle-1 d-flex align-center">
                  <v-icon start color="primary">mdi-robot-outline</v-icon>
                  AI-Assistent
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                                    <v-select
                                                            v-model="selectedModel"
                                                            :items="availableModels"
                                                            label="LLM-Modell"
                                                            prepend-inner-icon="mdi-brain"
                                                            variant="outlined"
                                                            density="compact"
                                                            :loading="loadingModels"
                                                            :disabled="loadingModels || chatLoading"
                                                            hint="Wählen Sie ein Modell für die Generierung"
                                                            persistent-hint
                                                            class="mb-3"
                                                          ></v-select>
                  <v-textarea
                    v-model="chatPrompt"
                    label="Material ändern..."
                    placeholder="z.B. 'kürzer machen', 'mehr Beispiele hinzufügen', 'ins Deutsche übersetzen'"
                    variant="outlined"
                    rows="3"
                    density="compact"
                    :disabled="chatLoading"
                  ></v-textarea>

                  <v-switch
                                          v-model="useDocumentContext"
                                          color="primary"
                                          label="Kontext aus hochgeladenen Dokumenten verwenden"
                                          hide-details
                                          inset
                                          :disabled="chatLoading"
                                          class="mb-3"
                                        ></v-switch>
                  <v-btn
                    color="primary"
                    block
                    @click="handleChatSubmit"
                    :loading="chatLoading"
                    :disabled="!chatPrompt.trim()"
                  >
                    <v-icon start>mdi-magic-staff</v-icon>
                    Material aktualisieren
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-col>

    </v-row>

     <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="confirmDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">Löschen bestätigen</v-card-title>
        <v-card-text>
          Sind Sie sicher, dass Sie dieses Material endgültig löschen möchten?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="confirmDeleteDialog = false">Abbrechen</v-btn>
          <v-btn color="error" @click="deleteMaterial" :loading="deleting">Löschen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Unsaved Changes Dialog -->
    <v-dialog v-model="confirmLeaveDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Ungespeicherte Änderungen</v-card-title>
        <v-card-text>
          Sie haben ungespeicherte Änderungen. Möchten Sie diese speichern, bevor Sie die Seite verlassen?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="cancelLeave">Abbrechen</v-btn>
          <v-btn color="warning" variant="text" @click="confirmLeave">Verwerfen</v-btn>
          <v-btn color="primary" @click="saveAndLeave" :loading="saveStatus === 'saving'">
            Speichern & Verlassen
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ExportDialog
      v-model="exportDialog"
      :material-id="material?.id"
      :material="material"
    />
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3000"
    >
      {{ snackbar.text }}
    </v-snackbar>
    <v-dialog v-model="showPreview" fullscreen>
      <v-card>
        <v-toolbar density="compact">
          <v-btn icon @click="showPreview = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="showPreview = false">
            Zurück zum Bearbeiten
          </v-btn>
        </v-toolbar>
        <v-card-text>
          <div class="preview-content" v-html="editableContent"></div>
        </v-card-text>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { useMaterialsStore } from '@/stores/materials';
import { useUIStore } from '@/stores/ui';
import MonacoEditor from '@/components/Editor/MonacoEditor.vue';
import ExportDialog from '@/components/ExportDialog.vue';
import { useNotificationStore } from '@/stores/notifications';
import { useSubjectStore } from '@/stores/subjects';
import materialsService from '@/services/materialsService';
import apiClient from '@/services/deepinfra-api';
import {
  getIconForType,
  getIconColor,
  getMaterialTypeTitle,
  formatDate,
  MATERIAL_TYPES
} from '@/utils/materialUtils';

const chatPrompt = ref('');
const chatLoading = ref(false);
const selectedModel = ref('');
const availableModels = ref([]);
const loadingModels = ref(false);
const useDocumentContext = ref(true);


const route = useRoute();
const router = useRouter();
const materialsStore = useMaterialsStore();
const uiStore = useUIStore();
const notificationStore = useNotificationStore();
const subjectStore = useSubjectStore();

const loading = ref(true);
const material = ref(null);
const editableContent = ref('');
const editableTitle = ref('');
const editableType = ref('');
const editableSubject = ref('');
const editableLanguageLevel = ref('B1');
const editableVocabPercentage = ref(30);
const editableTags = ref([]);
const availableTags = ref(['CLIL', 'Technik', 'Quiz', 'Glossar', 'Präsentation', 'Video']);
const saveStatus = ref('saved');
const confirmDeleteDialog = ref(false);
const deleting = ref(false);
const exportDialog = ref(false);
const showPreview = ref(false);
const showVersionHistory = ref(false);
const snackbar = ref({ show: false, text: '', color: 'success' });
const initialLoadComplete = ref(false);

// Globale Materialtypen aus Utils
const materialTypes = computed(() =>
  Object.entries(MATERIAL_TYPES).map(([id, config]) => ({ id, title: config.title }))
);
const subjects = computed(() => subjectStore.subjectNames());
const languageLevels = [
  { title: 'A1', value: 'A1' }, { title: 'A2', value: 'A2' }, { title: 'B1', value: 'B1' }, { title: 'B2', value: 'B2' }, { title: 'C1', value: 'C1' }
];

// Watch für Route-Änderungen
watch(() => route.params.id, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    // Lade das neue Material
    await loadMaterial(newId);
  }
});

// Extrahiere die Lade-Logik in eine separate Funktion
const loadMaterial = async (materialId) => {
  loading.value = true;
  try {
    // Versuche zuerst aus dem Store zu laden
    material.value = materialsStore.getMaterialById(materialId);
    
    // Wenn nicht im Store, lade vom Backend
    if (!material.value) {
      const fetchedMaterial = await materialsStore.fetchMaterialById(materialId);
      material.value = fetchedMaterial;
    }
    
    if (material.value) {
      editableContent.value = material.value.content || '';
      editableTitle.value = material.value.title || '';
      editableType.value = material.value.type || '';
      editableSubject.value = material.value.subject || '';
      editableLanguageLevel.value = material.value.languageLevel || 'B1';
      editableVocabPercentage.value = material.value.vocabPercentage || 30;
      editableTags.value = material.value.tags || [];

      setTimeout(() => {
              initialLoadComplete.value = true;
            }, 100);

      
    } else {
      console.error('No material data available after fetch');
      showFeedback('Material konnte nicht gefunden werden', 'error');
      router.push('/materials');
    }
  } catch (error) {
    console.error('Error loading material:', error);
    showFeedback('Fehler beim Laden des Materials', 'error');
    router.push('/materials');
  } finally {
    loading.value = false;
  }
};

// Material laden
onMounted(async () => {
  if (route.params.id) {
    await loadMaterial(route.params.id);
  }

  loadingModels.value = true;
  try {
    const response = await apiClient.getAvailableModels();
    if (response.success && response.data.length > 0) {
      availableModels.value = response.data;
      selectedModel.value = availableModels.value[0]; // Set default
    } else {
      availableModels.value = ['llama3'];
      selectedModel.value = 'llama3';
    }
  } catch (error) {
    console.error('Error loading models:', error);
    availableModels.value = ['llama3'];
    selectedModel.value = 'llama3';
  } finally {
    loadingModels.value = false;
  }

});

// Cleanup timeouts on unmount
onBeforeUnmount(async () => {
  try {
    await materialsStore.fetchMaterials();
  } catch (error) {
    console.error('Error refreshing materials before unmount:', error);
  }
});

// Save-Status-Logik

const saveStatusText = computed(() => {
    switch(saveStatus.value) {
        case 'saved': return 'Gespeichert';
        case 'unsaved': return 'Ungespeichert';
        case 'saving': return 'Speichern...';
        case 'error': return 'Fehler';
        default: return ''
    }
});
const saveStatusIcon = computed(() => {
     switch(saveStatus.value) {
        case 'saved': return 'mdi-check-circle-outline';
        case 'unsaved': return 'mdi-alert-circle-outline';
        case 'saving': return 'mdi-sync';
        case 'error': return 'mdi-close-circle-outline';
        default: return ''
    }
});
const saveStatusColor = computed(() => {
     switch(saveStatus.value) {
        case 'saved': return 'success';
        case 'unsaved': return 'warning';
        case 'saving': return 'info';
        case 'error': return 'error';
        default: return 'grey'
    }
});

const markUnsaved = () => {
    if (saveStatus.value === 'saved' && initialLoadComplete.value) {
        saveStatus.value = 'unsaved';
    }
}

// Watcher für Content-Änderungen (nur für Status-Update, kein Autosave)
watch(editableContent, () => {
  markUnsaved();
});

watch(editableTitle, () => {
  markUnsaved();
});

watch(editableType, () => {
  markUnsaved();
});

watch(editableSubject, () => {
  markUnsaved();
});

watch(editableLanguageLevel, () => {
  markUnsaved();
});

watch(editableVocabPercentage, () => {
  markUnsaved();
});

// Export-Dialog
const handleExport = () => {
  exportDialog.value = true;
};



// Snackbar Feedback
const showFeedback = (text, color = 'success') => {
  snackbar.value = { show: true, text, color };
};

// Force Save - now the only way to save
const forceSave = async () => {
    if (!material.value) return;
    saveStatus.value = 'saving';
    try {
        await materialsStore.updateMaterial({
            id: material.value.id,
            content: editableContent.value,
            topic: editableTitle.value,
            materialType: editableType.value,
            subject: editableSubject.value,
            languageLevel: editableLanguageLevel.value,
            vocabPercentage: editableVocabPercentage.value,
            tags: editableTags.value
        });
        
        // Update local material object
        material.value.content = editableContent.value;
        material.value.title = editableTitle.value;
        material.value.type = editableType.value;
        material.value.subject = editableSubject.value;
        material.value.languageLevel = editableLanguageLevel.value;
        material.value.vocabPercentage = editableVocabPercentage.value;
        material.value.tags = editableTags.value;
        
        saveStatus.value = 'saved';
        showFeedback('Material gespeichert', 'success');
        notificationStore.add({ title: 'Material aktualisiert', message: `"${editableTitle.value}" wurde aktualisiert`, type: 'success', icon: 'mdi-pencil' })
        uiStore.setLastEditedMaterial(material.value.id);
    } catch (error) {
        console.error('Error force saving:', error);
        saveStatus.value = 'error';
        showFeedback('Fehler beim Speichern!', 'error');
    }
}

// Delete
const deleteMaterial = async () => {
  if (!material.value) return;
  deleting.value = true;
  try {
    await materialsStore.deleteMaterial(material.value.id);
    confirmDeleteDialog.value = false;
    router.push('/materials');
  } catch (error) {
    console.error('Error deleting material:', error);
    showFeedback('Fehler beim Löschen!', 'error');
  } finally {
    deleting.value = false;
  }
};


// Chat with AI - use API client with automatic auth
const handleChatSubmit = async () => {
  if (!chatPrompt.value.trim() || !material.value) return;

  chatLoading.value = true;
  saveStatus.value = 'saving';

  try {


    const response = await apiClient.chatWithMaterial(material.value.id, {
      prompt: chatPrompt.value,
      content: editableContent.value,
      language: material.value.language || 'German',
      languageLevel: editableLanguageLevel.value,
      subject: editableSubject.value,
      modelName: selectedModel.value,
      useDocumentContext: useDocumentContext.value,
    });
    if (!response.success) {
        throw new Error(response.error || 'Chat failed');
    }

    await apiClient.addConversationMessage(material.value.id, {
      role: 'user',
      message: chatPrompt.value,
      modelUsed: selectedModel.value
    });

    await apiClient.addConversationMessage(material.value.id, {
      role: 'assistant',
      message: response.data.formattedResponse,
      modelUsed: selectedModel.value
    });

    editableContent.value = response.data.formattedResponse;
    material.value.content = response.data.formattedResponse;

    chatPrompt.value = '';
    saveStatus.value = 'unsaved';
    showFeedback('Material mit AI aktualisiert!', 'success');

  } catch (error) {
    console.error('Chat error:', error);
    showFeedback(error.message || 'Fehler beim AI-Update', 'error');
    saveStatus.value = 'error';
  } finally {
    chatLoading.value = false;
  }
};



// Add this after other refs
const confirmLeaveDialog = ref(false);
let nextRoute = null;

// Add navigation guard
onBeforeRouteLeave((to, from, next) => {
  if (saveStatus.value === 'unsaved') {
    confirmLeaveDialog.value = true;
    nextRoute = to;
    next(false); // Block navigation
  } else {
    next(); // Allow navigation
  }
});

// Add handlers for the confirmation dialog
const confirmLeave = () => {
  confirmLeaveDialog.value = false;
  saveStatus.value = 'saved'; // Mark as saved to allow navigation
  if (nextRoute) {
    router.push(nextRoute);
  }
};

const cancelLeave = () => {
  confirmLeaveDialog.value = false;
  nextRoute = null;
};

const saveAndLeave = async () => {
  await forceSave();
  confirmLeave();
};




</script>

<style scoped>
/* Add specific styles for the edit view if needed */
.v-toolbar-title {
    flex: 0 1 auto; /* Prevent title from shrinking too much */
    min-width: 150px;
}
</style> 