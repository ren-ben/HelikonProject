import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

let nextId = 1

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref([])

  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.read).length
  )

  function add({ title, message = '', type = 'success', icon = 'mdi-bell' }) {
    notifications.value.unshift({
      id: nextId++,
      title,
      message,
      type,
      icon,
      read: false,
      createdAt: new Date(),
    })
    // Begrenzen auf 50
    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(0, 50)
    }
  }

  function markRead(id) {
    const n = notifications.value.find(n => n.id === id)
    if (n) n.read = true
  }

  function markAllRead() {
    notifications.value.forEach(n => { n.read = true })
  }

  function remove(id) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  function clear() {
    notifications.value = []
  }

  return { notifications, unreadCount, add, markRead, markAllRead, remove, clear }
})
