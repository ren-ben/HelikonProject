<template>
  <v-dialog
    v-model="dialog"
    fullscreen
    :scrim="false"
    transition="dialog-bottom-transition"
  >
    <v-card v-if="material">
      <v-toolbar color="primary" dark density="compact">
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title class="text-body-1">Exportieren: {{ material.title }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-items>
          <v-btn
            variant="text"
            @click="exportMaterialAction"
            :disabled="exporting || previewError"
            :loading="exporting"
          >
            Export starten
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>

      <v-row class="fill-height ma-0">
        <!-- Options Column -->
        <v-col cols="12" md="4" lg="3" class="pa-0" style="background-color: #fafafa;">
          <v-sheet class="pa-4 h-100 overflow-y-auto">
            <v-card variant="flat" color="transparent">
              <v-card-item class="mb-2">
                <template v-slot:prepend>
                  <v-icon :color="getColorForType(material.type)" size="large">
                    {{ getIconForType(material.type) }}
                  </v-icon>
                </template>
                <v-card-title class="text-subtitle-1">{{ material.title }}</v-card-title>
                <v-card-subtitle>{{ material.subject }}</v-card-subtitle>
              </v-card-item>

              <v-divider class="my-2"></v-divider>

              <v-card-text class="pa-0">
                <h3 class="text-subtitle-1 mb-3">Format</h3>
                <v-chip-group
                    v-model="formatOption"
                    column
                    mandatory
                    selected-class="text-primary"
                >
                    <v-chip
                        v-for="format in formatOptions"
                        :key="format.value"
                        :value="format.value"
                        filter
                        label
                        class="mb-2 mr-2"
                        size="small"
                    >
                        <v-icon start :color="format.color">{{ format.icon }}</v-icon>
                        {{ format.title }}
                    </v-chip>
                 </v-chip-group>

                <v-divider class="my-4"></v-divider>

                <h3 class="text-subtitle-1 mb-3">Layout</h3>
                <v-select
                  v-model="layoutOption"
                  :items="availableLayouts"
                  item-title="title"
                  item-value="value"
                  label="Layout-Vorlage"
                  variant="outlined"
                  density="comfortable"
                  class="mb-4"
                  hide-details
                >
                  <template v-slot:item="{ item, props }">
                    <v-list-item
                      v-bind="props"
                      :title="item.raw.title"
                      :subtitle="item.raw.description"
                    >
                      <!-- Removed Thumbnail -->
                    </v-list-item>
                  </template>
                </v-select>

                <v-divider class="my-4"></v-divider>

                <h3 class="text-subtitle-1 mb-3">Anpassung</h3>
                <v-row dense>
                    <v-col cols="6">
                        <v-select
                          v-model="colorScheme"
                          :items="colorSchemeOptions"
                          label="Farbschema"
                          variant="outlined"
                          density="comfortable"
                          hide-details
                        ></v-select>
                    </v-col>
                    <v-col cols="6">
                        <v-select
                          v-model="fontFamily"
                          :items="fontOptions"
                          label="Schriftart"
                          variant="outlined"
                          density="comfortable"
                          hide-details
                        ></v-select>
                    </v-col>
                </v-row>

                 <v-checkbox
                  v-model="includeHeader"
                  label="Kopfzeile einschließen"
                  color="primary"
                  hide-details
                  density="compact"
                  class="mt-2"
                ></v-checkbox>
                <v-checkbox
                  v-model="includeFooter"
                  label="Fußzeile einschließen"
                  color="primary"
                  hide-details
                  density="compact"
                  class="mb-2"
                ></v-checkbox>
                <v-text-field
                  v-if="includeHeader || includeFooter"
                  v-model="headerFooterText"
                  label="Kopf-/Fußzeilentext"
                  placeholder="z.B. Schulname, Datum"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  class="mb-4"
                ></v-text-field>

                <v-divider class="my-4"></v-divider>

                <h3 class="text-subtitle-1 mb-3">Dateioptionen</h3>
                <v-text-field
                  v-model="finalFilename"
                  label="Dateiname"
                  :placeholder="`${material.title}.${formatOption}`"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  :suffix="'.' + formatOption"
                ></v-text-field>
              </v-card-text>
            </v-card>
          </v-sheet>
        </v-col>

        <!-- Preview Column -->
        <v-col cols="12" md="8" lg="9" class="pa-4">
          <v-card height="100%" class="d-flex flex-column rounded-lg" elevation="2">
            <v-toolbar density="compact" flat color="grey-lighten-2">
                <v-toolbar-title class="text-subtitle-1">
                    <v-icon color="primary" class="mr-2">mdi-eye-outline</v-icon>
                     Vorschau
                 </v-toolbar-title>
                <v-spacer></v-spacer>
                 <v-btn-group variant="outlined" density="compact">
                    <v-btn icon @click="zoomOut" :disabled="previewZoom <= 0.5">
                        <v-icon>mdi-magnify-minus-outline</v-icon>
                    </v-btn>
                    <v-btn text disabled style="min-width: 60px;">
                        {{ Math.round(previewZoom * 100) }}%
                    </v-btn>
                    <v-btn icon @click="zoomIn" :disabled="previewZoom >= 2.0">
                        <v-icon>mdi-magnify-plus-outline</v-icon>
                    </v-btn>
                </v-btn-group>
            </v-toolbar>

            <v-divider></v-divider>

            <v-card-text class="flex-grow-1 pa-0 overflow-auto" style="background-color: #e0e0e0;">
              <!-- Preview Loading -->
              <div v-if="previewLoading" class="d-flex flex-column align-center justify-center h-100">
                <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
                <div class="mt-4 text-body-1">Vorschau wird generiert...</div>
              </div>
              <!-- Preview Error -->
              <div v-else-if="previewError" class="d-flex flex-column align-center justify-center h-100 pa-4 text-center">
                <v-icon color="error" size="64">mdi-alert-circle-outline</v-icon>
                <div class="mt-4 text-h6">Fehler bei der Vorschau</div>
                <p class="text-body-2 my-2">Die Vorschau konnte nicht generiert werden.</p>
                <v-btn color="primary" class="mt-2" @click="generatePreview" size="small">
                  Erneut versuchen
                </v-btn>
              </div>
              <!-- Preview Content -->
              <div v-else-if="previewContent" class="preview-container pa-8">
                <div
                  class="preview-document elevation-5"
                  :class="[`layout-${layoutOption}`, `color-scheme-${colorScheme}`, `font-${fontFamily}`]"
                  :style="{ transform: `scale(${previewZoom})` }"
                  v-html="previewContent"
                ></div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
    <v-card v-else>
        <v-toolbar color="primary" dark density="compact">
            <v-btn icon @click="closeDialog"><v-icon>mdi-close</v-icon></v-btn>
            <v-toolbar-title>Exportieren</v-toolbar-title>
        </v-toolbar>
        <v-card-text class="text-center pa-8">
            <v-alert type="error">Material nicht gefunden.</v-alert>
        </v-card-text>
    </v-card>

    <!-- Snackbars for feedback -->
    <v-snackbar
      v-model="snackbar.show"
      :timeout="snackbar.timeout"
      :color="snackbar.color"
      location="top right"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Schließen</v-btn>
      </template>
    </v-snackbar>

  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive, nextTick } from 'vue';
