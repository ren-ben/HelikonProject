import axios from "axios";
import authService from "./authService";

// Configuration for Spring Boot backend
const API_CONFIG = {
  baseURL: "/api/v1/clil",
  timeout: 180000, // 180 seconds (3 minutes) timeout for AI generation
  headers: {
    "Content-Type": "application/json",
  },
};

// Create axios instance
const apiClient = axios.create(API_CONFIG);

// Token refresh state — prevents multiple concurrent refresh attempts
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

// Request interceptor — attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      "API Request:",
      config.method?.toUpperCase(),
      config.url,
      config.data
    );
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor — handle errors + 401 token refresh
apiClient.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.status, response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 — attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storedRefresh = localStorage.getItem("refreshToken");
      if (!storedRefresh) {
        processQueue(new Error("No refresh token"));
        isRefreshing = false;
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const response = await authService.refresh(storedRefresh);
        localStorage.setItem("accessToken", response.accessToken);
        localStorage.setItem("refreshToken", response.refreshToken);
        localStorage.setItem("user", JSON.stringify({
          username: response.username,
          email: response.email,
          roles: response.roles ? [...response.roles] : ["USER"]
        }));

        processQueue(null, response.accessToken);
        originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    console.error(
      "API Response Error:",
      error.response?.status,
      error.response?.data || error.message
    );

    // Handle different error types
    if (error.response?.status === 404) {
      throw new Error("Backend service not available");
    } else if (error.response?.status === 500) {
      throw new Error("Server error occurred while generating content");
    } else if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout - content generation took too long");
    } else if (error.code === "ERR_NETWORK") {
      throw new Error("Cannot connect to backend server");
    }

    throw new Error(
      error.response?.data?.message || error.response?.data?.error || error.message || "Unknown error occurred"
    );
  }
);

const typeMap = {
  'worksheet': 'Arbeitsblatt',
  'quiz': 'Quiz',
  'glossary': 'Glossar',
  'presentation': 'Präsentation',
  'graphic': 'Grafik',
  'video': 'Video-Skript'
};

const reverseTypeMap = Object.fromEntries(
  Object.entries(typeMap).map(([key, value]) => [value, key])
);

