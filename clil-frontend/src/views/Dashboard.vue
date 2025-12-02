<template>
  <div>
    <!-- Begrüßungs-Card -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="1" color="primary" class="text-white pa-4 rounded-lg">
          <v-card-title class="text-h5 font-weight-medium">
            Willkommen zurück<span v-if="profile.name">, {{ profile.name }}</span>!
          </v-card-title>
          <v-card-text class="pb-2">
            <p class="text-body-1">Erstellen Sie CLIL-Unterrichtsmaterialien mit KI-Unterstützung für Ihre Technik-Klassen.</p>
          </v-card-text>
          <v-card-actions>
            <v-btn
              variant="elevated"
              color="white"
              class="text-primary font-weight-bold"
              to="/create"
              size="large"
            >
              <v-icon start>mdi-plus-box</v-icon>
              Neues Material erstellen
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Statistik-Übersicht -->
    <v-row class="mt-4">
      <v-col cols="12" v-if="materialsStore.materials.length === 0 && !loading">
        <v-card elevation="1" class="rounded-lg pa-6 text-center">
          <v-icon size="64" color="primary" class="mb-4">mdi-file-document-plus</v-icon>
          <h3 class="text-h5 mb-2">Noch keine Materialien vorhanden</h3>
          <p class="text-body-1 mb-4">Erstellen Sie Ihr erstes CLIL-Unterrichtsmaterial mit KI-Unterstützung.</p>
          <v-btn
            color="primary"
            size="large"
            to="/create"
            class="px-6"
          >
            <v-icon start>mdi-plus</v-icon>
            Material erstellen
          </v-btn>
        </v-card>
      </v-col>
      <template v-else>
        <v-col
          v-for="(stat, index) in materialStats"
          :key="`stat-${index}`"
          cols="12"
          sm="6"
          md="3"
        >
          <v-card elevation="1" class="rounded-lg fill-height d-flex flex-column">
            <v-card-text class="pa-4 flex-grow-1">
              <div class="d-flex justify-space-between align-start">
                <div>
                  <div class="text-h4 font-weight-bold">
                    <v-skeleton-loader
                      v-if="loading"
                      type="text"
                      width="60"
                      height="40"
                    ></v-skeleton-loader>
                    <template v-else-if="materialsStore.error">
                      <v-icon color="error">mdi-alert-circle</v-icon>
                      Fehler
                    </template>
                    <template v-else>{{ stat.value || 0 }}</template>
                  </div>
                  <div class="text-subtitle-1 text-medium-emphasis">{{ stat.label }}</div>
                </div>
                <v-avatar
                  :color="stat.color + '-lighten-4'" 
                  size="48"
                  class="elevation-0 rounded-circle"
                >
                  <v-icon size="24" :color="stat.color">{{ stat.icon }}</v-icon>
                </v-avatar>
              </div>
              <div
                v-if="stat.trend !== undefined" 
                class="mt-2 text-caption d-flex align-center"
                :class="stat.trend >= 0 ? 'text-success' : 'text-error'"
              >
                <v-icon size="small" :color="stat.trend >= 0 ? 'success' : 'error'">
                  {{ stat.trend >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                </v-icon>
                <span class="ml-1">{{ Math.abs(stat.trend) }}% vs. Vormonat</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </template>
    </v-row>

    <v-row class="mt-4">
      <!-- Schnellzugriff -->
      <v-col cols="12" md="6">
        <v-card elevation="1" class="rounded-lg fill-height">
          <v-card-title class="d-flex align-center text-h6 font-weight-medium">
            <v-icon color="primary" class="mr-2">mdi-flash</v-icon>
            Schnellzugriff
          </v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col
                v-for="(action, index) in quickActions"
                :key="`quick-${index}`"
                cols="6" 
                sm="4"
              >
                <v-card
                  elevation="0"
                  class="pa-3 text-center rounded-lg quick-action-card"
                  :color="action.color + '-lighten-5'"
                  @click="navigateToCreate(action.type, action.templateId)"
                  hover
                >
                  <v-avatar :color="action.color" size="48" class="mb-2 elevation-1">
                    <v-icon color="white">{{ action.icon }}</v-icon>
                  </v-avatar>
                  <div class="text-subtitle-2 font-weight-medium text-high-emphasis">{{ action.title }}</div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Letzte Materialien -->
      <v-col cols="12" md="6">
        <v-card elevation="1" class="rounded-lg fill-height">
          <v-card-title class="d-flex align-center text-h6 font-weight-medium">
            <v-icon color="primary" class="mr-2">mdi-history</v-icon>
            Zuletzt bearbeitet
          </v-card-title>
          <v-list lines="two" v-if="!loading && recentMaterials.length > 0">
            <v-list-item
              v-for="(material, index) in recentMaterials"
              :key="`recent-${material.id}`"
              :to="`/edit/${material.id}`"
              :title="material.title"
              :subtitle="`Typ: ${getMaterialTypeTitle(material.type)} | Geändert: ${material.modified}`"
            >
              <template v-slot:prepend>
                 <v-icon :color="getIconColor(material.type)">{{ getIconForType(material.type) }}</v-icon>
              </template>
              <template v-slot:append>
                <v-btn
                  icon
                  variant="text"
                  color="grey"
                  :to="`/edit/${material.id}`"
                  density="comfortable"
                >
                  <v-icon>mdi-pencil-outline</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
          <v-card-text v-else-if="loading" class="text-center">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-2">Lade Materialien...</p>
          </v-card-text>
          <v-card-text v-else class="text-center text-medium-emphasis">
            Keine kürzlich bearbeiteten Materialien gefunden.
          </v-card-text>

          <v-card-actions v-if="!loading && recentMaterials.length > 0">
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="text"
              to="/materials"
              class="font-weight-bold"
            >
              Alle Materialien
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMaterialsStore } from '@/stores/materials';
import { useTemplatesStore } from '@/stores/templates';
import { useUIStore } from '@/stores/ui';
import { 
  getIconForType, 
  getIconColor, 
  getMaterialTypeTitle,
  formatDate,
  calculateMaterialStats,
  MATERIAL_TYPES
} from '@/utils/materialUtils';

const router = useRouter();
const materialsStore = useMaterialsStore();
const templatesStore = useTemplatesStore();
const uiStore = useUIStore();
// Dummy-Profil (kann später aus Auth-Store kommen)
const profile = { name: 'Max Mustermann' };

// Ladezustände
const loading = computed(() => materialsStore.loading || templatesStore.loading);

// Material-Statistiken
const materialStats = computed(() => {
  const stats = calculateMaterialStats(materialsStore.materials);
  return [
    { 
      label: 'Materialien Gesamt', 
      value: stats.total, 
      trend: 5, 
      color: 'primary', 
      icon: 'mdi-folder-text-outline' 
    },
    ...Object.entries(MATERIAL_TYPES).map(([type, config]) => ({
      label: config.title,
      value: stats.byType[type] || 0,
      color: config.color,
      icon: config.icon
    })),
    { 
      label: 'Favoriten', 
      value: stats.favorites, 
      trend: -2, 
      color: 'warning', 
      icon: 'mdi-star-outline' 
    }
  ];
});

// QuickActions aus dem Store
const quickActions = computed(() => {
  const defaultActions = [
    { title: 'Leeres Worksheet', icon: 'mdi-file-document-plus-outline', type: 'worksheet', color: 'green' },
    { title: 'Leeres Quiz', icon: 'mdi-comment-question-outline', type: 'quiz', color: 'blue' },
    { title: 'Glossar erstellen', icon: 'mdi-book-open-page-variant-outline', type: 'glossary', color: 'orange' }
  ];

  const templateActions = templatesStore.recentTemplates.map(template => ({
    title: `Vorlage: ${template.title}`,
    icon: 'mdi-file-star-outline',
    type: template.type,
    templateId: template.id,
    color: MATERIAL_TYPES[template.type]?.color || 'purple'
  }));

  return [...defaultActions, ...templateActions];
});

// Kürzlich bearbeitete Materialien mit formatiertem Datum
const recentMaterials = computed(() => 
  materialsStore.recentMaterials.map(material => ({
    ...material,
    modified: formatDate(material.modified)
  }))
);

// Funktion zum Navigieren zur Erstellungsseite
function navigateToCreate(type, templateId = null) {
  const query = { type };
  if (templateId) {
    query.template = templateId;
  }
  router.push({ name: 'create', query });
}

// Materialien und Templates beim Laden der Komponente abrufen
onMounted(async () => {
  if (materialsStore.materials.length === 0) {
    console.log('Lade Materialien...');
    await materialsStore.fetchMaterials();
    console.log('Materialien geladen:', materialsStore.materials);
  }
  if (templatesStore.templates.length === 0) {
    console.log('Lade Templates...');
    await templatesStore.fetchTemplates();
    console.log('Templates geladen:', templatesStore.templates);
  }
  
  // Debug-Ausgabe für Statistiken
  console.log('Material Stats:', materialStats.value);
});

</script>

<style scoped>
.v-card {
  transition: box-shadow 0.2s ease-in-out;
}
.v-card:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1) !important;
}
.quick-action-card:hover {
   transform: translateY(-2px);
}
</style> 