import { useMaterialsStore } from '@/stores/materials';

const props = defineProps({
  modelValue: Boolean, // Controls dialog visibility
  materialId: {
    type: [String, Number],
    required: false,
    default: ''
  },
  material: {
    type: Object,
    required: false,
    default: null
  }
});

const emit = defineEmits(['update:modelValue']);

// --- Store & Data --- 
const materialsStore = useMaterialsStore();
const materialData = computed(() => {
  if (props.material) return props.material;
  if (!props.materialId) return null;
  
  const id = typeof props.materialId === 'string' ? parseInt(props.materialId) : props.materialId;
  return materialsStore.getMaterialById(id);
});

// --- Dialog State --- 
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// --- Export Options --- 
const formatOption = ref('pdf');
const layoutOption = ref('standard');
const colorScheme = ref('default');
const fontFamily = ref('open-sans');
const includeHeader = ref(true);
const includeFooter = ref(true);
const headerFooterText = ref('');
const filenameBase = ref(''); // Filename without extension

// --- Preview State --- 
const previewZoom = ref(1.0);
const previewLoading = ref(false);
const previewError = ref(false);
const previewContent = ref('');
const previewDebounceTimeout = ref(null);

// --- Export Process State --- 
const exporting = ref(false);
const snackbar = reactive({ show: false, message: '', color: 'success', timeout: 4000 });

