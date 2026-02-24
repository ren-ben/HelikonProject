<template>
  <div class="monaco-editor-wrapper">
    <v-card elevation="1">
      <v-card-text class="pa-0">
        <div ref="editorContainer" class="editor-container"></div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as monaco from 'monaco-editor';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'markdown' // or 'plaintext'
  }
});

const emit = defineEmits(['update:modelValue']);

const editorContainer = ref(null);
let editor = null;

onMounted(() => {
  if (editorContainer.value) {
    editor = monaco.editor.create(editorContainer.value, {
      value: props.modelValue,
      language: props.language,
      theme: 'vs-light',
      automaticLayout: true,
      wordWrap: 'on',
      minimap: { enabled: false },
      lineNumbers: 'off',
      fontSize: 14,
      padding: { top: 16, bottom: 16 }
    });

    // Emit changes
    editor.onDidChangeModelContent(() => {
      emit('update:modelValue', editor.getValue());
    });
  }
});

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (editor && editor.getValue() !== newValue) {
    editor.setValue(newValue);
  }
});

onBeforeUnmount(() => {
  editor?.dispose();
});
</script>

<style scoped>
.monaco-editor-wrapper {
  width: 100%;
}

.editor-container {
  width: 100%;
  height: 60vh;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}
</style>
