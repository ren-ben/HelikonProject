<template>
  <div class="material-editor">
    <v-card color="surface" class="mb-3" elevation="1" v-if="editor">
      <v-card-text class="pa-2">
        <!-- Toolbar Section -->
        <div class="d-flex flex-wrap align-center">
          <!-- Formatting Buttons -->
          <v-btn-group variant="outlined" density="compact" class="mr-2 mb-2">
            <v-btn
              icon
              :color="editor.isActive('bold') ? 'primary' : undefined"
              @click="editor.chain().focus().toggleBold().run()"
              :disabled="!editor.can().chain().focus().toggleBold().run()"
            >
              <v-icon>mdi-format-bold</v-icon>
              <v-tooltip activator="parent" location="top">Fett</v-tooltip>
            </v-btn>

            <v-btn
              icon
              :color="editor.isActive('italic') ? 'primary' : undefined"
              @click="editor.chain().focus().toggleItalic().run()"
              :disabled="!editor.can().chain().focus().toggleItalic().run()"
            >
              <v-icon>mdi-format-italic</v-icon>
              <v-tooltip activator="parent" location="top">Kursiv</v-tooltip>
            </v-btn>

            <v-btn
              icon
              :color="editor.isActive('strike') ? 'primary' : undefined"
              @click="editor.chain().focus().toggleStrike().run()"
              :disabled="!editor.can().chain().focus().toggleStrike().run()"
            >
              <v-icon>mdi-format-strikethrough</v-icon>
              <v-tooltip activator="parent" location="top">Durchgestrichen</v-tooltip>
            </v-btn>
          </v-btn-group>

          <!-- Heading Menu -->
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                variant="outlined"
                density="compact"
                :color="headingActive ? 'primary' : undefined"
                class="mr-2 mb-2"
              >
                <v-icon start>mdi-format-header-pound</v-icon>
                {{ currentHeading || 'Text' }}
                <v-icon end>mdi-menu-down</v-icon>
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item
                title="Normaler Text"
                @click="editor.chain().focus().setParagraph().run()"
                :active="editor.isActive('paragraph')"
              ></v-list-item>
              <v-list-item
                v-for="i in 3"
                :key="i"
                :title="`Überschrift ${i}`"
                @click="editor.chain().focus().toggleHeading({ level: i }).run()"
                :active="editor.isActive('heading', { level: i })"
              ></v-list-item>
            </v-list>
          </v-menu>

          <!-- List Buttons -->
          <v-btn-group variant="outlined" density="compact" class="mr-2 mb-2">
            <v-btn
              icon
              :color="editor.isActive('bulletList') ? 'primary' : undefined"
              @click="editor.chain().focus().toggleBulletList().run()"
            >
              <v-icon>mdi-format-list-bulleted</v-icon>
              <v-tooltip activator="parent" location="top">Aufzählung</v-tooltip>
            </v-btn>

            <v-btn
              icon
              :color="editor.isActive('orderedList') ? 'primary' : undefined"
              @click="editor.chain().focus().toggleOrderedList().run()"
            >
              <v-icon>mdi-format-list-numbered</v-icon>
              <v-tooltip activator="parent" location="top">Nummerierte Liste</v-tooltip>
            </v-btn>
          </v-btn-group>

          <!-- Alignment Buttons -->
          <v-btn-group variant="outlined" density="compact" class="mr-2 mb-2">
            <v-btn
              icon
              :color="editor.isActive({ textAlign: 'left' }) ? 'primary' : undefined"
              @click="editor.chain().focus().setTextAlign('left').run()"
            >
              <v-icon>mdi-format-align-left</v-icon>
               <v-tooltip activator="parent" location="top">Links</v-tooltip>
            </v-btn>

            <v-btn
              icon
              :color="editor.isActive({ textAlign: 'center' }) ? 'primary' : undefined"
              @click="editor.chain().focus().setTextAlign('center').run()"
            >
              <v-icon>mdi-format-align-center</v-icon>
               <v-tooltip activator="parent" location="top">Zentriert</v-tooltip>
            </v-btn>

            <v-btn
              icon
              :color="editor.isActive({ textAlign: 'right' }) ? 'primary' : undefined"
              @click="editor.chain().focus().setTextAlign('right').run()"
            >
              <v-icon>mdi-format-align-right</v-icon>
              <v-tooltip activator="parent" location="top">Rechts</v-tooltip>
            </v-btn>
          </v-btn-group>

          <!-- Link Buttons -->
          <v-btn-group variant="outlined" density="compact" class="mr-2 mb-2">
            <v-btn icon @click="setLink">
              <v-icon>mdi-link</v-icon>
              <v-tooltip activator="parent" location="top">Link einfügen/bearbeiten</v-tooltip>
            </v-btn>
            <v-btn icon @click="editor.chain().focus().unsetLink().run()" :disabled="!editor.isActive('link')">
              <v-icon>mdi-link-off</v-icon>
              <v-tooltip activator="parent" location="top">Link entfernen</v-tooltip>
            </v-btn>
          </v-btn-group>

          <!-- Table Buttons -->
          <v-btn-group variant="outlined" density="compact" class="mr-2 mb-2">
            <v-btn icon @click="insertTable">
              <v-icon>mdi-table-plus</v-icon>
               <v-tooltip activator="parent" location="top">Tabelle einfügen</v-tooltip>
            </v-btn>
             <v-menu v-if="editor.isActive('table')">
              <template v-slot:activator="{ props }">
                <v-btn icon v-bind="props">
                  <v-icon>mdi-table-edit</v-icon>
                  <v-tooltip activator="parent" location="top">Tabelle bearbeiten</v-tooltip>
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item title="Zeile darüber" @click="editor.chain().focus().addRowBefore().run()" prepend-icon="mdi-table-row-plus-before"></v-list-item>
                <v-list-item title="Zeile darunter" @click="editor.chain().focus().addRowAfter().run()" prepend-icon="mdi-table-row-plus-after"></v-list-item>
                <v-list-item title="Spalte links" @click="editor.chain().focus().addColumnBefore().run()" prepend-icon="mdi-table-column-plus-before"></v-list-item>
                <v-list-item title="Spalte rechts" @click="editor.chain().focus().addColumnAfter().run()" prepend-icon="mdi-table-column-plus-after"></v-list-item>
                <v-divider></v-divider>
                <v-list-item title="Zeile löschen" @click="editor.chain().focus().deleteRow().run()" prepend-icon="mdi-table-row-remove"></v-list-item>
                <v-list-item title="Spalte löschen" @click="editor.chain().focus().deleteColumn().run()" prepend-icon="mdi-table-column-remove"></v-list-item>
                 <v-divider></v-divider>
                <v-list-item title="Kopfzeile umschalten" @click="editor.chain().focus().toggleHeaderRow().run()" prepend-icon="mdi-table-row"></v-list-item>
                 <v-divider></v-divider>
                <v-list-item title="Tabelle löschen" @click="editor.chain().focus().deleteTable().run()" prepend-icon="mdi-table-remove" base-color="error"></v-list-item>
              </v-list>
            </v-menu>
          </v-btn-group>

          <!-- CLIL Buttons -->
          <v-btn-group variant="outlined" density="compact" class="mr-2 mb-2">
            <v-btn
                icon
                :color="editor.isActive('vocabHighlight') ? 'success' : undefined"
                @click="toggleVocabHighlight"
            >
              <v-icon>mdi-format-color-highlight</v-icon>
              <v-tooltip activator="parent" location="top">Vokabel hervorheben</v-tooltip>
            </v-btn>
             <v-btn
                  icon
                  @click="insertLanguageHelp"
             >
              <v-icon>mdi-comment-plus-outline</v-icon>
               <v-tooltip activator="parent" location="top">Sprachhilfe einfügen</v-tooltip>
            </v-btn>
          </v-btn-group>
        </div>
      </v-card-text>
    </v-card>

    <!-- Link Dialog -->
    <v-dialog v-model="linkDialog" max-width="500px">
       <v-card>
        <v-card-title>Link einfügen/bearbeiten</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="linkUrl"
            label="URL"
            placeholder="https://beispiel.de"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-link-variant"
            autofocus
            @keydown.enter="confirmLink"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="linkDialog = false">Abbrechen</v-btn>
          <v-btn color="primary" @click="confirmLink">Einfügen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Language Help Dialog -->
    <v-dialog v-model="languageHelpDialog" max-width="500px">
      <v-card>
        <v-card-title>Sprachliche Hilfe einfügen</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="languageHelpTitle"
            label="Titel (optional)"
            placeholder="Hilfreiche Phrasen"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-format-title"
            class="mb-3"
          ></v-text-field>
          <v-textarea
            v-model="languageHelpContent"
            label="Inhalt"
            placeholder="Liste der Hilfestellungen oder Erklärungen..."
            variant="outlined"
            rows="4"
            auto-grow
            prepend-inner-icon="mdi-text-box-outline"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="languageHelpDialog = false">Abbrechen</v-btn>
          <v-btn color="primary" @click="confirmLanguageHelp">Einfügen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Editor Content -->
    <v-card elevation="1" class="editor-card">
      <v-card-text class="pa-0">
         <div :class="['editor-wrapper', {'editor-focused': editorFocused}]">
            <editor-content :editor="editor" />
         </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import Link from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';