// --- Computed Properties --- 

// Available layouts filtered by format
const availableLayouts = computed(() => {
  const layouts = [
    { value: 'standard', title: 'Standard', description: 'Klassisches Layout', formats: ['pdf', 'docx', 'html'] },
    { value: 'minimal', title: 'Minimalistisch', description: 'Reduziertes Design', formats: ['pdf', 'docx', 'html'] },
    // Add type-specific layouts if needed
    { value: 'worksheet', title: 'Arbeitsblatt', description: 'Optimiert für Aufgaben', formats: ['pdf', 'docx'] },
    { value: 'quiz', title: 'Quiz', description: 'Für Frage-Antwort-Formate', formats: ['pdf', 'docx', 'html'] },
  ];
  const available = layouts.filter(l => l.formats.includes(formatOption.value));
  // Reset layout if current selection is not available for the new format
  if (!available.some(l => l.value === layoutOption.value)) {
      layoutOption.value = available[0]?.value || 'standard';
  }
  return available;
});

// Final filename including extension
const finalFilename = computed({
    get: () => filenameBase.value || materialData.value?.title || 'export',
    set: (v) => { filenameBase.value = v; }
});

// --- Static Options --- 
const formatOptions = [
  { value: 'pdf', title: 'PDF', description: 'Dokument', icon: 'mdi-file-pdf-box', color: 'red' },
  { value: 'docx', title: 'Word', description: 'Bearbeitbar', icon: 'mdi-file-word-box', color: 'blue' },
  { value: 'html', title: 'HTML', description: 'Webseite', icon: 'mdi-language-html5', color: 'orange' }
];
const colorSchemeOptions = [
  { title: 'Standard (Blau)', value: 'default' }, { title: 'Neutral (Grau)', value: 'neutral' }, { title: 'Monochrom', value: 'monochrome' }
];
const fontOptions = [
  { title: 'Open Sans', value: 'open-sans' }, { title: 'Roboto', value: 'roboto' }, { title: 'Times New Roman', value: 'times' }, { title: 'Arial', value: 'arial' }
];

// --- Methods --- 

const closeDialog = () => { dialog.value = false; };

const showSnackbar = (message, color = 'success') => {
    snackbar.message = message;
    snackbar.color = color;
    snackbar.show = true;
};

const zoomIn = () => { previewZoom.value = Math.min(2.0, previewZoom.value + 0.1); };
const zoomOut = () => { previewZoom.value = Math.max(0.5, previewZoom.value - 0.1); };

// Helper functions (could be moved to a utils file)
const getIconForType = (type) => {
    const map = { worksheet: 'mdi-file-document-outline', quiz: 'mdi-comment-question-outline', glossary: 'mdi-book-open-variant' };
    return map[type] || 'mdi-file-question-outline';
};
const getColorForType = (type) => {
    const map = { worksheet: 'green', quiz: 'blue', glossary: 'orange' };
    return map[type] || 'grey';
};

// Debounced preview generation
const debouncedGeneratePreview = () => {
    if (previewDebounceTimeout.value) clearTimeout(previewDebounceTimeout.value);
    previewDebounceTimeout.value = setTimeout(generatePreview, 500); // Adjust delay as needed
};

