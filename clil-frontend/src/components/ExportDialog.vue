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
            :disabled="exporting"
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
        <v-col cols="12" md="8" lg="9" class="pa-0">
          <div class="preview-area">
            <div class="preview-toolbar">
              <v-icon color="primary" size="small" class="mr-2">mdi-eye-outline</v-icon>
              <span class="text-subtitle-2">Vorschau</span>
              <v-spacer></v-spacer>
              <v-btn-group variant="outlined" density="compact">
                <v-btn icon size="small" @click="zoomOut" :disabled="previewZoom <= 0.5">
                  <v-icon size="small">mdi-magnify-minus-outline</v-icon>
                </v-btn>
                <v-btn text disabled size="small" style="min-width: 50px;">
                  {{ Math.round(previewZoom * 100) }}%
                </v-btn>
                <v-btn icon size="small" @click="zoomIn" :disabled="previewZoom >= 2.0">
                  <v-icon size="small">mdi-magnify-plus-outline</v-icon>
                </v-btn>
              </v-btn-group>
            </div>
            <div class="preview-scroll-area">
              <div
                ref="previewDocRef"
                class="preview-document"
                :class="[`font-${fontFamily}`]"
                :style="{ transform: `scale(${previewZoom})`, transformOrigin: 'top center' }"
              >
                <!-- Header -->
                <div v-if="includeHeader" class="doc-header">
                  {{ headerFooterText || materialData?.title || '' }}
                </div>

                <!-- Title block -->
                <div class="doc-title-block">
                  <div class="doc-title" :style="{ color: accentColor }">{{ materialData?.title }}</div>
                  <div class="doc-meta">
                    <span v-if="materialData?.subject" class="doc-meta-chip" :style="{ background: accentColor + '18', color: accentColor }">{{ materialData.subject }}</span>
                    <span v-if="materialData?.type" class="doc-meta-chip">{{ materialData.type }}</span>
                  </div>
                </div>

                <hr class="doc-divider" :style="{ borderColor: accentColor + '30' }" />

                <!-- Content -->
                <div class="doc-content" v-html="sanitizedContent"></div>

                <!-- Footer -->
                <div v-if="includeFooter" class="doc-footer">
                  {{ headerFooterText || `Erstellt am ${new Date().toLocaleDateString('de-DE')}` }}
                </div>
              </div>
            </div>
          </div>
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
import { ref, computed, watch, reactive, nextTick } from 'vue';
import { useMaterialsStore } from '@/stores/materials';
import DOMPurify from 'dompurify';

const props = defineProps({
  modelValue: Boolean,
  materialId: { type: [String, Number], required: false, default: '' },
  material: { type: Object, required: false, default: null }
});

const emit = defineEmits(['update:modelValue']);

const materialsStore = useMaterialsStore();
const materialData = computed(() => {
  if (props.material) return props.material;
  if (!props.materialId) return null;
  const id = typeof props.materialId === 'string' ? parseInt(props.materialId) : props.materialId;
  return materialsStore.getMaterialById(id);
});

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// --- Options ---
const formatOption = ref('pdf');
const colorScheme = ref('default');
const fontFamily = ref('open-sans');
const includeHeader = ref(true);
const includeFooter = ref(true);
const headerFooterText = ref('');
const filenameBase = ref('');

// --- Preview ---
const previewZoom = ref(0.9);
const previewDocRef = ref(null);

// --- Export ---
const exporting = ref(false);
const snackbar = reactive({ show: false, message: '', color: 'success', timeout: 4000 });

// --- Computed ---
const accentColor = computed(() => {
  if (colorScheme.value === 'default') return '#3f51b5';
  if (colorScheme.value === 'neutral') return '#546e7a';
  return '#333333';
});

const finalFilename = computed({
  get: () => filenameBase.value || materialData.value?.title || 'export',
  set: (v) => { filenameBase.value = v; }
});

