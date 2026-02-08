import axios from 'axios'

const authClient = axios.create({
  baseURL: '/api/v1/auth',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

export default {
  async login(username, password) {
    const response = await authClient.post('/login', { username, password })
    return response.data
  },

  async register(username, email, password) {
    const response = await authClient.post('/register', { username, email, password })
    return response.data
  },

  async refresh(refreshToken) {
    const response = await authClient.post('/refresh', { refreshToken })
    return response.data
  }
}