// Generate preview (mock)
const generatePreview = async () => {
  if (!materialData.value) return;
  previewLoading.value = true;
  previewError.value = false;
  previewContent.value = '';
  console.log("Generating preview with options:", { format: formatOption.value, layout: layoutOption.value, color: colorScheme.value });

  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));

    // Mock preview content (replace with actual API call)
    // This mock uses the selected options to slightly vary the output
    previewContent.value = `
      <div class="preview-page-inner">
        ${includeHeader.value ? `<div class="preview-header">${headerFooterText.value || materialData.value.title} - Layout: ${layoutOption.value}</div>` : ''}
        <div class="preview-title">${materialData.value.title} (${formatOption.value.toUpperCase()})</div>
        <div class="preview-subtitle">${materialData.value.subject} - Color: ${colorScheme.value} / Font: ${fontFamily.value}</div>
        <div class="preview-content">
          ${materialData.value.content || '<p>Kein Inhalt verfügbar.</p>'}
          <p><em>Vorschau generiert am ${new Date().toLocaleString('de-DE')}</em></p>
        </div>
        ${includeFooter.value ? `<div class="preview-footer">${headerFooterText.value || 'Seite 1'}</div>` : ''}
      </div>
    `;
  } catch (error) {
    console.error('Error generating preview:', error);
    previewError.value = true;
  } finally {
    previewLoading.value = false;
  }
};

