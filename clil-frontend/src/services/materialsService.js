import apiClient from './deepinfra-api'

/**
 * MaterialsService - Service-Schicht für Material-Management
 * Trennt die API-Kommunikation von der Store-Logik
 */

class MaterialsService {
  
  /**
   * Lädt alle Materialien
   */
  async getAllMaterials() {
    try {
      const response = await apiClient.getAllMaterials()
      
      if (!response.success) {
        throw new Error(response.error || 'Fehler beim Laden der Materialien')
      }
      
      // Transform API response to frontend format
      return response.data.map(this.transformMaterialFromAPI)
    } catch (error) {
      console.error('MaterialsService.getAllMaterials:', error)
      throw new Error(`Fehler beim Laden der Materialien: ${error.message}`)
    }
  }

  /**
   * Lädt ein einzelnes Material
   */
  async getMaterialById(id) {
    try {
      console.log('MaterialsService.getMaterialById: Fetching material with ID', id);
      const response = await apiClient.getMaterial(id);
      console.log('MaterialsService.getMaterialById: API response:', response);
      
      if (!response) {
        throw new Error('Material nicht gefunden');
      }

      // Transformiere die API-Antwort in das erwartete Format
      const material = {
        id: response.id,
        title: response.title,
        content: response.content,
        type: response.type,
        subject: response.subject,
        languageLevel: response.languageLevel,
        vocabPercentage: response.vocabPercentage,
        created: response.created,
        modified: response.modified,
        tags: response.tags
      };

      console.log('MaterialsService.getMaterialById: Transformed material:', material);
      return material;
    } catch (error) {
      console.error('MaterialsService.getMaterialById: Error:', error);
      throw new Error('Fehler beim Laden des Materials: ' + error.message);
    }
  }

