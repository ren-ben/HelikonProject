<template>
  <v-app :theme="isDarkMode ? 'dark' : 'clilTheme'">
    <!-- App Bar -->
    <v-app-bar color="primary" app elevation="1">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <img src="/helikonlogo.png" alt="Helikon" style="height: 32px; width: 32px; margin-right: 8px;" />
      <v-app-bar-title>Helikon</v-app-bar-title>
      <v-spacer></v-spacer>

       <!-- Dark Mode Toggle -->
       <v-btn icon @click="toggleTheme">
         <v-icon>{{ isDarkMode ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
       </v-btn>

      <!-- Benachrichtigungen -->
      <v-menu :close-on-content-click="false" location="bottom end" max-height="420" min-width="360" max-width="360">
        <template v-slot:activator="{ props }">
          <v-badge
            :content="notificationStore.unreadCount"
            :model-value="notificationStore.unreadCount > 0"
            color="error"
            overlap
            class="mr-2"
          >
            <v-btn icon v-bind="props">
              <v-icon>mdi-bell</v-icon>
            </v-btn>
          </v-badge>
        </template>
        <v-card>
          <v-card-title class="d-flex align-center text-subtitle-1 py-2 px-4">
            Benachrichtigungen
            <v-spacer />
            <v-btn
              v-if="notificationStore.unreadCount > 0"
              variant="text"
              density="compact"
              size="small"
              @click="notificationStore.markAllRead()"
            >
              Alle gelesen
            </v-btn>
          </v-card-title>
          <v-divider />
          <v-list v-if="notificationStore.notifications.length > 0" density="compact" class="py-0" style="max-height: 340px; overflow-y: auto;">
            <v-list-item
              v-for="n in notificationStore.notifications"
              :key="n.id"
              @click="notificationStore.markRead(n.id)"
              :class="{ 'bg-grey-lighten-4': !n.read }"
              class="py-2"
            >
              <template #prepend>
                <v-icon :color="typeColor[n.type] || 'grey'" size="small" class="mr-3">{{ n.icon }}</v-icon>
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">{{ n.title }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                {{ n.message }}
                <span class="text-disabled ml-1">{{ formatTimeAgo(n.createdAt) }}</span>
              </v-list-item-subtitle>
              <template #append>
                <v-btn icon variant="text" size="x-small" @click.stop="notificationStore.remove(n.id)">
                  <v-icon size="small">mdi-close</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="text-center py-8 text-medium-emphasis">
            <v-icon size="32" color="grey-lighten-1" class="mb-2">mdi-bell-off-outline</v-icon>
            <p class="text-body-2">Keine Benachrichtigungen</p>
          </div>
        </v-card>
      </v-menu>

      <!-- Benutzermenü -->
      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            class="ml-1 mr-2"
          >
            <v-avatar color="secondary" size="36">
              <span class="text-subtitle-1 text-white">{{ authStore.userInitials }}</span>
            </v-avatar>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item v-if="authStore.user" class="px-4 py-2" :ripple="false">
            <v-list-item-title class="font-weight-medium">{{ authStore.user.username }}</v-list-item-title>
            <v-list-item-subtitle>{{ authStore.user.email }}</v-list-item-subtitle>
          </v-list-item>
          <v-divider v-if="authStore.user"></v-divider>
          <v-list-item to="/settings" prepend-icon="mdi-account-cog">
            <v-list-item-title>Profil</v-list-item-title>
          </v-list-item>
          <v-list-item to="/settings" prepend-icon="mdi-cog">
            <v-list-item-title>Einstellungen</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item prepend-icon="mdi-logout" @click="logout">
            <v-list-item-title>Abmelden</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      app
      :width="260"
      color="surface" 
    >
      <v-list nav density="compact">
        <v-list-item
          v-for="(item, i) in navigationItems"
          :key="i"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          :active="route.path === item.to || (item.matchPrefix && route.path.startsWith(item.to))"
          color="primary"
          link
        >
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <v-divider></v-divider>
        <v-list nav density="compact">
          <v-list-item prepend-icon="mdi-help-circle-outline" title="Hilfe & Support">
            <!-- Link zu Hilfe oder Modal -->
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <v-container fluid class="pa-4" style="background-color: var(--v-theme-background); min-height: calc(100vh - 64px);">
        <!-- Loading State während des Routenwechsels -->
        <v-progress-linear
          v-if="isNavigating"
          indeterminate
          color="primary"
          class="mb-4"
        ></v-progress-linear>
        
        <!-- Hier wird der Inhalt der jeweiligen Route angezeigt -->
        <router-view v-slot="{ Component, route }">
          <transition name="fade" mode="out-in">
            <div :key="route.path" class="router-view-container">
              <suspense>
                <template #default>
                  <component :is="Component" />
                </template>
                <template #fallback>
                  <div class="d-flex justify-center align-center" style="min-height: 400px;">
                    <v-progress-circular
                      indeterminate
                      color="primary"
                      size="64"
                    ></v-progress-circular>
                  </div>
                </template>
              </suspense>
            </div>
          </transition>
        </router-view>
      </v-container>
    </v-main>

    <!-- Optional: Footer -->
    <!-- 
    <v-footer app height="40" class="text-caption">
      <v-spacer></v-spacer>
      <span>&copy; {{ new Date().getFullYear() }} Helikon</span>
    </v-footer>
     -->

  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTheme } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { useSubjectStore } from '@/stores/subjects'

const route = useRoute();
const router = useRouter();
const theme = useTheme();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const subjectStore = useSubjectStore();

// Fächer beim App-Start laden
subjectStore.fetchSubjects();

const drawer = ref(true); // Navigation Drawer standardmäßig offen
const isDarkMode = ref(false);
const isNavigating = ref(false);

// Router Navigation Guards für Loading State
router.beforeEach(() => {
  isNavigating.value = true;
});

router.afterEach(() => {
  setTimeout(() => {
    isNavigating.value = false;
  }, 100);
});

const navigationItems = computed(() => [
  { title: 'Dashboard', to: '/', icon: 'mdi-view-dashboard-variant-outline', matchPrefix: false },
  { title: 'Material erstellen', to: '/create', icon: 'mdi-plus-box-outline', matchPrefix: false },
  { title: 'Meine Materialien', to: '/materials', icon: 'mdi-folder-text-outline', matchPrefix: true }, // Matcht /materials und /materials/:id
  { title: 'Dokumente', to: '/documents', icon: 'mdi-file-upload-outline', matchPrefix: false },
  { title: 'RAG-Abfrage', to: '/query', icon: 'mdi-chat-question-outline', matchPrefix: false },
  { title: 'Vorlagen', to: '/templates', icon: 'mdi-file-document-multiple-outline', matchPrefix: false },
  { title: 'Einstellungen', to: '/settings', icon: 'mdi-cog-outline', matchPrefix: false },
  ...(authStore.isAdmin ? [{ title: 'Administration', to: '/admin', icon: 'mdi-shield-crown-outline', matchPrefix: false }] : [])
]);

// Funktion zum Umschalten des Themes
function toggleTheme () {
  isDarkMode.value = !isDarkMode.value;
  theme.global.name.value = isDarkMode.value ? 'dark' : 'clilTheme'
  // Optional: Theme im localStorage speichern
  // localStorage.setItem('darkMode', isDarkMode.value);
}

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000)
  if (seconds < 60) return 'Gerade eben'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `vor ${minutes} Min.`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `vor ${hours} Std.`
  return `vor ${Math.floor(hours / 24)} Tag(en)`
}

const typeColor = { success: 'success', info: 'info', warning: 'warning', error: 'error' }

function logout() {
  authStore.logout();
  router.push('/login');
}

// Initialen Theme-Status laden (Beispiel)
// onMounted(() => {
//   const storedDarkMode = localStorage.getItem('darkMode');
//   if (storedDarkMode !== null) {
//     isDarkMode.value = JSON.parse(storedDarkMode);
//     theme.global.name.value = isDarkMode.value ? 'dark' : 'clilTheme'
//   }
// });

</script>

<style scoped>
/* Spezifische Stile für das Layout, falls nötig */
.v-navigation-drawer .v-list-item--active {
  /* Hintergrundfarbe für aktiven Menüpunkt (optional, Vuetify macht das oft schon) */
  /* background-color: rgba(var(--v-theme-primary), 0.1); */
}

/* Anpassung der Dichte für die App Bar Elemente */
.v-app-bar .v-input {
  font-size: 0.9rem;
}

/* Fade Transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.router-view-container {
  width: 100%;
}
</style> 