// Export material
const exportMaterialAction = async () => {
  if (!materialData.value) return;
  exporting.value = true;
  console.log("Exporting with options:", { format: formatOption.value, layout: layoutOption.value, filename: finalFilename.value });

  try {
    // Erstelle den HTML-Inhalt für den Export mit verbessertem Layout
    const exportContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${materialData.value.title}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: ${fontFamily.value === 'open-sans' ? 'Open Sans, Arial' : fontFamily.value}, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 210mm;
              margin: 0 auto;
              padding: 20mm;
              background: white;
            }
            
            .document-container {
              width: 100%;
              max-width: 170mm; /* A4 width minus margins */
              margin: 0 auto;
            }
            
            .header { 
              text-align: center; 
              margin-bottom: 2em; 
              padding-bottom: 1em;
              border-bottom: 2px solid #ddd;
            }
            
            .title { 
              font-size: 28px; 
              font-weight: bold; 
              margin-bottom: 0.5em;
              color: ${colorScheme.value === 'default' ? '#1976d2' : colorScheme.value === 'neutral' ? '#424242' : '#000'};
              text-align: center;
            }
            
            .subtitle { 
              font-size: 16px; 
              color: #666; 
              margin-bottom: 2em;
              text-align: center;
              font-style: italic;
            }
            
            .content { 
              margin-top: 2em;
              text-align: justify;
              hyphens: auto;
            }
            
            .content h1, .content h2, .content h3 {
              margin-top: 1.5em;
              margin-bottom: 0.8em;
              color: ${colorScheme.value === 'default' ? '#1976d2' : colorScheme.value === 'neutral' ? '#424242' : '#000'};
            }
            
            .content h1 { font-size: 22px; }
            .content h2 { font-size: 18px; }
            .content h3 { font-size: 16px; }
            
            .content p {
              margin-bottom: 1em;
              text-indent: 0;
            }
            
            .content ul, .content ol {
              margin-left: 2em;
              margin-bottom: 1em;
            }
            
            .content li {
              margin-bottom: 0.3em;
            }
            
            .content blockquote {
              margin: 1em 2em;
              padding: 1em;
              background: #f5f5f5;
              border-left: 4px solid ${colorScheme.value === 'default' ? '#1976d2' : '#ccc'};
              font-style: italic;
            }
            
            .content table {
              width: 100%;
              border-collapse: collapse;
              margin: 1em 0;
            }
            
            .content th, .content td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            
            .content th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            
            .footer { 
              text-align: center; 
              margin-top: 3em; 
              padding-top: 1em;
              border-top: 1px solid #ddd;
              font-size: 12px; 
              color: #666; 
            }
            
            .metadata {
              background: #f8f9fa;
              padding: 1em;
              border-radius: 4px;
              margin: 1em 0;
              font-size: 14px;
            }
            
            @media print {
              body { 
                margin: 0;
                padding: 15mm 20mm;
              }
              .document-container {
                max-width: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="document-container">
            ${includeHeader.value ? `<div class="header">${headerFooterText.value || materialData.value.title}</div>` : ''}
            
            
            
            <div class="content">${materialData.value.content || materialData.value.formattedHtml || '<p>Kein Inhalt verfügbar.</p>'}</div>
            
            ${includeFooter.value ? `<div class="footer">${headerFooterText.value || `Erstellt am ${new Date().toLocaleDateString('de-DE')}`}</div>` : ''}
          </div>
        </body>
      </html>
    `;

    let blob;
    let mimeType;

    switch (formatOption.value) {
      case 'pdf':
        // Für PDF verwenden wir jsPDF mit echtem Text (nicht Bild)
        const { jsPDF } = await import('jspdf');
        
        // Hilfsfunktion zum Bereinigen von HTML zu Text
        const htmlToText = (html) => {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          
          // Extrahiere strukturierten Text
          const extractText = (element, level = 0) => {
            let result = [];
            
            for (let child of element.childNodes) {
              if (child.nodeType === Node.TEXT_NODE) {
                const text = child.textContent.trim();
                if (text) {
                  result.push({ type: 'text', content: text, level });
                }
              } else if (child.nodeType === Node.ELEMENT_NODE) {
                const tagName = child.tagName.toLowerCase();
                
                switch (tagName) {
                  case 'h1':
                    result.push({ type: 'heading1', content: child.textContent.trim(), level });
                    break;
                  case 'h2':
                    result.push({ type: 'heading2', content: child.textContent.trim(), level });
                    break;
                  case 'h3':
                    result.push({ type: 'heading3', content: child.textContent.trim(), level });
                    break;
                  case 'p':
                    const pText = child.textContent.trim();
                    if (pText) {
                      result.push({ type: 'paragraph', content: pText, level });
                    }
                    break;
                  case 'li':
                    result.push({ type: 'listitem', content: child.textContent.trim(), level });
                    break;
                  case 'strong':
                  case 'b':
                    result.push({ type: 'bold', content: child.textContent.trim(), level });
                    break;
                  case 'em':
                  case 'i':
                    result.push({ type: 'italic', content: child.textContent.trim(), level });
                    break;
                  case 'br':
                    result.push({ type: 'linebreak', content: '', level });
                    break;
                  default:
                    result.push(...extractText(child, level));
                    break;
                }
              }
            }
            return result;
          };
          
          return extractText(tempDiv);
        };
        
        // Erstelle PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 20;
        const contentWidth = pageWidth - (2 * margin);
        
        let currentY = margin;
        
        // PDF-Schriftarten und -größen
        pdf.setFont('helvetica');
        
        // Hilfsfunktion für Seitenumbruch
        const checkPageBreak = (neededHeight) => {
          if (currentY + neededHeight > pageHeight - margin) {
            pdf.addPage();
            currentY = margin;
          }
        };
        
        // Hilfsfunktion für Textumbruch
        const addTextWithWrap = (text, fontSize, fontStyle = 'normal', color = [0, 0, 0]) => {
          pdf.setFontSize(fontSize);
          pdf.setFont('helvetica', fontStyle);
          pdf.setTextColor(color[0], color[1], color[2]);
          
          const lines = pdf.splitTextToSize(text, contentWidth);
          const lineHeight = fontSize * 0.4;
          
          checkPageBreak(lines.length * lineHeight + 5);
          
          for (let line of lines) {
            pdf.text(line, margin, currentY);
            currentY += lineHeight;
          }
          currentY += 5; // Extra Abstand nach Text
        };
        
        // Header hinzufügen
        if (includeHeader.value) {
          addTextWithWrap(headerFooterText.value || materialData.value.title, 14, 'bold', [100, 100, 100]);
          currentY += 10;
        }
        
        // Titel hinzufügen
        addTextWithWrap(materialData.value.title || 'Untitled', 20, 'bold', [25, 118, 210]);
        
        // Inhalt verarbeiten
        const contentText = materialData.value.content || materialData.value.formattedHtml || '<p>Kein Inhalt verfügbar.</p>';
        const textElements = htmlToText(contentText);
        
        for (let element of textElements) {
          switch (element.type) {
            case 'heading1':
              currentY += 5;
              addTextWithWrap(element.content, 16, 'bold', [25, 118, 210]);
              break;
            case 'heading2':
              currentY += 3;
              addTextWithWrap(element.content, 14, 'bold', [25, 118, 210]);
              break;
            case 'heading3':
              currentY += 2;
              addTextWithWrap(element.content, 12, 'bold', [25, 118, 210]);
              break;
            case 'paragraph':
              addTextWithWrap(element.content, 11, 'normal');
              break;
            case 'listitem':
              addTextWithWrap('• ' + element.content, 11, 'normal');
              break;
            case 'bold':
              addTextWithWrap(element.content, 11, 'bold');
              break;
            case 'italic':
              addTextWithWrap(element.content, 11, 'italic');
              break;
            case 'linebreak':
              currentY += 5;
              break;
            case 'text':
              if (element.content.length > 0) {
                addTextWithWrap(element.content, 11, 'normal');
              }
              break;
          }
        }
        
        // Footer hinzufügen
        if (includeFooter.value) {
          currentY += 20;
          checkPageBreak(15);
          addTextWithWrap(headerFooterText.value || `Erstellt am ${new Date().toLocaleDateString('de-DE')}`, 10, 'normal', [100, 100, 100]);
        }
        
        blob = pdf.output('blob');
        mimeType = 'application/pdf';
        break;

      case 'docx':
        // Erstelle kompatibles RTF-Dokument für Word
        
        // Hilfsfunktion für saubere HTML zu RTF Konvertierung
        const cleanTextForRtf = (html) => {
          return html
            .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n\n\\b\\fs32 $1\\b0\\fs24\n\n')
            .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n\n\\b\\fs28 $1\\b0\\fs24\n\n')
            .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n\n\\b\\fs26 $1\\b0\\fs24\n\n')
            .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n')
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '\\b $1\\b0')
            .replace(/<b[^>]*>(.*?)<\/b>/gi, '\\b $1\\b0')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '\\i $1\\i0')
            .replace(/<i[^>]*>(.*?)<\/i>/gi, '\\i $1\\i0')
            .replace(/<ul[^>]*>/gi, '\n')
            .replace(/<\/ul>/gi, '\n')
            .replace(/<ol[^>]*>/gi, '\n')
            .replace(/<\/ol>/gi, '\n')
            .replace(/<li[^>]*>(.*?)<\/li>/gi, '\n\\bullet $1\n')
            .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '\n\\i "$1"\\i0\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '') // Entferne alle anderen HTML-Tags
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/[{}\\]/g, '') // Entferne RTF-kritische Zeichen
            .replace(/\n\s*\n/g, '\n\\par\n') // Konvertiere doppelte Zeilenumbrüche
            .replace(/\n/g, '\\line ') // Konvertiere einzelne Zeilenumbrüche
            .trim();
        };

        // Einfache, kompatible RTF-Struktur
        const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;} {\\f1 Arial;}}
{\\colortbl;\\red0\\green0\\blue0;\\red25\\green118\\blue210;\\red102\\green102\\blue102;}

\\f1\\fs24

${includeHeader.value ? `\\qc\\b\\fs28 ${(headerFooterText.value || materialData.value.title || '').replace(/[{}\\]/g, '')}\\b0\\fs24\\par\\par` : ''}

\\qc\\b\\fs36\\cf2 ${(materialData.value.title || 'Untitled').replace(/[{}\\]/g, '')}\\b0\\fs24\\par

\\qc\\i\\fs22\\cf3 ${(materialData.value.subject || 'Kein Fach').replace(/[{}\\]/g, '')} - ${(materialData.value.type || 'Material').replace(/[{}\\]/g, '')}\\i0\\fs24\\par\\par

${materialData.value.languageLevel || materialData.value.vocabPercentage ? `
\\ql\\b Metadaten:\\b0\\par
${materialData.value.languageLevel ? `Sprachniveau: ${materialData.value.languageLevel}\\par` : ''}
${materialData.value.vocabPercentage ? `Fachvokabular: ${materialData.value.vocabPercentage}%\\par` : ''}
\\par
` : ''}

\\ql ${cleanTextForRtf(materialData.value.content || materialData.value.formattedHtml || 'Kein Inhalt verfügbar.')}

${includeFooter.value ? `\\par\\par\\qc\\fs18\\cf3 ${(headerFooterText.value || `Erstellt am ${new Date().toLocaleDateString('de-DE')}`).replace(/[{}\\]/g, '')}\\fs24\\par` : ''}

\\par\\qc\\fs16\\cf3 Erstellt mit CLIL Material Management System\\fs24
}`;
        
        blob = new Blob([rtfContent], { type: 'application/rtf' });
        mimeType = 'application/rtf';
        break;

      case 'html':
        blob = new Blob([exportContent], { type: 'text/html' });
        mimeType = 'text/html';
        break;
    }

    // Erstelle Download-Link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${finalFilename.value}.${formatOption.value}`;
    link.click();
    URL.revokeObjectURL(link.href);

    showSnackbar('Export erfolgreich! Download gestartet.', 'success');
  } catch (error) {
    console.error('Error exporting material:', error);
    showSnackbar('Fehler beim Exportieren: ' + error.message, 'error');
  } finally {
    exporting.value = false;
  }
};

