import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useTemplatesStore = defineStore('templates', () => {
  // State
  const templates = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const recentTemplates = computed(() => {
    return templates.value
      .sort((a, b) => new Date(b.modified) - new Date(a.modified))
      .slice(0, 5);
  });

  const templatesByType = computed(() => {
    return templates.value.reduce((acc, template) => {
      if (!acc[template.type]) {
        acc[template.type] = [];
      }
      acc[template.type].push(template);
      return acc;
    }, {});
  });

  // Actions
  async function fetchTemplates() {
    loading.value = true;
    error.value = null;
    
    try {
      // TODO: API-Integration
      // Temporäre Mock-Daten
      templates.value = [
        {
          id: 'tpl-tech-b1',
          title: 'Technik B1',
          type: 'worksheet',
          subject: 'Technik',
          languageLevel: 'B1',
          modified: new Date().toISOString(),
          content: {
            structure: ['Einleitung', 'Hauptteil', 'Aufgaben', 'Lösungen'],
            sections: {
              einleitung: 'Einführung in das Thema',
              hauptteil: 'Detaillierte Erklärungen',
              aufgaben: 'Praktische Übungen',
              loesungen: 'Musterlösungen'
            }
          }
        },
        {
          id: 'tpl-quiz-b2',
          title: 'Quiz B2',
          type: 'quiz',
          subject: 'Allgemein',
          languageLevel: 'B2',
          modified: new Date(Date.now() - 86400000).toISOString(), // Gestern
          content: {
            structure: ['Fragen', 'Antworten'],
            sections: {
              fragen: 'Multiple-Choice Fragen',
              antworten: 'Korrekte Antworten'
            }
          }
        }
      ];
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching templates:', err);
    } finally {
      loading.value = false;
    }
  }

  function getTemplateById(id) {
    return templates.value.find(template => template.id === id);
  }

  return {
    // State
    templates,
    loading,
    error,
    
    // Getters
    recentTemplates,
    templatesByType,
    
    // Actions
    fetchTemplates,
    getTemplateById
  };
}); 