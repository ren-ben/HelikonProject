import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authService from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const accessToken = ref(null)
  const refreshToken = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value)

  const userInitials = computed(() => {
    if (!user.value?.username) return '??'
    return user.value.username.substring(0, 2).toUpperCase()
  })

  const isAdmin = computed(() => {
    return user.value?.roles?.includes('ADMIN') || false
  })

  // Actions
  function initialize() {
    const storedToken = localStorage.getItem('accessToken')
    const storedRefresh = localStorage.getItem('refreshToken')
    const storedUser = localStorage.getItem('user')

    if (storedToken) {
      accessToken.value = storedToken
      refreshToken.value = storedRefresh
      try {
        user.value = storedUser ? JSON.parse(storedUser) : null
      } catch {
        user.value = null
      }
    }
  }

  function _saveAuth(response) {
    accessToken.value = response.accessToken
    refreshToken.value = response.refreshToken
    user.value = {
      username: response.username,
      email: response.email,
      roles: response.roles ? [...response.roles] : ['USER']
    }
    localStorage.setItem('accessToken', response.accessToken)
    localStorage.setItem('refreshToken', response.refreshToken)
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  async function login(username, password) {
    loading.value = true
    error.value = null
    try {
      const response = await authService.login(username, password)
      _saveAuth(response)
      return true
    } catch (err) {
      error.value = err.response?.data?.message || 'Anmeldung fehlgeschlagen'
      return false
    } finally {
      loading.value = false
    }
  }

  async function register(username, email, password) {
    loading.value = true
    error.value = null
    try {
      const response = await authService.register(username, email, password)
      _saveAuth(response)
      return true
    } catch (err) {
      error.value = err.response?.data?.message || 'Registrierung fehlgeschlagen'
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    error.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  async function refresh() {
    if (!refreshToken.value) {
      logout()
      return false
    }
    try {
      const response = await authService.refresh(refreshToken.value)
      _saveAuth(response)
      return true
    } catch {
      logout()
      return false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    user,
    accessToken,
    refreshToken,
    loading,
    error,
    // Getters
    isAuthenticated,
    userInitials,
    isAdmin,
    // Actions
    initialize,
    login,
    register,
    logout,
    refresh,
    clearError
  }
})