// Custom extensions
import VocabHighlight from './extensions/VocabHighlight';
import LanguageHelp from './extensions/LanguageHelp';

const props = defineProps({
  modelValue: { // Use modelValue for v-model binding
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'save-status']);

// Editor state
const editorFocused = ref(false);

// Dialog state
const linkDialog = ref(false);
const linkUrl = ref('');
const languageHelpDialog = ref(false);
const languageHelpTitle = ref('');
const languageHelpContent = ref('');

// Initialize TipTap editor
const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
        // Disable extensions if needed, e.g., heading levels
        heading: {
            levels: [1, 2, 3],
        },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
      },
    }),
    CharacterCount,
    Placeholder.configure({
        placeholder: 'Beginnen Sie hier mit der Eingabe Ihres Materials...',
    }),
    // Custom extensions
    VocabHighlight,
    LanguageHelp,
  ],
  onFocus: () => { editorFocused.value = true; },
  onBlur: () => { editorFocused.value = false; },
  onUpdate: ({ editor }) => {
    // Emit update event for v-model
    emit('update:modelValue', editor.getHTML());
  },
});

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (editor.value && editor.value.getHTML() !== newValue) {
    editor.value.commands.setContent(newValue, false); // false to avoid triggering update event
  }
});

// Cleanup editor on unmount
onBeforeUnmount(() => {
  editor.value?.destroy();
});