// Sanitize content: strip markdown code fences + AI trailing commentary
const sanitizedContent = computed(() => {
  let html = materialData.value?.content || materialData.value?.formattedHtml || '<p>Kein Inhalt verfügbar.</p>';

  // Strip leading ```html or ``` wrapper
  html = html.replace(/^\s*```\s*html?\s*/i, '');
  // Strip trailing ``` and any AI commentary after it
  const closingFence = html.lastIndexOf('```');
  if (closingFence !== -1) {
    html = html.substring(0, closingFence);
  }

  return DOMPurify.sanitize(html.trim());
});

// --- Static Options ---
const formatOptions = [
  { value: 'pdf', title: 'PDF', icon: 'mdi-file-pdf-box', color: 'red' },
  { value: 'html', title: 'HTML', icon: 'mdi-language-html5', color: 'orange' }
];
const colorSchemeOptions = [
  { title: 'Standard (Blau)', value: 'default' },
  { title: 'Neutral (Grau)', value: 'neutral' },
  { title: 'Monochrom', value: 'monochrome' }
];
const fontOptions = [
  { title: 'Open Sans', value: 'open-sans' },
  { title: 'Roboto', value: 'roboto' },
  { title: 'Times New Roman', value: 'times' },
  { title: 'Arial', value: 'arial' }
];

// --- Methods ---
const closeDialog = () => { dialog.value = false; };
const showSnackbar = (msg, color = 'success') => { snackbar.message = msg; snackbar.color = color; snackbar.show = true; };
const zoomIn = () => { previewZoom.value = Math.min(2.0, previewZoom.value + 0.1); };
const zoomOut = () => { previewZoom.value = Math.max(0.5, previewZoom.value - 0.1); };

const getIconForType = (type) => {
  const map = { worksheet: 'mdi-file-document-outline', quiz: 'mdi-comment-question-outline', glossary: 'mdi-book-open-variant' };
  return map[type] || 'mdi-file-question-outline';
};
const getColorForType = (type) => {
  const map = { worksheet: 'green', quiz: 'blue', glossary: 'orange' };
  return map[type] || 'grey';
};

const getFontStack = () => {
  const map = {
    'open-sans': "'Open Sans', 'Segoe UI', sans-serif",
    'roboto': "'Roboto', 'Segoe UI', sans-serif",
    'times': "'Times New Roman', 'Georgia', serif",
    'arial': "'Arial', 'Helvetica', sans-serif"
  };
  return map[fontFamily.value] || map['open-sans'];
};

// Build a full styled HTML document for export
const buildExportHtml = () => {
  const accent = accentColor.value;
  const font = getFontStack();
  const content = sanitizedContent.value;
  const title = materialData.value?.title || '';
  const subject = materialData.value?.subject || '';
  const type = materialData.value?.type || '';

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap');

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: ${font};
    font-size: 11pt;
    line-height: 1.7;
    color: #1a1a1a;
    background: #fff;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 48px;
  }

  .doc-header {
    font-size: 9pt;
    color: #888;
    text-align: center;
    padding-bottom: 12px;
    margin-bottom: 24px;
    border-bottom: 1px solid #e5e5e5;
  }

  .doc-title-block { margin-bottom: 16px; }

  .doc-title {
    font-size: 26pt;
    font-weight: 700;
    line-height: 1.2;
    color: ${accent};
    margin-bottom: 10px;
  }

  .doc-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }

  .doc-meta-chip {
    display: inline-block;
    font-size: 8.5pt;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 4px;
    background: #f0f0f0;
    color: #555;
  }

  .doc-divider {
    border: none;
    border-top: 2px solid ${accent}30;
    margin: 20px 0 28px;
  }

  /* --- Content Styles (Notion-like) --- */

  .doc-content h1 {
    font-size: 20pt;
    font-weight: 700;
    color: ${accent};
    margin: 1.4em 0 0.5em;
    padding-bottom: 4px;
    border-bottom: 1px solid ${accent}20;
  }

  .doc-content h2 {
    font-size: 16pt;
    font-weight: 700;
    color: ${accent};
    margin: 1.2em 0 0.4em;
  }

  .doc-content h3 {
    font-size: 13pt;
    font-weight: 600;
    color: #333;
    margin: 1em 0 0.3em;
  }

  .doc-content h4, .doc-content h5, .doc-content h6 {
    font-size: 11pt;
    font-weight: 600;
    color: #444;
    margin: 0.8em 0 0.3em;
  }

  .doc-content p {
    margin-bottom: 0.8em;
  }

  .doc-content ul, .doc-content ol {
    margin: 0.5em 0 1em 1.5em;
  }

  .doc-content li {
    margin-bottom: 0.3em;
  }

  .doc-content li::marker {
    color: ${accent};
  }

  .doc-content strong, .doc-content b {
    font-weight: 700;
    color: #111;
  }

  .doc-content em, .doc-content i {
    font-style: italic;
  }

  .doc-content blockquote {
    margin: 1em 0;
    padding: 12px 16px;
    background: ${accent}08;
    border-left: 3px solid ${accent};
    border-radius: 0 6px 6px 0;
    color: #333;
    font-style: italic;
  }

  .doc-content pre, .doc-content code {
    font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
    font-size: 9.5pt;
  }

  .doc-content code {
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
    color: #c7254e;
  }

  .doc-content pre {
    background: #282c34;
    color: #abb2bf;
    padding: 16px 20px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 1em 0;
    line-height: 1.5;
  }

  .doc-content pre code {
    background: none;
    color: inherit;
    padding: 0;
    border-radius: 0;
  }

  .doc-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
    font-size: 10pt;
  }

  .doc-content th {
    background: ${accent}12;
    color: ${accent};
    font-weight: 700;
    text-align: left;
    padding: 10px 12px;
    border-bottom: 2px solid ${accent}30;
  }

  .doc-content td {
    padding: 8px 12px;
    border-bottom: 1px solid #eee;
    vertical-align: top;
  }

  .doc-content tr:hover td {
    background: #fafafa;
  }

  .doc-content img {
    max-width: 100%;
    border-radius: 6px;
    margin: 1em 0;
  }

  .doc-content hr {
    border: none;
    border-top: 1px solid #e5e5e5;
    margin: 2em 0;
  }

  /* Vocab / highlight boxes */
  .doc-content .vocab-list, .doc-content .vocabulary,
  .doc-content div[class*="vocab"], .doc-content section[class*="vocab"] {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 16px 20px;
    margin: 1.5em 0;
  }

  .doc-footer {
    margin-top: 40px;
    padding-top: 12px;
    border-top: 1px solid #e5e5e5;
    font-size: 9pt;
    color: #888;
    text-align: center;
  }

  @media print {
    body { padding: 15mm 20mm; max-width: none; }
  }
