<template>
  <v-app>
    <app-layout />
  </v-app>
</template>

<script setup>
import AppLayout from '@/components/Layout/AppLayout.vue';
// Keine weitere Logik hier nötig, da das Layout alles handhabt
</script>

<style>
/* Globale Stile können hier oder in einer separaten CSS-Datei (z.B. assets/main.css) platziert werden */
body {
  font-family: 'Roboto', sans-serif; /* Beispiel: Standard-Schriftart setzen */
}

/* Stil für die Scrollbar (optional) */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
}
::-webkit-scrollbar-thumb {
  background: #bdbdbd;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #888;
}
</style> 