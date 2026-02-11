import { defineStore } from 'pinia';
import { ref } from 'vue';

const _defaultCitation = {
  style: 'numbered',       // 'numbered' | 'apa' | 'simple' | 'none'
  showRelevanceScore: true,
  showSnippets: true,
  inlineCitations: true,
};

function _loadCitation() {
  try {
    const raw = localStorage.getItem('citationFormat');
    return raw ? { ..._defaultCitation, ...JSON.parse(raw) } : { ..._defaultCitation };
  } catch { return { ..._defaultCitation }; }
}

export const useUIStore = defineStore('ui', () => {
  // State
  const lastCreatedMaterial = ref(null);
  const lastEditedMaterial = ref(null);
  const currentTheme = ref('light');
  const sidebarExpanded = ref(true);
  const citationFormat = ref(_loadCitation());

  // Actions
  function setLastCreatedMaterial(materialId) {
    lastCreatedMaterial.value = materialId;
  }

  function setLastEditedMaterial(materialId) {
    lastEditedMaterial.value = materialId;
  }

  function toggleTheme() {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light';
  }

  function toggleSidebar() {
    sidebarExpanded.value = !sidebarExpanded.value;
  }

  function setCitationFormat(updates) {
    citationFormat.value = { ...citationFormat.value, ...updates };
    localStorage.setItem('citationFormat', JSON.stringify(citationFormat.value));
  }

  return {
    // State
    lastCreatedMaterial,
    lastEditedMaterial,
    currentTheme,
    sidebarExpanded,
    citationFormat,

    // Actions
    setLastCreatedMaterial,
    setLastEditedMaterial,
    toggleTheme,
    toggleSidebar,
    setCitationFormat,
  };
});