</style>
</head>
<body>
  ${includeHeader.value ? `<div class="doc-header">${headerFooterText.value || title}</div>` : ''}
  <div class="doc-title-block">
    <div class="doc-title">${title}</div>
    <div class="doc-meta">
      ${subject ? `<span class="doc-meta-chip" style="background:${accent}18;color:${accent}">${subject}</span>` : ''}
      ${type ? `<span class="doc-meta-chip">${type}</span>` : ''}
    </div>
  </div>
  <hr class="doc-divider" style="border-color:${accent}30" />
  <div class="doc-content">${content}</div>
  ${includeFooter.value ? `<div class="doc-footer">${headerFooterText.value || `Erstellt am ${new Date().toLocaleDateString('de-DE')}`}</div>` : ''}
</body>
</html>`;
};

// --- Export ---
const exportMaterialAction = async () => {
  if (!materialData.value) return;
  exporting.value = true;

  try {
    switch (formatOption.value) {
      case 'pdf': {
        // Render the styled preview element to canvas, then to multi-page PDF
        const el = previewDocRef.value;
        if (!el) throw new Error('Vorschau-Element nicht gefunden');

        // Temporarily reset zoom for capture
        const origTransform = el.style.transform;
        el.style.transform = 'scale(1)';
        await nextTick();

        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');

        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });

        el.style.transform = origTransform;

        // A4 dimensions in mm
        const pageW = 210;
        const pageH = 297;
        const marginX = 0;
        const marginY = 0;
        const contentW = pageW - 2 * marginX;
        const contentH = pageH - 2 * marginY;

        // Scale canvas to fit A4 width
        const imgW = contentW;
        const imgH = (canvas.height / canvas.width) * imgW;

        const pdf = new jsPDF('p', 'mm', 'a4');
        let yOffset = 0;

        while (yOffset < imgH) {
          if (yOffset > 0) pdf.addPage();

          // Crop a page-sized slice from the canvas
          const sliceH = Math.min(contentH, imgH - yOffset);
          const srcY = (yOffset / imgH) * canvas.height;
          const srcH = (sliceH / imgH) * canvas.height;

          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = srcH;
          const ctx = sliceCanvas.getContext('2d');
          ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

          const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(sliceData, 'JPEG', marginX, marginY, contentW, sliceH);

          yOffset += contentH;
        }

        const blob = pdf.output('blob');
        downloadBlob(blob, `${finalFilename.value}.pdf`);
        break;
      }

      case 'html': {
        const htmlContent = buildExportHtml();
        const blob = new Blob([htmlContent], { type: 'text/html' });
        downloadBlob(blob, `${finalFilename.value}.html`);
        break;
      }
    }

    showSnackbar('Export erfolgreich!', 'success');
  } catch (error) {
    showSnackbar('Fehler beim Exportieren: ' + error.message, 'error');
  } finally {
    exporting.value = false;
  }
};

const downloadBlob = (blob, filename) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

// --- Watchers ---
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && materialData.value) {
      filenameBase.value = materialData.value.title || 'export';
      headerFooterText.value = materialData.value.title || '';
    }
  }
);
</script>

<style scoped lang="scss">
.preview-area {
  height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  background: #e8e8e8;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  padding: 6px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  flex-shrink: 0;
}

.preview-scroll-area {
  flex: 1;
  overflow: auto;
  padding: 32px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.preview-document {
  background: #fff;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.12);
  border-radius: 2px;
  width: 100%;
  max-width: 800px;
  padding: 40px 48px;
  transition: transform 0.15s ease;
}

/* --- Document element styles (mirrors the export CSS) --- */

.doc-header {
  font-size: 9pt;
  color: #888;
  text-align: center;
  padding-bottom: 12px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e5e5;
}

.doc-title-block { margin-bottom: 16px; }

.doc-title {
  font-size: 26pt;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 10px;
}

.doc-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }

.doc-meta-chip {
  display: inline-block;
  font-size: 8.5pt;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 4px;
  background: #f0f0f0;
  color: #555;
}

.doc-divider {
  border: none;
  border-top: 2px solid transparent;
  margin: 20px 0 28px;
}

.doc-content {
  font-size: 11pt;
  line-height: 1.7;
  color: #1a1a1a;

  :deep(h1) {
    font-size: 20pt;
    font-weight: 700;
    margin: 1.4em 0 0.5em;
    padding-bottom: 4px;
  }

  :deep(h2) {
    font-size: 16pt;
    font-weight: 700;
    margin: 1.2em 0 0.4em;
  }

  :deep(h3) {
    font-size: 13pt;
    font-weight: 600;
    color: #333;
    margin: 1em 0 0.3em;
  }

  :deep(h4), :deep(h5), :deep(h6) {
    font-size: 11pt;
    font-weight: 600;
    color: #444;
    margin: 0.8em 0 0.3em;
  }

  :deep(p) { margin-bottom: 0.8em; }

  :deep(ul), :deep(ol) {
    margin: 0.5em 0 1em 1.5em;
  }

  :deep(li) { margin-bottom: 0.3em; }

  :deep(strong), :deep(b) { font-weight: 700; color: #111; }

  :deep(blockquote) {
    margin: 1em 0;
    padding: 12px 16px;
    border-left: 3px solid currentColor;
    border-radius: 0 6px 6px 0;
    background: rgba(0,0,0,0.03);
    font-style: italic;
  }

  :deep(pre) {
    background: #282c34;
    color: #abb2bf;
    padding: 16px 20px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 1em 0;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 9.5pt;
    line-height: 1.5;
  }

  :deep(code) {
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 9.5pt;
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
    color: #c7254e;
  }

  :deep(pre code) {
    background: none;
    color: inherit;
    padding: 0;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
    font-size: 10pt;
  }

  :deep(th) {
    font-weight: 700;
    text-align: left;
    padding: 10px 12px;
    border-bottom: 2px solid #ddd;
    background: #f8f9fa;
  }

  :deep(td) {
    padding: 8px 12px;
    border-bottom: 1px solid #eee;
    vertical-align: top;
  }

  :deep(img) {
    max-width: 100%;
    border-radius: 6px;
    margin: 1em 0;
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid #e5e5e5;
    margin: 2em 0;
  }
}

.doc-footer {
  margin-top: 40px;
  padding-top: 12px;
  border-top: 1px solid #e5e5e5;
  font-size: 9pt;
  color: #888;
  text-align: center;
}

/* Font families */
.font-open-sans { font-family: 'Open Sans', 'Segoe UI', sans-serif; }
.font-roboto { font-family: 'Roboto', 'Segoe UI', sans-serif; }
.font-times { font-family: 'Times New Roman', 'Georgia', serif; }
.font-arial { font-family: 'Arial', 'Helvetica', sans-serif; }

/* Options column scroll */
.v-sheet {
  max-height: calc(100vh - 48px);
}
</style>
