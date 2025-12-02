import { defineStore } from 'pinia'
import materialsService from '@/services/materialsService'

export const useMaterialsStore = defineStore('materials', {
  state: () => ({
    materials: [],
    loading: false,
    error: null
  }),

  getters: {
    getMaterialById: (state) => (id) => {
      return state.materials.find(m => m.id === id) || null
    },

    sortedMaterials: (state) => {
      return [...state.materials].sort((a, b) =>
        new Date(b.modified) - new Date(a.modified)
      )
    },

    recentMaterials: (state) => {
      return [...state.materials]
        .sort((a, b) => new Date(b.created) - new Date(a.created))
        .slice(0, 5)
    },

    materialsByType: (state) => {
      const grouped = {}
      state.materials.forEach(material => {
        if (!grouped[material.type]) {
          grouped[material.type] = []
        }
        grouped[material.type].push(material)
      })
      return grouped
    },

    favoriteMaterials: (state) => {
      return state.materials.filter(m => m.favorite)
    },

    materialCount: (state) => state.materials.length
  },

  actions: {
    /**
     * Lädt alle Materialien vom Backend
     */
    async fetchMaterials() {
      this.loading = true
      this.error = null
      
      try {
        const materials = await materialsService.getAllMaterials()
        this.materials = materials
      } catch (error) {
        this.error = error.message
        console.error('Store.fetchMaterials:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Erstellt ein neues Material
     */
    async addMaterial(materialData) {
      this.loading = true;
      this.error = null;
      
      console.log('[materialsStore] addMaterial received data:', JSON.stringify(materialData, null, 2));
      
      try {
        const newMaterial = await materialsService.createMaterial(materialData);
        
        console.log('[materialsStore] Material created by service:', JSON.stringify(newMaterial, null, 2));
        
        this.materials.unshift(newMaterial); // Add to beginning for visibility
        return newMaterial;
      } catch (error) {
        this.error = error.message;
        console.error('[materialsStore] Error in addMaterial:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Aktualisiert ein bestehendes Material
     */
    async updateMaterial(materialData) {
      this.loading = true
      this.error = null
      
      try {
        console.log('Store: Updating material:', materialData);
        const updatedMaterial = await materialsService.updateMaterial(materialData)
        console.log('Store: Received updated material:', updatedMaterial);
        
        // Update in store
        const index = this.materials.findIndex(m => m.id === materialData.id)
        if (index !== -1) {
          this.materials[index] = {
            ...this.materials[index],
            ...updatedMaterial,
            modified: new Date().toISOString()
          }
        }
        
        return updatedMaterial
      } catch (error) {
        this.error = error.message
        console.error('Store.updateMaterial:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Löscht ein Material
     */
    async deleteMaterial(id) {
      this.loading = true
      this.error = null
      
      try {
        await materialsService.deleteMaterial(id)
        
        // Remove from store
        this.materials = this.materials.filter(m => m.id !== id)
      } catch (error) {
        this.error = error.message
        console.error('Store.deleteMaterial:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Toggle Favorite Status (nur lokal, kein Backend-Call)
     */
    toggleFavorite(id) {
      const material = this.materials.find(m => m.id === id)
      if (material) {
        material.favorite = !material.favorite
        material.modified = new Date().toISOString().split('T')[0]
        
        // Optional: Update im Backend via updateMaterial
        // this.updateMaterial(material)
      }
    },

    /**
     * Generiert neues Material via AI
     */
    async generateMaterial(materialType, params = {}) {
      this.loading = true
      this.error = null
      
      try {
        const generatedData = await materialsService.generateMaterial(materialType, params)
        
        // Gebe nur die generierten Daten zurück, OHNE zu speichern
        // Das Speichern erfolgt separat in der Komponente
        return generatedData
      } catch (error) {
        this.error = error.message
        console.error('Store.generateMaterial:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Lädt ein einzelnes Material (für Details-View)
     */
    async fetchMaterialById(id) {
      // Check if already in store
      const existing = this.getMaterialById(id)
      if (existing) {
        return existing
      }
      
      this.loading = true
      this.error = null
      
      try {
        const material = await materialsService.getMaterialById(id)
        
        // Add to store if not exists
        if (!this.getMaterialById(id)) {
          this.materials.push(material)
        }
        
        return material
      } catch (error) {
        this.error = error.message
        console.error('Store.fetchMaterialById:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Filtert Materialien nach Typ
     */
    filterByType(type) {
      if (!type) return this.materials
      return this.materials.filter(m => m.type === type)
    },

    /**
     * Sucht in Materialien
     */
    searchMaterials(query) {
      if (!query || query.trim() === '') return this.materials
      
      const searchTerm = query.toLowerCase()
      return this.materials.filter(m => 
        m.title.toLowerCase().includes(searchTerm) ||
        m.subject?.toLowerCase().includes(searchTerm) ||
        m.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        m.content?.toLowerCase().includes(searchTerm)
      )
    },

    /**
     * Zurücksetzen des Error-Status
     */
    clearError() {
      this.error = null
    },

    /**
     * Prüft Backend-Verbindung
     */
    async checkBackendConnection() {
      try {
        return await materialsService.checkConnection()
      } catch (error) {
        console.error('Store.checkBackendConnection:', error)
        return false
      }
    }
  }
}) 