// --- Watchers --- 

// Regenerate preview when options change
watch(
    [formatOption, layoutOption, colorScheme, fontFamily, includeHeader, includeFooter, headerFooterText],
    debouncedGeneratePreview,
    { deep: true }
);

// Generate initial preview when dialog opens and material is available
watch(
    () => props.modelValue,
    (newValue) => {
        if (newValue && materialData.value) {
            // Reset options to defaults or load saved preferences if needed
            filenameBase.value = materialData.value.title || 'export';
            headerFooterText.value = materialData.value.title || '';
            nextTick(() => {
                 debouncedGeneratePreview();
            });
        } else if (newValue && !materialData.value) {
             console.error("ExportDialog opened but material not found for ID:", props.materialId);
        }
    }
);

</script>

<style scoped lang="scss">
.preview-container {
  min-height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background-color: #e0e0e0; // Background for the preview area
  padding: 32px;
}

.preview-document {
  background-color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 210mm; /* A4 width */
  aspect-ratio: 210 / 297; /* A4 aspect ratio */
  padding: 15mm 20mm; // Typical A4 margins
  transform-origin: top center;
  transition: transform 0.2s ease-out;
  overflow: hidden; // Prevent content overflow during scaling
  display: flex;
  flex-direction: column;
}

.preview-page-inner {
    flex-grow: 1;
    position: relative; // Needed for absolute header/footer
    font-size: 11pt; // Base font size
    line-height: 1.4;
}