  /**
   * Erstellt ein neues Material
   */
  async createMaterial(materialData) {
    try {
      console.log('[materialsService] createMaterial received data:', JSON.stringify(materialData, null, 2));
      
      // Validate input (ggf. erweitern)
      // this.validateMaterialData(materialData) // Momentan validiert nur Basis-Felder
      
      // Transform to API format
      const apiData = this.transformMaterialToAPI(materialData);
      console.log('[materialsService] Transformed apiData to send:', JSON.stringify(apiData, null, 2));
      
      const response = await apiClient.createMaterial(apiData);
      console.log('[materialsService] API response for createMaterial:', JSON.stringify(response, null, 2));
      
      if (!response.success) {
        throw new Error(response.error || 'Fehler beim Erstellen des Materials im Service');
      }
      
      // Transformiere die Antwort des Backends zurück, falls nötig
      // Das Backend sollte bereits das korrekte DTO zurückgeben.
      return this.transformMaterialFromAPI(response.data);
    } catch (error) {
      console.error('[materialsService] Error in createMaterial:', error);
      console.error('[materialsService] Error details:', error.response?.data || error.message);
      throw new Error(`Fehler beim Erstellen des Materials: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Aktualisiert ein bestehendes Material
   */
  async updateMaterial(materialData) {
    try {
      // Validate input
      this.validateMaterialData(materialData)
      
      // Transform to API format
      const apiData = this.transformMaterialToAPI(materialData)
      
      console.log('Updating material with ID:', materialData.id);
      const response = await apiClient.updateMaterial(materialData.id, apiData)
      
      if (!response.success) {
        throw new Error(response.error || 'Fehler beim Aktualisieren des Materials')
      }
      
      return this.transformMaterialFromAPI(response.data)
    } catch (error) {
      console.error('MaterialsService.updateMaterial:', error)
      throw new Error(`Fehler beim Aktualisieren des Materials: ${error.message}`)
    }
  }

  /**
   * Löscht ein Material
   */
  async deleteMaterial(id) {
    try {
      if (!id) {
        throw new Error('Material-ID ist erforderlich')
      }
      
      const response = await apiClient.deleteMaterial(id)
      
      if (!response.success) {
        throw new Error(response.error || 'Fehler beim Löschen des Materials')
      }
      
      return true
    } catch (error) {
      console.error('MaterialsService.deleteMaterial:', error)
      throw new Error(`Fehler beim Löschen des Materials: ${error.message}`)
    }
  }

  /**
   * Generiert neues Material über AI
   */
  async generateMaterial(materialType, params = {}) {
    try {
      // Use existing API client method
      const response = await apiClient.generateMaterial(materialType, params)
      
      if (!response.success) {
        throw new Error(response.error || 'Fehler beim Generieren des Materials')
      }
      
      return {
        title: response.data.title,
        content: response.data.content,
        type: materialType,
        topic: params.topic,
        metadata: response.metadata
      }
    } catch (error) {
      console.error('MaterialsService.generateMaterial:', error)
      throw new Error(`Fehler beim Generieren des Materials: ${error.message}`)
    }
  }

  /**
   * Transformiert API-Daten in Frontend-Format
   */
  transformMaterialFromAPI = (apiData) => {
    return {
      id: apiData.id,
      title: apiData.topic || apiData.title,
      content: apiData.aiResponse || apiData.formattedHtml || apiData.content,
      type: apiData.materialType || apiData.type,
      subject: apiData.subject || '',
      language: {
        level: apiData.languageLevel || 'B1',
        vocabPercentage: apiData.vocabPercentage || 30
      },
      created: apiData.createdAt || apiData.created,
      modified: apiData.modifiedAt || apiData.modified || apiData.createdAt || apiData.created,
      tags: apiData.tags || []
    };
  }

  /**
   * Transformiert Material von Frontend-Format zu API-Format
   */
  transformMaterialToAPI(frontendMaterial) {
    console.log('[materialsService] transformMaterialToAPI input:', JSON.stringify(frontendMaterial, null, 2));
    const apiData = {
      materialType: frontendMaterial.type || frontendMaterial.materialType,
      topic: frontendMaterial.title || frontendMaterial.topic,
      content: frontendMaterial.content, // Wird in aiResponse/formattedHtml umgewandelt
      subject: frontendMaterial.subject,
      languageLevel: frontendMaterial.languageLevel || frontendMaterial.language?.level,
      vocabPercentage: frontendMaterial.vocabPercentage || frontendMaterial.language?.vocabPercentage,
      tags: frontendMaterial.tags || [],
      // Folgende Felder werden explizit für die `create` Operation benötigt, falls vorhanden
      prompt: frontendMaterial.prompt, 
      clilElements: frontendMaterial.clilElements
    };
    
    // Entferne undefined Werte, außer für spezielle Objekte wie clilElements
    Object.keys(apiData).forEach(key => {
      if (apiData[key] === undefined && key !== 'clilElements') {
        delete apiData[key];
      }
    });
    
    // aiResponse und formattedHtml setzen basierend auf content
    if (apiData.content) {
      apiData.aiResponse = apiData.content;
      apiData.formattedHtml = apiData.content;
      // 'content' kann beibehalten werden, da das Backend es für createMaterial erwartet (siehe MaterialCreateRequest DTO)
      // delete apiData.content; 
    }
    
    console.log('[materialsService] transformMaterialToAPI output:', JSON.stringify(apiData, null, 2));
    return apiData;
  }

  /**
   * Validiert Material-Daten
   */
  validateMaterialData(materialData) {
    if (!materialData) {
      throw new Error('Material-Daten sind erforderlich')
    }
    
    // Bei Updates nur die vorhandenen Felder validieren
    if (materialData.type !== undefined && (!materialData.type || materialData.type.trim() === '')) {
      throw new Error('Material-Typ ist erforderlich')
    }
    
    if (materialData.title !== undefined && (!materialData.title || materialData.title.trim() === '')) {
      throw new Error('Titel ist erforderlich')
    }
    
    if (materialData.content !== undefined && (!materialData.content || materialData.content.trim() === '')) {
      throw new Error('Inhalt ist erforderlich')
    }
    
    // Additional validation only if the fields are present
    if (materialData.title && materialData.title.length > 200) {
      throw new Error('Titel ist zu lang (max. 200 Zeichen)')
    }
    
    if (materialData.type && materialData.type.length > 50) {
      throw new Error('Material-Typ ist zu lang (max. 50 Zeichen)')
    }
  }

  /**
   * Formatiert Datum für Frontend
   */
  formatDate(dateString) {
    if (!dateString) {
      return new Date().toISOString().split('T')[0]
    }
    
    try {
      return new Date(dateString).toISOString().split('T')[0]
    } catch (error) {
      console.warn('Invalid date format:', dateString)
      return new Date().toISOString().split('T')[0]
    }
  }

  /**
   * Prüft Backend-Verbindung
   */
  async checkConnection() {
    try {
      const response = await apiClient.checkConnection()
      return response.success
    } catch (error) {
      console.error('MaterialsService.checkConnection:', error)
      return false
    }
  }
}

// Export singleton instance
export default new MaterialsService()
