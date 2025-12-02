<template>
  <v-app :theme="isDarkMode ? 'dark' : 'clilTheme'">
    <!-- App Bar -->
    <v-app-bar color="primary" app elevation="1">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>CLIL-KI-Tool</v-app-bar-title>
      <v-spacer></v-spacer>

      <!-- Suchfeld -->
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Suchen..."
        hide-details
        density="compact"
        variant="solo-filled"
        rounded
        class="mt-n2 mr-4 hidden-sm-and-down" 
        style="max-width: 250px;"
      ></v-text-field>

      <v-spacer></v-spacer>

       <!-- Dark Mode Toggle -->
       <v-btn icon @click="toggleTheme">
         <v-icon>{{ isDarkMode ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
       </v-btn>

      <!-- Benachrichtigungen -->
      <v-badge
        content="2" 
        color="error"
        overlap
        class="mr-2"
      >
        <v-btn icon>
          <v-icon>mdi-bell</v-icon>
        </v-btn>
      </v-badge>

      <!-- Benutzermenü -->
      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            class="ml-1 mr-2"
          >
            <v-avatar color="secondary" size="36">
               <!-- Initialen oder Bild des Benutzers -->
              <span class="text-subtitle-1 text-white">LS</span> 
            </v-avatar>
          </v-btn>
        </template>
        <v-list density="compact">
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
      <span>&copy; {{ new Date().getFullYear() }} CLIL-KI-Tool</span>
    </v-footer>
     -->

  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTheme } from 'vuetify'

const route = useRoute();
const router = useRouter();
const theme = useTheme();

const drawer = ref(true); // Navigation Drawer standardmäßig offen
const search = ref('');
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

const navigationItems = [
  { title: 'Dashboard', to: '/', icon: 'mdi-view-dashboard-variant-outline', matchPrefix: false },
  { title: 'Material erstellen', to: '/create', icon: 'mdi-plus-box-outline', matchPrefix: false },
  { title: 'Meine Materialien', to: '/materials', icon: 'mdi-folder-text-outline', matchPrefix: true }, // Matcht /materials und /materials/:id
  { title: 'Vorlagen', to: '/templates', icon: 'mdi-file-document-multiple-outline', matchPrefix: false },
  { title: 'Einstellungen', to: '/settings', icon: 'mdi-cog-outline', matchPrefix: false }
];

// Funktion zum Umschalten des Themes
function toggleTheme () {
  isDarkMode.value = !isDarkMode.value;
  theme.global.name.value = isDarkMode.value ? 'dark' : 'clilTheme'
  // Optional: Theme im localStorage speichern
  // localStorage.setItem('darkMode', isDarkMode.value);
}

// Funktion für Logout (Beispiel)
function logout() {
  console.log('Logout clicked');
  // Hier Logik für den Logout einfügen (z.B. Token entfernen, zur Login-Seite navigieren)
  // router.push('/login');
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