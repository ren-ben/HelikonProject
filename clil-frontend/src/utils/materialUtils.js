import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Materialtypen-Konfiguration
export const MATERIAL_TYPES = {
  Arbeitsblatt: {
    title: 'Arbeitsblatt',
    icon: 'mdi-file-document-outline',
    color: 'success',
    description: 'Übungsblatt mit Aufgaben & Lösungen'
  },
  Quiz: {
    title: 'Quiz',
    icon: 'mdi-help-circle-outline',
    color: 'info',
    description: 'Multiple-Choice oder Lückentext'
  },
  Glossar: {
    title: 'Glossar',
    icon: 'mdi-book-open-variant',
    color: 'warning',
    description: 'Fachwörterbuch mit Definitionen'
  },
  Präsentation: {
    title: 'Präsentation',
    icon: 'mdi-presentation',
    color: 'purple',
    description: 'Folien für den Unterricht'
  },
  Grafik: {
    title: 'Grafik',
    icon: 'mdi-chart-bar',
    color: 'red',
    description: 'Diagramme und Visualisierungen'
  },
  'Video-Skript': {
    title: 'Video-Skript',
    icon: 'mdi-video',
    color: 'grey',
    description: 'Drehbuch für Lehrvideos'
  }
};

// Hilfsfunktionen für Materialtypen
export function getMaterialTypeConfig(type) {
  const englishToGerman = {
    'worksheet': 'Arbeitsblatt',
    'quiz': 'Quiz',
    'glossary': 'Glossar',
    'presentation': 'Präsentation',
    'graphic': 'Grafik',
    'video': 'Video-Skript'
  };

  const normalizedType = englishToGerman[type] || type;
  return MATERIAL_TYPES[normalizedType] || {
    title: type,
    icon: 'mdi-file-outline',
    color: 'grey',
    description: 'Unbekannter Materialtyp'
  };
}

export function getIconForType(type) {
  return getMaterialTypeConfig(type).icon;
}

export function getIconColor(type) {
  return getMaterialTypeConfig(type).color;
}

export function getMaterialTypeTitle(type) {
  return getMaterialTypeConfig(type).title;
}

// Datumsformatierung
export function formatDate(date, formatString = 'dd.MM.yyyy HH:mm') {
  if (!date) return '';
  return format(new Date(date), formatString, { locale: de });
}

// Statistik-Berechnung
export function calculateMaterialStats(materials) {
  const stats = {
    total: materials.length,
    byType: {},
    favorites: materials.filter(m => m.favorite).length
  };

  // Zähle Materialien nach Typ
  Object.keys(MATERIAL_TYPES).forEach(type => {
    stats.byType[type] = materials.filter(m => m.type === type).length;
  });

  return stats;
} 