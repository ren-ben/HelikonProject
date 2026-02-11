<template>
  <div>
    <v-card elevation="1">
      <v-card-title class="text-h5">
        <v-icon start color="primary">mdi-file-plus</v-icon>
        Neues Material erstellen
      </v-card-title>

      <v-card-text>
        <v-stepper
          v-model="currentStep"
          :items="steps"
          flat
          alt-labels
          hide-actions
        >
        </v-stepper>

        <!-- Schritt-Inhalte ohne Stepper-Window -->
        <div v-if="currentStep === 1">
          <!-- Schritt 1 Inhalt -->
          <v-container fluid>
            <v-row>
              <v-col cols="12">
                <h3 class="text-h6 mb-4">Wählen Sie einen Material-Typ</h3>
              </v-col>
              <v-col
                v-for="type in materialTypes"
                :key="type.id"
                cols="12"
                sm="6"
                md="4"
              >
                <v-card
                  :color="
                    form.type === type.id
                      ? `${type.color}-lighten-4`
                      : 'grey-lighten-4'
                  "
                  :variant="form.type === type.id ? 'outlined' : 'elevated'"
                  class="h-100 d-flex flex-column text-center pa-4 rounded-lg"
                  @click="selectMaterialType(type.id)"
                  hover
                  :elevation="form.type === type.id ? 0 : 2"
                  :style="
                    form.type === type.id
                      ? `border: 2px solid var(--v-theme-${type.color});`
                      : ''
                  "
                >
                  <v-avatar :color="type.color" size="56" class="mb-4 mx-auto">
                    <v-icon color="white" size="x-large">{{
                      type.icon
                    }}</v-icon>
                  </v-avatar>
                  <v-card-title class="text-subtitle-1 font-weight-bold">{{
                    type.title
                  }}</v-card-title>
                  <v-card-subtitle class="text-caption">{{
                    type.description
                  }}</v-card-subtitle>
                </v-card>
              </v-col>
            </v-row>
            <v-alert
              v-if="v$.type.$invalid && v$.type.$dirty"
              type="error"
              variant="tonal"
              class="mt-4"
              density="compact"
            >
              Bitte wählen Sie einen Material-Typ aus, bevor Sie fortfahren.
            </v-alert>
          </v-container>
        </div>
        <div v-else-if="currentStep === 2">
          <!-- Schritt 2 Inhalt -->
          <v-container fluid>
            <v-row>
              <v-col cols="12">
                <h3 class="text-h6 mb-4">Thema und Fach</h3>
              </v-col>
              <v-col cols="12" md="6">
                <v-combobox
                  v-model="form.subject"
                  :items="subjects"
                  label="Fach"
                  placeholder="Wählen oder eingeben"
                  prepend-inner-icon="mdi-book-open-variant"
                  :error-messages="v$.subject.$errors.map((e) => e.$message)"
                  @blur="v$.subject.$touch()"
                  variant="outlined"
                  density="compact"
                  chips
                  clearable
                ></v-combobox>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.topic"
                  label="Thema"
                  placeholder="Geben Sie das konkrete Thema an"
                  prepend-inner-icon="mdi-tag"
                  :error-messages="v$.topic.$errors.map((e) => e.$message)"
                  @blur="v$.topic.$touch()"
                  variant="outlined"
                  density="compact"
                  clearable
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="form.description"
                  label="Detaillierte Beschreibung (optional)"
                  placeholder="Beschreiben Sie das Thema genauer, um bessere Ergebnisse zu erhalten..."
                  prepend-inner-icon="mdi-text-box-outline"
                  variant="outlined"
                  rows="3"
                  auto-grow
                  density="compact"
                ></v-textarea>
              </v-col>
            </v-row>
            <v-alert
              v-if="
                (v$.subject.$invalid || v$.topic.$invalid) &&
                (v$.subject.$dirty || v$.topic.$dirty)
              "
              type="error"
              variant="tonal"
              class="mt-4"
              density="compact"
            >
              Bitte füllen Sie alle erforderlichen Felder in diesem Schritt aus,
              bevor Sie fortfahren.
            </v-alert>
          </v-container>
        </div>
        <div v-else-if="currentStep === 3">
          <!-- Schritt 3 Inhalt -->
          <v-container fluid>
            <v-row>
              <v-col cols="12">
                <h3 class="text-h6 mb-4">CLIL-Parameter</h3>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.languageLevel"
                  :items="languageLevels"
                  label="Sprachniveau"
                  prepend-inner-icon="mdi-translate"
                  variant="outlined"
                  density="compact"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-slider
                  v-model="form.vocabPercentage"
                  :min="10"
                  :max="50"
                  :step="5"
                  label="Fachvokabular-Anteil (% der Schlüsselwörter)"
                  color="primary"
                  thumb-label="always"
                  show-ticks="always"
                  :ticks="{
                    10: '10%',
                    20: '20%',
                    30: '30%',
                    40: '40%',
                    50: '50%',
                  }"
                >
                  <template v-slot:append>
                    <v-chip size="small" color="primary" label>
                      {{ form.vocabPercentage }}%
                    </v-chip>
                  </template>
                </v-slider>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="form.contentFocus"
                  :items="contentFocusOptions"
                  label="Inhaltlicher Fokus"
                  prepend-inner-icon="mdi-target"
                  variant="outlined"
                  density="compact"
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="form.includeVocabList"
                  color="primary"
                  label="Vokabelliste am Ende hinzufügen"
                  hide-details
                  inset
                ></v-switch>
              </v-col>
            </v-row>
          </v-container>
        </div>
        <div v-else-if="currentStep === 4">
          <!-- Schritt 4 Inhalt -->
          <v-container fluid>
            <v-row>
              <v-col cols="12">
                <h3 class="text-h6 mb-4">Prompt anpassen (optional)</h3>
                <v-alert
                  color="info"
                  variant="tonal"
                  icon="mdi-information-outline"
                  class="mb-4 text-body-2"
                  density="compact"
                >
                  Sie können den generierten Prompt anpassen und/oder ein spezifisches Model auswählen. Beide Schritte sind optional. 
                  Wenn Sie keine Änderungen wünschen, klicken Sie einfach auf 'Weiter'.
                </v-alert>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="form.model"
                  :items="availableModels"
                  label="LLM-Modell"
                  prepend-inner-icon="mdi-brain"
                  variant="outlined"
                  density="compact"
                  :loading="loadingModels"
                  :disabled="loadingModels"
                  hint="Wählen Sie ein Modell für die Generierung"
                  persistent-hint
                  class="mb-4"
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="form.useDocumentContext"
                  color="primary"
                  label="Kontext aus hochgeladenen Dokumenten verwenden"
                  hide-details
                  inset
                ></v-switch>
                <v-alert
                  v-if="form.useDocumentContext"
                  color="info"
                  variant="tonal"
                  icon="mdi-file-document-check-outline"
                  class="mt-2 text-body-2"
                  density="compact"
                >
                  Relevante Abschnitte aus Ihren hochgeladenen Dokumenten
                  (Fach: <strong>{{ form.subject || '—' }}</strong>) werden als
                  zusätzlicher Kontext für die Generierung verwendet.
                </v-alert>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="generatedPrompt"
                  label="Generierter Prompt"
                  prepend-inner-icon="mdi-code-braces"
                  variant="outlined"
                  rows="10"
                  auto-grow
                  :readonly="!editPrompt"
                ></v-textarea>
                <v-btn
                  variant="text"
                  size="small"
                  @click="editPrompt = !editPrompt"
                >
                  <v-icon start>{{
                    editPrompt ? "mdi-lock-open-outline" : "mdi-pencil-outline"
                  }}</v-icon>
                  {{ editPrompt ? "Bearbeitung sperren" : "Prompt bearbeiten" }}
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </div>
        <div v-else-if="currentStep === 5">
          <!-- Schritt 5 Inhalt -->
          <v-container fluid>
            <v-row justify="center">
              <v-col cols="12" md="8">
                <h3 class="text-h6 mb-4 text-center">
                  Zusammenfassung & Generierung
                </h3>
                <v-card variant="outlined" class="mb-4">
                  <v-list lines="two" density="compact">
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon color="primary">mdi-file-outline</v-icon>
                      </template>
                      <v-list-item-title>Material-Typ</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ getMaterialTypeName(form.type) }}
                      </v-list-item-subtitle>
                    </v-list-item>
                    <v-divider inset></v-divider>
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon color="primary">mdi-book-open-variant</v-icon>
                      </template>
                      <v-list-item-title>Fach & Thema</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ form.subject }}: {{ form.topic }}
                      </v-list-item-subtitle>
                    </v-list-item>
                    <v-divider inset></v-divider>
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon color="primary">mdi-translate</v-icon>
                      </template>
                      <v-list-item-title>CLIL-Parameter</v-list-item-title>
                      <v-list-item-subtitle>
                        Sprachniveau: {{ form.languageLevel }}, Fachvokabular:
                        {{ form.vocabPercentage }}%
                      </v-list-item-subtitle>
                    </v-list-item>
                    <template v-if="form.useDocumentContext">
                      <v-divider inset></v-divider>
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon color="primary">mdi-file-document-check-outline</v-icon>
                        </template>
                        <v-list-item-title>Dokumentkontext</v-list-item-title>
                        <v-list-item-subtitle>
                          Kontext aus hochgeladenen Dokumenten wird verwendet
                        </v-list-item-subtitle>
                      </v-list-item>
                    </template>
                  </v-list>
                </v-card>
                <div class="text-center">
                  <v-btn
                    color="primary"
                    @click="generateMaterial"
                    :loading="generating"
                    :disabled="generating || !canGenerate"
                    size="large"
                    class="mt-4"
                  >
                    <v-icon start>mdi-creation</v-icon>
                    Material generieren
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </div>
      </v-card-text>

      <!-- Actions sind jetzt im Stepper -->
      <v-card-actions class="pa-4">
        <v-btn v-if="currentStep > 1" variant="text" @click="prevStep">
          <v-icon start>mdi-arrow-left</v-icon>
          Zurück
        </v-btn>

        <v-spacer></v-spacer>

        <v-btn
          v-if="currentStep < steps.length"
          color="primary"
          variant="flat"
          @click="nextStep"
          :disabled="!canProceed"
        >
          Weiter
          <v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="previewDialog" max-width="900px" persistent scrollable>
      <v-card>
        <v-toolbar color="primary" density="compact">
          <v-toolbar-title class="text-subtitle-1">
            <v-icon start>mdi-eye-outline</v-icon>
            Vorschau: {{ form.topic }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="previewDialog = false"
            ><v-icon>mdi-close</v-icon></v-btn
          >
        </v-toolbar>

        <v-card-text style="max-height: 70vh">
          <div v-if="generationError" class="mb-4">
            <v-alert type="error" variant="tonal">
              Fehler bei der Generierung: {{ generationError }}
            </v-alert>
          </div>
          <div
            v-if="generatedMaterial?.metadata"
            class="text-caption text-grey mb-2"
          >
            Generierungszeit:
            {{ generatedMaterial.metadata.generationTime.toFixed(1) }}s |
            Tokens: {{ generatedMaterial.metadata.tokensUsed }} | Modell:
            {{ generatedMaterial.metadata.model }}
          </div>

          <v-skeleton-loader
            v-if="generating && !generatedMaterial"
            type="article, paragraph@3"
          ></v-skeleton-loader>

          <div
            v-else-if="generatedMaterial"
            v-html="generatedMaterial.content"
            class="preview-content"
          ></div>

          <!-- Quellen aus RAG-Kontext -->
          <div v-if="generatedMaterial?.sources?.length > 0" class="mt-4 px-4 pb-2">
            <v-divider class="mb-3" />
            <div class="text-subtitle-2 font-weight-bold mb-2">
              <v-icon size="small" class="mr-1">mdi-link-variant</v-icon>
              Verwendete Quellen ({{ generatedMaterial.sources.length }})
            </div>
            <v-list density="compact" variant="tonal" rounded>
              <v-list-item v-for="(source, i) in generatedMaterial.sources" :key="i">
                <template #prepend>
                  <v-avatar size="24" color="primary" variant="tonal" class="mr-2">
                    <span class="text-caption">{{ source.ref_number || i + 1 }}</span>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-body-2 font-weight-medium">
                  {{ source.filename }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  <span v-if="source.page_number">Seite {{ source.page_number }}</span>
                  <span v-else>Abschnitt {{ (source.chunk_index || 0) + 1 }}</span>
                  <span v-if="source.score"> · Relevanz: {{ (source.score * 100).toFixed(0) }}%</span>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions>
          <v-btn
            variant="text"
            @click="regenerateMaterial"
            :loading="generating"
            :disabled="generating"
          >
            <v-icon start>mdi-refresh</v-icon>
            Erneut generieren
          </v-btn>
          <v-btn
            variant="text"
            @click="
              previewDialog = false;
              currentStep = 4;
            "
            :disabled="generating"
          >
            <v-icon start>mdi-pencil-outline</v-icon>
            Prompt anpassen
          </v-btn>
          <v-btn
            variant="text"
            @click="handleExport"
            :disabled="!generatedMaterial"
          >
            <v-icon start>mdi-export</v-icon>
            Exportieren
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="previewDialog = false">
            Abbrechen
          </v-btn>
          <v-btn
            color="primary"
            @click="saveMaterial"
            :loading="saving"
            :disabled="generating || saving || !!generationError"
          >
            <v-icon start>mdi-content-save-outline</v-icon>
            Speichern & Bearbeiten
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ExportDialog
      v-model="exportDialog"
      :material-id="generatedMaterial?.id || ''"
      :material="generatedMaterial"
      :metadata="{
        type: form.type,
        subject: form.subject,
        topic: form.topic,
        languageLevel: form.languageLevel,
        vocabPercentage: form.vocabPercentage,
      }"
    />

    <v-snackbar
      v-model="snackbar.show"
      :timeout="5000"
      :color="snackbar.color"
      location="top right"
      multi-line
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false"> Schließen </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, watch, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useVuelidate } from "@vuelidate/core";
import { required, minLength, helpers, between } from "@vuelidate/validators";
import { useMaterialsStore } from "@/stores/materials";
import { useTemplatesStore } from "@/stores/templates";
import { useUIStore } from "@/stores/ui";
import deepinfraApi from "@/services/deepinfra-api";
import ExportDialog from "@/components/ExportDialog.vue";
import { useSubjectStore } from "@/stores/subjects";
import { useNotificationStore } from "@/stores/notifications";

const router = useRouter();
const route = useRoute();
const materialsStore = useMaterialsStore();
const templatesStore = useTemplatesStore();
const subjectStore = useSubjectStore();
const subjects = computed(() => subjectStore.subjectNames());
const uiStore = useUIStore();
const notificationStore = useNotificationStore();

const snackbar = ref({ show: false, message: "", color: "success" });
const exportDialog = ref(false);

// Stepper steps
const steps = [
  { title: "Typ", subtitle: "Material-Typ wählen" },
  { title: "Thema", subtitle: "Fach und Thema" },
  { title: "CLIL", subtitle: "Sprachparameter" },
  { title: "Prompt", subtitle: "Optional anpassen" },
  { title: "Generieren", subtitle: "Optionen & Generierung" },
];

// Form data
const form = ref({
  type: route.query.type || "",
  subject: "",
  topic: "",
  description: "",
  languageLevel: "B1",
  vocabPercentage: 30,
  contentFocus: "balanced",
  includeVocabList: true,
  useDocumentContext: true,
  model: "",
});

// Validation rules
const rules = computed(() => {
  return {
    type: {
      required: helpers.withMessage(
        "Bitte wählen Sie einen Material-Typ.",
        required
      ),
    },
    subject: {
      required: helpers.withMessage("Bitte wählen Sie ein Fach.", required),
    },
    topic: {
      required: helpers.withMessage("Bitte geben Sie ein Thema an.", required),
      minLength: helpers.withMessage(
        "Das Thema muss mindestens 3 Zeichen lang sein.",
        minLength(3)
      ),
    },
    languageLevel: {
      required: helpers.withMessage(
        "Bitte wählen Sie ein Sprachniveau.",
        required
      ),
    },
    vocabPercentage: {
      required: helpers.withMessage(
        "Bitte geben Sie einen Vokabular-Anteil an.",
        required
      ),
      between: helpers.withMessage(
        "Der Vokabular-Anteil muss zwischen 10% und 50% liegen.",
        between(10, 50)
      ),
    },
    contentFocus: {
      required: helpers.withMessage(
        "Bitte wählen Sie einen inhaltlichen Fokus.",
        required
      ),
    },
  };
});

const v$ = useVuelidate(rules, form);

// Material types
const materialTypes = [
  {
    id: "worksheet",
    title: "Arbeitsblatt",
    description: "Übungsblatt mit Aufgaben & Lösungen",
    color: "green",
    icon: "mdi-file-document-outline",
  },
  {
    id: "quiz",
    title: "Quiz",
    description: "Multiple-Choice oder Lückentext",
    color: "blue",
    icon: "mdi-comment-question-outline",
  },
  {
    id: "glossary",
    title: "Glossar",
    description: "Fachwörterbuch mit Definitionen",
    color: "orange",
    icon: "mdi-book-open-page-variant-outline",
  },
  {
    id: "presentation",
    title: "Präsentation",
    description: "Folien für den Unterricht",
    color: "purple",
    icon: "mdi-presentation",
  },
  {
    id: "graphic",
    title: "Grafik",
    description: "Diagramme und Visualisierungen",
    color: "red",
    icon: "mdi-chart-bar",
  },
  {
    id: "video",
    title: "Video-Skript",
    description: "Drehbuch für Lehrvideos",
    color: "grey",
    icon: "mdi-video",
  },
];

// Subject list — imported from @/constants/subjects

// Language levels
const languageLevels = [
  { title: "A1 (Anfänger)", value: "A1" },
  { title: "A2 (Grundlegend)", value: "A2" },
  { title: "B1 (Mittelstufe)", value: "B1" },
  { title: "B2 (Gute Mittelstufe)", value: "B2" },
  { title: "C1 (Fortgeschritten)", value: "C1" },
];

// Content focus options
const contentFocusOptions = [
  { title: "Ausgewogen (Fachinhalt & Sprache)", value: "balanced" },
  { title: "Fokus auf Fachinhalt", value: "content" },
  { title: "Fokus auf Spracherwerb", value: "language" },
];

// State variables
const currentStep = ref(1);
const generatedPrompt = ref("");
const generating = ref(false);
const saving = ref(false);
const previewDialog = ref(false);
const generatedMaterial = ref(null);
const editPrompt = ref(false);
const isGeneratingPrompt = ref(false);
const generationError = ref(null);
const availableModels = ref([]);
const loadingModels = ref(false);
let lastPromptParams = "";

// Computed property to check if current step has validation errors
const hasStepError = (index) => {
  if (index === 0 && v$.value.type.$invalid && v$.value.type.$dirty)
    return true;
  if (
    index === 1 &&
    (v$.value.subject.$invalid || v$.value.topic.$invalid) &&
    (v$.value.subject.$dirty || v$.value.topic.$dirty)
  )
    return true;
  return false;
};

// Computed property to determine if user can proceed to the next step
const canProceed = computed(() => {
  if (currentStep.value === 1) return !v$.value.type.$invalid;
  if (currentStep.value === 2)
    return !v$.value.subject.$invalid && !v$.value.topic.$invalid;
  return true;
});

// Separate property for the generate button
const canGenerate = computed(() => {
  return form.value.type && form.value.subject && form.value.topic;
});

// Helper to get material type name
const getMaterialTypeName = (typeId) => {
  const type = materialTypes.find((t) => t.id === typeId);
  return type ? type.title : typeId;
};

// Select material type
const selectMaterialType = (typeId) => {
  form.value.type = typeId;
  v$.value.type.$touch();
};

// Step navigation
const nextStep = async () => {
  if (currentStep.value === 1) {
    await v$.value.type.$touch();
    if (v$.value.type.$invalid) return;
  } else if (currentStep.value === 2) {
    await v$.value.subject.$touch();
    await v$.value.topic.$touch();
    if (v$.value.subject.$invalid || v$.value.topic.$invalid) return;
  }

  if (currentStep.value < steps.length) {
    currentStep.value++;
    if (currentStep.value === 4) {
      generatePromptText();
    }
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

// Race-Condition-Schutz für Prompt-Generierung
const generatePromptText = async () => {
  if (isGeneratingPrompt.value) return;
  try {
    isGeneratingPrompt.value = true;
    const params = JSON.stringify(form.value);
    lastPromptParams = params;
    if (!form.value.type || !form.value.topic || !form.value.subject) {
      generatedPrompt.value =
        "Bitte füllen Sie die Felder für Typ, Fach und Thema aus, um den Prompt zu generieren.";
      return;
    }
    const promptTemplate = `Erstelle ein ${getMaterialTypeName(
      form.value.type
    )} zum Thema "${form.value.topic}" für das Fach "${
      form.value.subject
    }" mit folgendem CLIL-Ansatz:

- Zielgruppe: Schüler/Studenten mit Sprachniveau ${form.value.languageLevel}
- Fachvokabular: Betone wichtige Fachbegriffe (ca. ${
      form.value.vocabPercentage
    }% der relevanten Termini).
- Fokus: ${
      form.value.contentFocus === "balanced"
        ? "Lege Wert auf ein ausgewogenes Verhältnis zwischen Fachinhalt und sprachlicher Unterstützung."
        : form.value.contentFocus === "content"
        ? "Konzentriere dich primär auf die korrekte Darstellung des Fachinhalts."
        : "Priorisiere den Spracherwerb durch Vereinfachungen und zusätzliche Erklärungen."
    }
${
  form.value.description
    ? `\nZusätzliche Details zum Inhalt:\n${form.value.description}`
    : ""
}
${
  form.value.includeVocabList
    ? `\n- Füge am Ende eine Vokabelliste mit den wichtigsten Fachbegriffen und einfachen Erklärungen hinzu.`
    : ""
}

Struktur und Formatierung:
- Verwende klare Überschriften und Absätze.
- Hebe wichtige Informationen hervor (z.B. durch Fettdruck).
- Integriere, falls passend für den Materialtyp (${getMaterialTypeName(
      form.value.type
    )}), Aufgaben, Fragen oder Beispiele.`;
    // Nur übernehmen, wenn die Parameter noch aktuell sind
    if (lastPromptParams === JSON.stringify(form.value)) {
      generatedPrompt.value = promptTemplate;
    }
  } catch (error) {
    handleError(error, "generatePromptText");
  } finally {
    isGeneratingPrompt.value = false;
  }
};

// Generate material using the mock API
const generateMaterialAction = async () => {
  generating.value = true;
  generatedMaterial.value = null;
  generationError.value = null;

  // Validate form before generating
  const isValid = await v$.value.$validate();
  if (!isValid) {
    handleError(
      new Error(
        "Bitte überprüfen Sie Ihre Eingaben in den vorherigen Schritten."
      )
    );
    generating.value = false;
    return;
  }

  try {
    // Direkt die API verwenden, nicht die Store-Funktion
    // Read citation style from localStorage
    const citationPrefs = JSON.parse(localStorage.getItem('citationFormat') || '{}')
    const response = await deepinfraApi.generateMaterial(form.value.type, {
      topic: form.value.topic,
      prompt: generatedPrompt.value,
      subject: form.value.subject,
      languageLevel: form.value.languageLevel,
      vocabPercentage: form.value.vocabPercentage,
      contentFocus: form.value.contentFocus,
      includeVocabList: form.value.includeVocabList,
      description: form.value.description,
      modelName: form.value.model,
      useDocumentContext: form.value.useDocumentContext,
      citationStyle: citationPrefs.style || 'numbered',
    });

    if (response.success) {
      generatedMaterial.value = response.data;
      previewDialog.value = true;
      notificationStore.add({ title: 'Material generiert', message: `"${form.value.topic}" wurde erstellt`, type: 'success', icon: 'mdi-creation' })
    } else {
      generationError.value =
        response.error || "Unbekannter Fehler bei der Generierung.";
      handleError(`Fehler bei der Generierung: ${generationError.value}`);
    }
  } catch (error) {
    console.error("API Error:", error);
    generationError.value =
      error.message || "Netzwerkfehler oder API nicht erreichbar.";
    handleError(`API Fehler: ${generationError.value}`);
  } finally {
    generating.value = false;
  }
};

const generateMaterial = () => {
  currentStep.value = 5;
  generateMaterialAction();
};

const regenerateMaterial = () => {
  generateMaterialAction();
};

// Export-Dialog
const handleExport = () => {
  if (!generatedMaterial.value) {
    handleError(new Error("Kein Material zum Exportieren verfügbar."));
    return;
  }
  exportDialog.value = true;
};

// Snackbar Feedback
const showFeedback = (message, color = "success") => {
  snackbar.value = { show: true, message, color };
};

// Verbesserte Fehlerbehandlung
const handleError = (error, context = "") => {
  console.error(`Error in ${context}:`, error);
  showFeedback(
    error.message || "Ein unerwarteter Fehler ist aufgetreten.",
    "error"
  );
};

// Nach dem Speichern UI-Store aktualisieren
const saveMaterial = async () => {
  if (!generatedMaterial.value) {
    handleError(
      new Error(
        "Kann Material nicht speichern, da die Generierung fehlgeschlagen ist."
      )
    );
    return;
  }
  saving.value = true;
  try {
    const newMaterialData = {
      // Frontend-orientierte Felder, die der Service dann transformiert
      title: generatedMaterial.value.title || form.value.topic,
      type: form.value.type, // Wird zu materialType
      subject: form.value.subject,
      content: generatedMaterial.value.content, // Wird zu aiResponse & formattedHtml
      languageLevel: form.value.languageLevel,
      vocabPercentage: form.value.vocabPercentage,
      tags: [
        form.value.subject.toLowerCase(),
        form.value.topic.toLowerCase().split(" ")[0],
      ].filter(tag => tag && tag.trim() !== ''), // Filtert leere Tags
      // Zusätzliche Metadaten für spätere Verwendung oder detailliertere Speicherung
      prompt: generatedPrompt.value,
      clilElements: { // Diese sind eher für die interne Logik oder detaillierte Ansichten
        vocabPercentage: form.value.vocabPercentage,
        contentFocus: form.value.contentFocus,
        includeVocabList: form.value.includeVocabList,
      },
    };

    const savedMaterial = await materialsStore.addMaterial(newMaterialData);

    uiStore.setLastCreatedMaterial(savedMaterial.id);
    previewDialog.value = false;
    showFeedback("Material erfolgreich gespeichert!", "success");
    notificationStore.add({ title: 'Material gespeichert', message: `"${form.value.topic}" wurde gespeichert`, type: 'success', icon: 'mdi-content-save' })
    router.push(`/edit/${savedMaterial.id}`);
  } catch (error) {
    console.error('[CreateMaterial.vue] Error in saveMaterial:', error);
    handleError(error, "saveMaterial");
  } finally {
    saving.value = false;
  }
};

// Watch form changes to update the generated prompt in step 4
watch(
  form,
  () => {
    if (currentStep.value >= 4) {
      generatePromptText();
    }
  },
  { deep: true }
);

// Initial prompt generation if returning to step 4
watch(currentStep, (newStep) => {
  if (newStep === 4) {
    generatePromptText();
  }
});

// Initialize form with query parameters from Dashboard
onMounted(async () => {
  // Load available LLM models from RAG service
  loadingModels.value = true;
  try {
    const response = await deepinfraApi.getAvailableModels();
    if (response.success && response.data.length > 0) {
      availableModels.value = response.data;
      // Set first model as default if no model is selected
      if (!form.value.model && availableModels.value.length > 0) {
        form.value.model = availableModels.value[0];
      }
    } else {
      // Fallback to default model
      availableModels.value = ['gpt-4o-mini'];
      form.value.model = 'gpt-4o-mini';
      showFeedback('Konnte keine Modelle laden. Verwende Standard-Modell.', 'warning');
    }
  } catch (error) {
    console.error('Error loading models:', error);
    availableModels.value = ['gpt-4o-mini'];
    form.value.model = 'gpt-4o-mini';
    showFeedback('Fehler beim Laden der Modelle. Verwende Standard-Modell.', 'warning');
  } finally {
    loadingModels.value = false;
  }

  if (route.query.template) {
    try {
      const templateId = route.query.template;
      const template = await templatesStore.getTemplateById(templateId);

      if (template) {
        // Prefill form with template data
        form.value.type = template.type || form.value.type;
        form.value.subject = template.subject || "";
        form.value.languageLevel = template.language?.level || "B1";
        form.value.vocabPercentage = template.language?.vocabPercentage || 30;

        // If a type was provided in the URL, prioritize it over the template
        if (route.query.type) {
          form.value.type = route.query.type;
        }
      }
    } catch (error) {
      console.error("Error loading template:", error);
      handleError(new Error("Vorlage konnte nicht geladen werden."));
    }
  }
});
</script>

<style scoped>
.v-stepper-header {
  overflow: visible;
}
.v-stepper-item::after {
  display: none !important;
}
.v-stepper-item--error .v-stepper-item__avatar {
  background-color: var(--v-theme-error) !important;
}
.preview-content {
  border: 1px solid #eee;
  padding: 16px;
  border-radius: 4px;
  background-color: #f9f9f9;
  max-height: 50vh;
  overflow-y: auto;
}
.preview-content :deep(h1),
.preview-content :deep(h2),
.preview-content :deep(h3) {
  margin-top: 0.75em;
  margin-bottom: 0.5em;
}
.preview-content :deep(p) {
  margin-bottom: 1em;
}
.preview-content :deep(ul),
.preview-content :deep(ol) {
  margin-left: 1em;
  margin-bottom: 1em;
}
.preview-content :deep(li) {
  margin-bottom: 0.5em;
}
.preview-content :deep(pre) {
  background-color: #f0f0f0;
  padding: 0.5em;
  border-radius: 4px;
  margin-bottom: 1em;
  overflow-x: auto;
}
.preview-content :deep(code) {
  font-family: monospace;
  background-color: #f0f0f0;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
}
.preview-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 1em;
}
.preview-content :deep(th),
.preview-content :deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
.preview-content :deep(th) {
  background-color: #f2f2f2;
}
.preview-content :deep(img) {
  max-width: 100%;
  height: auto;
}
</style>
