<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card elevation="8" rounded="lg">
          <v-card-title class="text-center pt-6 pb-2">
            <div class="d-flex align-center justify-center">
              <img src="/helikonlogo.png" alt="Helikon" style="height: 36px; width: 36px; margin-right: 8px;" />
              <span class="text-h5 font-weight-bold text-primary">Helikon</span>
            </div>
            <div class="text-subtitle-1 text-medium-emphasis mt-1">Anmelden</div>
          </v-card-title>

          <v-card-text class="px-6 pb-2">
            <v-alert
              v-if="authStore.error"
              type="error"
              variant="tonal"
              density="compact"
              closable
              class="mb-4"
              @click:close="authStore.clearError()"
            >
              {{ authStore.error }}
            </v-alert>

            <v-form ref="formRef" @submit.prevent="handleLogin" lazy-validation>
              <v-text-field
                v-model="username"
                label="Benutzername"
                prepend-inner-icon="mdi-account"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
                class="mb-2"
                :disabled="authStore.loading"
              />

              <v-text-field
                v-model="password"
                label="Passwort"
                prepend-inner-icon="mdi-lock"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
                class="mb-2"
                :disabled="authStore.loading"
              />

              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                :loading="authStore.loading"
                class="mt-2"
              >
                Anmelden
              </v-btn>
            </v-form>
          </v-card-text>

          <v-card-actions class="justify-center pb-6">
            <span class="text-body-2 text-medium-emphasis">
              Noch kein Konto?
            </span>
            <v-btn
              variant="text"
              color="primary"
              size="small"
              :to="{ name: 'register' }"
            >
              Registrieren
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref(null)
const username = ref('')
const password = ref('')
const showPassword = ref(false)

const rules = {
  required: v => !!v || 'Pflichtfeld'
}

async function handleLogin() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  const success = await authStore.login(username.value, password.value)
  if (success) {
    router.push('/')
  }
}
</script>
