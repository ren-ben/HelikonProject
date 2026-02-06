<template>
  <v-app>
    <app-layout v-if="!$route.meta.noLayout" />
    <router-view v-else />
  </v-app>
</template>

<script setup>
import { onMounted } from 'vue'
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
onMounted(() => {
  authStore.initialize()
})
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