export default {
  // Get available LLM models from RAG service
  async getAvailableModels() {
    try {
      console.log('Fetching available LLM models');
      const response = await apiClient.get('/models');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error fetching models:', error.message);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  },

  // Main method to generate lesson materials
  async generateMaterial(materialType, params = {}) {
    try {
      console.log(
        `Generating material: ${materialType} for topic: ${params.topic}`
      );

      // Request payload matching the Spring Boot MaterialRequest DTO
      const requestPayload = {
        materialType: typeMap[materialType] || materialType,
        topic: params.topic,
        prompt: params.prompt,
        subject: params.subject || '',
        languageLevel: params.languageLevel || 'B1',
        vocabPercentage: params.vocabPercentage || 30,
        contentFocus: params.contentFocus || 'balanced',
        includeVocabList: params.includeVocabList || true,
        description: params.description || '',
        modelName: params.modelName || 'llama3.2',
        useDocumentContext: params.useDocumentContext || false,
      };

      console.log('Sending request payload:', JSON.stringify(requestPayload, null, 2));

      // Call Spring Boot endpoint
      const response = await apiClient.post("/generate", requestPayload);

      // Transform response to match frontend expectations
      return {
        success: true,
        data: {
          title: params.topic,
          content:
            response.data.formattedResponse || "<p>No content generated</p>",
        },
        metadata: {
          generationTime: null, // Spring Boot doesn't return this yet
          tokensUsed: null, // Spring Boot doesn't return this yet
          model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        },
      };
    } catch (error) {
      console.error("Material generation error:", error.message);
      return {
        success: false,
        error: error.message,
        data: {
          title: "Error",
          content: `<div class="error-message">
            <h3>Content Generation Failed</h3>
            <p>${error.message}</p>
            <p>Please check your connection and try again.</p>
          </div>`,
        },
      };
    }
  },
  // Get all saved materials
  async getAllMaterials() {
    try {
      const response = await apiClient.get("/materials");
      return {
        success: true,
        data: response.data.map((material) => ({
          id: material.id,
          type: reverseTypeMap[material.materialType] || material.materialType?.toLowerCase() || '',
          title: material.topic,
          topic: material.topic,
          subject: material.subject || '',
          preview: material.aiResponse,
          content: material.aiResponse,
          createdAt: material.createdAt,
          created: material.createdAt,
          modified: material.modifiedAt || material.createdAt,
          tags: material.tags || []
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  },

  // Get specific material by ID
  async getMaterial(id) {
    console.log('API Request: GET /materials/' + id);
    try {
      const response = await apiClient.get(`/materials/${id}`);
      console.log('API Response:', response.status, response.data);
      console.log('Raw API response:', response.data);
      
      // Transformiere die API-Antwort in das erwartete Format
      return {
        id: response.data.id,
        title: response.data.topic,
        content: response.data.formattedHtml || response.data.content,
        type: response.data.materialType,
        subject: response.data.subject || '',
        languageLevel: response.data.languageLevel || 'B1',
        vocabPercentage: response.data.vocabPercentage || 30,
        created: response.data.createdAt,
        modified: response.data.modifiedAt,
        tags: response.data.tags || []
      };
    } catch (error) {
      console.error('Error in getMaterial:', error);
      throw error;
    }
  },

  // Create new material
  async createMaterial(materialData) {
    try {
      console.log('[deepinfra-api] createMaterial sending to backend:', JSON.stringify(materialData, null, 2));
      const response = await apiClient.post("/materials", materialData);
      // Die Backend-Antwort sollte bereits das transformierte Material im `data`-Feld haben
      return {
        success: true,
        data: response.data, // Das Backend gibt direkt das LessonMaterialDto zurück
      };
    } catch (error) {
      console.error('[deepinfra-api] Error in createMaterial:', error);
      console.error('[deepinfra-api] Error details:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Fehler beim Erstellen des Materials in API',
        data: error.response?.data // Für detailliertere Fehlermeldungen vom Backend
      };
    }
  },

  // Update existing material
  async updateMaterial(id, materialData) {
    try {
      console.log('Updating material with data:', materialData);
      const response = await apiClient.put(`/materials/${id}`, materialData);
      console.log('Update response:', response.data);
      return {
        success: true,
        data: {
          id: response.data.id,
          title: response.data.topic,
          content: response.data.aiResponse,
          type: response.data.materialType,
          subject: response.data.subject || '',
          language: {
            level: response.data.languageLevel || 'B1',
            vocabPercentage: response.data.vocabPercentage || 30
          },
          created: response.data.createdAt,
          modified: response.data.modifiedAt || response.data.createdAt,
          tags: response.data.tags || []
        },
      };
    } catch (error) {
      console.error('Error updating material:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Delete material
  async deleteMaterial(id) {
    try {
      await apiClient.delete(`/materials/${id}`);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Upload a document for RAG ingestion
  async uploadDocument(file, subject = '') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (subject) {
        formData.append('subject', subject);
      }
      const response = await apiClient.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // List all uploaded documents
  async listDocuments() {
    try {
      const response = await apiClient.get('/documents');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  },

  // Delete documents by IDs
  async deleteDocuments(docIds) {
    try {
      const response = await apiClient.delete('/documents', {
        data: { docIds },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Query documents via RAG
  async queryDocuments(query, topK = 5, subject = '') {
    try {
      const body = { query, topK };
      if (subject) {
        body.subject = subject;
      }
      const response = await apiClient.post('/query', body);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Admin: get system stats
  async getAdminStats() {
    try {
      const response = await apiClient.get('/admin/stats');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Admin: list all users
  async getAdminUsers() {
    try {
      const response = await apiClient.get('/admin/users');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  },

  // Admin: get single user
  async getAdminUser(id) {
    try {
      const response = await apiClient.get(`/admin/users/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Admin: update user roles
  async updateUserRoles(id, roles) {
    try {
      const response = await apiClient.put(`/admin/users/${id}/roles`, { roles });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Admin: delete user
  async deleteUser(id) {
    try {
      await apiClient.delete(`/admin/users/${id}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Health check for backend
  async checkConnection() {
    try {
      const response = await apiClient.get("/materials", { timeout: 5000 });
      return {
        success: true,
        message: "Backend connection successful",
      };
    } catch (error) {
      return {
        success: false,
        message: `Cannot connect to backend: ${error.message}`,
      };
    }
  },

  // --- Subjects ---

  async getSubjects() {
    try {
      const response = await apiClient.get('/subjects');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  },

  async createSubject(name) {
    try {
      const response = await apiClient.post('/subjects', { name });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  async deleteSubject(id) {
    try {
      await apiClient.delete(`/subjects/${id}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};
