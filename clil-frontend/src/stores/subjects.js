import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/deepinfra-api'
import { subjects as defaultSubjects } from '@/constants/subjects'

export const useSubjectStore = defineStore('subjects', () => {
  const subjects = ref([])
  const loading = ref(false)

  async function fetchSubjects() {
    loading.value = true
    const result = await api.getSubjects()
    if (result.success && Array.isArray(result.data)) {
      subjects.value = result.data.map(s => ({ id: s.id, name: s.name }))
    } else {
      // Fallback: statische Standardliste ohne IDs
      subjects.value = defaultSubjects.map(name => ({ id: null, name }))
    }
    loading.value = false
  }

  // Nur die Namen als String-Array (fuer v-combobox :items)
  function subjectNames() {
    return subjects.value.map(s => s.name)
  }

  async function addSubject(name) {
    const result = await api.createSubject(name)
    if (result.success) {
      await fetchSubjects()
      return { success: true }
    }
    return { success: false, error: result.error }
  }

  async function deleteSubject(id) {
    const result = await api.deleteSubject(id)
    if (result.success) {
      await fetchSubjects()
      return { success: true }
    }
    return { success: false, error: result.error }
  }

  return {
    subjects,
    loading,
    fetchSubjects,
    subjectNames,
    addSubject,
    deleteSubject
  }
})