/* Basic styling for preview elements */
.preview-header,
.preview-footer {
  position: absolute;
  left: 20mm;
  right: 20mm;
  font-size: 9pt;
  color: #555;
}
.preview-header { top: 10mm; }
.preview-footer { bottom: 10mm; text-align: center; }

.preview-title {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 0.5em;
  color: #333;
}

.preview-subtitle {
  font-size: 1.1em;
  margin-bottom: 1.5em;
  color: #666;
}

.preview-content {
  flex-grow: 1;
   :deep(h1), :deep(h2), :deep(h3) {
        margin-top: 1.2em;
        margin-bottom: 0.4em;
        font-weight: bold;
    }
    :deep(p) {
        margin-bottom: 0.8em;
    }
    :deep(ul), :deep(ol) {
        padding-left: 2em;
        margin-bottom: 0.8em;
    }
}


.layout-minimal {
    .preview-header, .preview-footer { display: none; }
    .preview-title { font-size: 1.4em; }
}

/* Color schemes (basic examples) */
.color-scheme-default {
    .preview-title { color: rgb(var(--v-theme-primary)); }
}
.color-scheme-neutral {
    .preview-title { color: #424242; }
}
.color-scheme-monochrome {
    * { color: #000 !important; }
    .preview-subtitle { color: #555 !important; }
}

/* Font families */
.font-open-sans { font-family: 'Open Sans', sans-serif; }
.font-roboto { font-family: 'Roboto', sans-serif; }
.font-times { font-family: 'Times New Roman', serif; }
.font-arial { font-family: 'Arial', sans-serif; }

/* Ensure options column scrolls */
.v-sheet {
    max-height: calc(100vh - 48px); /* Adjust based on toolbar height */
}

</style> 