// Computed properties for toolbar state
const headingActive = computed(() => {
  if (!editor.value) return false;
  return [1, 2, 3].some(level => editor.value.isActive('heading', { level }));
});

const currentHeading = computed(() => {
    if (!editor.value) return 'Text';
    if (editor.value.isActive('heading', { level: 1 })) return 'Überschrift 1';
    if (editor.value.isActive('heading', { level: 2 })) return 'Überschrift 2';
    if (editor.value.isActive('heading', { level: 3 })) return 'Überschrift 3';
    return 'Text';
});

// Link handling
const setLink = () => {
  const previousUrl = editor.value.getAttributes('link').href;
  linkUrl.value = previousUrl || '';
  linkDialog.value = true;
  // Focus input after dialog opens
  nextTick(() => {
      const input = document.querySelector('.v-dialog--active input');
      input?.focus();
  });
};

const confirmLink = () => {
  const url = linkUrl.value.trim();
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run();
  } else {
    // Ensure URL has a protocol
    const formattedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    editor.value.chain().focus().extendMarkRange('link').setLink({ href: formattedUrl }).run();
  }
  linkDialog.value = false;
  linkUrl.value = ''; // Reset for next time
};

// Table operations
const insertTable = () => {
  editor.value.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
};

// CLIL-specific tools
const toggleVocabHighlight = () => {
  editor.value.chain().focus().toggleVocabHighlight().run();
};

