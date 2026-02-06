<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card elevation="8" rounded="lg">
          <v-card-title class="text-center pt-6 pb-2">
            <div class="text-h5 font-weight-bold text-primary">CLIL-KI-Tool</div>
            <div class="text-subtitle-1 text-medium-emphasis mt-1">Konto erstellen</div>
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

            <v-form ref="formRef" @submit.prevent="handleRegister" lazy-validation>
              <v-text-field
                v-model="username"
                label="Benutzername"
                prepend-inner-icon="mdi-account"
                :rules="[rules.required, rules.minLength(3), rules.maxLength(50)]"
                variant="outlined"
                density="comfortable"
                class="mb-2"
                :disabled="authStore.loading"
              />

              <v-text-field
                v-model="email"
                label="E-Mail"
                prepend-inner-icon="mdi-email"
                :rules="[rules.required, rules.email]"
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
                :rules="[rules.required, rules.minLength(6)]"
                variant="outlined"
                density="comfortable"
                class="mb-2"
                :disabled="authStore.loading"
              />

              <v-text-field
                v-model="confirmPassword"
                label="Passwort bestätigen"
                prepend-inner-icon="mdi-lock-check"
                :type="showConfirmPassword ? 'text' : 'password'"
                :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showConfirmPassword = !showConfirmPassword"
                :rules="[rules.required, rules.passwordMatch]"
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
                Registrieren
              </v-btn>
            </v-form>
          </v-card-text>

          <v-card-actions class="justify-center pb-6">
            <span class="text-body-2 text-medium-emphasis">
              Bereits ein Konto?
            </span>
            <v-btn
              variant="text"
              color="primary"
              size="small"
              :to="{ name: 'login' }"
            >
              Anmelden
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
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const rules = {
  required: v => !!v || 'Pflichtfeld',
  email: v => /.+@.+\..+/.test(v) || 'Ungültige E-Mail-Adresse',
  minLength: (min) => v => (v && v.length >= min) || `Mindestens ${min} Zeichen`,
  maxLength: (max) => v => (v && v.length <= max) || `Maximal ${max} Zeichen`,
  passwordMatch: v => v === password.value || 'Passwörter stimmen nicht überein'
}

async function handleRegister() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  const success = await authStore.register(username.value, email.value, password.value)
  if (success) {
    router.push('/')
  }
}
</script>
