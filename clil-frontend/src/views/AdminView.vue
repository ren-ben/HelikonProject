<template>
  <div>
    <h1 class="text-h4 font-weight-bold mb-6">Administration</h1>

    <!-- System-Statistiken -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card variant="outlined">
          <v-card-text class="text-center">
            <v-icon size="40" color="primary" class="mb-2">mdi-account-group</v-icon>
            <div class="text-h4 font-weight-bold">{{ stats.totalUsers ?? '—' }}</div>
            <div class="text-body-2 text-medium-emphasis">Benutzer</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card variant="outlined">
          <v-card-text class="text-center">
            <v-icon size="40" color="secondary" class="mb-2">mdi-file-document-multiple</v-icon>
            <div class="text-h4 font-weight-bold">{{ stats.totalMaterials ?? '—' }}</div>
            <div class="text-body-2 text-medium-emphasis">Materialien</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Benutzerverwaltung -->
    <v-card variant="outlined">
      <v-card-title class="text-h6">
        <v-icon class="mr-2">mdi-account-cog</v-icon>
        Benutzerverwaltung
        <v-spacer />
        <v-btn icon variant="text" size="small" :loading="loadingUsers" @click="fetchUsers">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-progress-linear v-if="loadingUsers" indeterminate color="primary" class="mb-4" />

        <v-alert v-if="error" type="error" variant="tonal" density="compact" closable class="mb-4" @click:close="error = ''">
          {{ error }}
        </v-alert>

        <v-table v-if="!loadingUsers && users.length > 0" density="comfortable">
          <thead>
            <tr>
              <th>ID</th>
              <th>Benutzername</th>
              <th>E-Mail</th>
              <th>Rollen</th>
              <th>Erstellt</th>
              <th>Materialien</th>
              <th class="text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>
                <v-chip
                  v-for="role in user.roles"
                  :key="role"
                  :color="role === 'ADMIN' ? 'error' : 'primary'"
                  size="small"
                  class="mr-1"
                >
                  {{ role }}
                </v-chip>
              </td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>{{ user.materialCount }}</td>
              <td class="text-right">
                <v-btn
                  v-if="!user.roles.includes('ADMIN')"
                  variant="text"
                  size="small"
                  color="warning"
                  :loading="updatingId === user.id"
                  @click="promoteUser(user)"
                  title="Zum Admin befördern"
                >
                  <v-icon>mdi-shield-crown</v-icon>
                </v-btn>
                <v-btn
                  v-else-if="user.id !== currentUserId"
                  variant="text"
                  size="small"
                  color="grey"
                  :loading="updatingId === user.id"
                  @click="demoteUser(user)"
                  title="Admin-Rolle entfernen"
                >
                  <v-icon>mdi-shield-off</v-icon>
                </v-btn>
                <v-btn
                  v-if="user.id !== currentUserId"
                  icon
                  variant="text"
                  size="small"
                  color="error"
                  :loading="deletingId === user.id"
                  @click="confirmDelete(user)"
                  title="Benutzer löschen"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>

        <div v-if="!loadingUsers && users.length === 0" class="text-center py-8 text-medium-emphasis">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-account-off</v-icon>
          <p class="text-body-1">Keine Benutzer gefunden.</p>
        </div>
      </v-card-text>
    </v-card>

    <!-- Lösch-Bestätigung -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Benutzer löschen?</v-card-title>
        <v-card-text>
          Möchten Sie <strong>{{ deleteTarget?.username }}</strong> wirklich löschen?
          Alle zugehörigen Materialien verlieren ihren Besitzer.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Abbrechen</v-btn>
          <v-btn color="error" variant="flat" @click="handleDelete">Löschen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/deepinfra-api'

const authStore = useAuthStore()
const currentUserId = computed(() => {
  // Extrahiere die User-ID aus dem gespeicherten user-Objekt
  // Da wir die ID nicht im Frontend-User speichern, verwenden wir den Username als Fallback
  return authStore.user?.id || null
})

const stats = ref({})
const users = ref([])
const loadingUsers = ref(false)
const error = ref('')
const updatingId = ref(null)
const deletingId = ref(null)
const deleteDialog = ref(false)
const deleteTarget = ref(null)

onMounted(async () => {
  await Promise.all([fetchStats(), fetchUsers()])
})

async function fetchStats() {
  const result = await api.getAdminStats()
  if (result.success) {
    stats.value = result.data
  }
}

async function fetchUsers() {
  loadingUsers.value = true
  error.value = ''
  const result = await api.getAdminUsers()
  if (result.success) {
    users.value = result.data
  } else {
    error.value = result.error || 'Fehler beim Laden der Benutzer.'
  }
  loadingUsers.value = false
}

async function promoteUser(user) {
  updatingId.value = user.id
  const roles = [...new Set([...user.roles, 'ADMIN'])]
  const result = await api.updateUserRoles(user.id, roles)
  if (result.success) {
    await fetchUsers()
  } else {
    error.value = result.error || 'Fehler beim Aktualisieren der Rollen.'
  }
  updatingId.value = null
}

async function demoteUser(user) {
  updatingId.value = user.id
  const roles = user.roles.filter(r => r !== 'ADMIN')
  if (roles.length === 0) roles.push('USER')
  const result = await api.updateUserRoles(user.id, roles)
  if (result.success) {
    await fetchUsers()
  } else {
    error.value = result.error || 'Fehler beim Aktualisieren der Rollen.'
  }
  updatingId.value = null
}

function confirmDelete(user) {
  deleteTarget.value = user
  deleteDialog.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  const userId = deleteTarget.value.id
  deleteDialog.value = false
  deletingId.value = userId

  const result = await api.deleteUser(userId)
  if (result.success) {
    await Promise.all([fetchUsers(), fetchStats()])
  } else {
    error.value = result.error || 'Fehler beim Löschen des Benutzers.'
  }
  deletingId.value = null
  deleteTarget.value = null
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>