const insertLanguageHelp = () => {
  languageHelpTitle.value = ''; // Reset fields
  languageHelpContent.value = '';
  languageHelpDialog.value = true;
};

const confirmLanguageHelp = () => {
  // Basic validation: Ensure content is not empty
  if (languageHelpContent.value.trim()) {
    editor.value.chain().focus().insertLanguageHelp({
        title: languageHelpTitle.value.trim() || 'Sprachliche Hilfe', // Use default if title is empty
        content: languageHelpContent.value // Pass content directly
      }).run();
    languageHelpDialog.value = false;
  } else {
    // Optional: Show an error message if content is required
    console.warn("Language help content cannot be empty.");
  }
};

</script>

<style lang="scss">
/* Editor Wrapper & Focus */
.editor-wrapper {
  border: 1px solid rgba(0, 0, 0, 0.12); // Match Vuetify text field border
  border-radius: 4px;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

  &:hover {
     border-color: rgba(0, 0, 0, 0.87);
  }
}

.editor-focused {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 1px rgb(var(--v-theme-primary));
}

/* TipTap Editor Content Area */
.tiptap {
  padding: 12px 16px;
  min-height: 300px;
  outline: none;

  > * + * {
    margin-top: 0.75em;
  }

  ul,
  ol {
    padding: 0 1rem;
  }

  h1, h2, h3 {
    line-height: 1.1;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }
  h1 { font-size: 1.8em; }
  h2 { font-size: 1.4em; }
  h3 { font-size: 1.2em; }

  code {
    background-color: rgba(#616161, 0.1);
    color: #616161;
    padding: 0.2rem 0.4rem;
    border-radius: 5px;
    font-size: 0.85em;
  }

  pre {
    background: #0D0D0D;
    color: #FFF;
    font-family: 'JetBrainsMono', monospace;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin: 1em 0;

    code {
      color: inherit;
      padding: 0;
      background: none;
      font-size: 0.8rem;
    }
  }

  blockquote {
    padding-left: 1rem;
    border-left: 3px solid rgba(#0D0D0D, 0.1);
    margin-left: 0;
    margin-right: 0;
  }

  hr {
    border: none;
    border-top: 1px solid rgba(#0D0D0D, 0.1);
    margin: 1.5rem 0;
  }

  /* Table Styling */
  table {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
    margin: 1em 0;
    overflow: hidden;

    td,
    th {
      min-width: 1em;
      border: 1px solid #ced4da;
      padding: 6px 10px;
      vertical-align: top;
      box-sizing: border-box;
      position: relative;

      > * {
        margin-bottom: 0;
      }
    }

    th {
      font-weight: bold;
      text-align: left;
      background-color: #f1f3f5;
    }

    .selectedCell:after {
      z-index: 2;
      position: absolute;
      content: "";
      left: 0; right: 0; top: 0; bottom: 0;
      background: rgba(var(--v-theme-primary-rgb), 0.15);
      pointer-events: none;
    }

    .column-resize-handle {
      position: absolute;
      right: -2px;
      top: 0;
      bottom: -2px;
      width: 4px;
      background-color: #adf;
      pointer-events: none;
    }
  }

  /* Placeholder */
  p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
  }

  /* CLIL Specific Styling */
  .vocab-highlight {
    background-color: rgba(var(--v-theme-success-rgb), 0.15);
    border-bottom: 1px dashed rgb(var(--v-theme-success));
    padding: 0 2px;
    border-radius: 2px;
  }

  .language-help-box {
    background-color: rgba(var(--v-theme-info-rgb), 0.08);
    border-left: 3px solid rgb(var(--v-theme-info));
    padding: 0.75em 1em;
    margin: 1.25em 0;
    border-radius: 4px;

    h4 {
      color: rgb(var(--v-theme-info-darken-1));
      margin-top: 0;
      margin-bottom: 0.5em;
      font-size: 1.05em;
    }

     > div {
         // Style content within the box if needed
         p:last-child {
             margin-bottom: 0;
         }
     }
  }
}

/* Vuetify overrides if necessary */
.v-toolbar {
    .v-btn {
        // Custom button styling for toolbar if needed
    }
}

</style> 