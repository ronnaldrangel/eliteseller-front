/**
 * Configuración centralizada para Strapi
 * Este archivo contiene todas las configuraciones, endpoints y utilidades para interactuar con Strapi
 */

// Configuración base
const STRAPI_CONFIG = {
  apiUrl: process.env.STRAPI_API_URL,
  apiToken: process.env.STRAPI_API_TOKEN,
}

// Validación de configuración
if (!STRAPI_CONFIG.apiUrl) {
  throw new Error("STRAPI_API_URL environment variable is required")
}

// Endpoints de Strapi
export const STRAPI_ENDPOINTS = {
  // Autenticación
  auth: {
    login: '/api/auth/local',
    register: '/api/auth/local/register',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
    sendEmailConfirmation: '/api/auth/send-email-confirmation',
  },
  // Usuarios
  users: {
    list: '/api/users',
    byEmail: (email) => `/api/users?filters[email][$eq]=${email}`,
  }
}

// Headers por defecto para las peticiones
export const getDefaultHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  }
  
  if (STRAPI_CONFIG.apiToken) {
    headers['Authorization'] = `Bearer ${STRAPI_CONFIG.apiToken}`
  }
  
  return headers
}

// Función para construir URL completa
export const buildStrapiUrl = (endpoint) => {
  return `${STRAPI_CONFIG.apiUrl}${endpoint}`
}

// Función para hacer peticiones a Strapi con configuración centralizada
export const strapiRequest = async (endpoint, options = {}) => {
  const url = buildStrapiUrl(endpoint)
  const defaultOptions = {
    headers: getDefaultHeaders(),
  }
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  }
  
  console.log(`🌐 Strapi Request: ${options.method || 'GET'} ${url}`)
  
  try {
    const response = await fetch(url, mergedOptions)
    return response
  } catch (error) {
    console.error('Strapi request failed:', error)
    throw error
  }
}

// Funciones específicas para autenticación
export const strapiAuth = {
  login: async (credentials) => {
    return strapiRequest(STRAPI_ENDPOINTS.auth.login, {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },
  
  register: async (userData) => {
    return strapiRequest(STRAPI_ENDPOINTS.auth.register, {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },
  
  forgotPassword: async (email) => {
    return strapiRequest(STRAPI_ENDPOINTS.auth.forgotPassword, {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },
  
  resetPassword: async (resetData) => {
    return strapiRequest(STRAPI_ENDPOINTS.auth.resetPassword, {
      method: 'POST',
      body: JSON.stringify(resetData),
    })
  },
  
  sendEmailConfirmation: async (email) => {
    return strapiRequest(STRAPI_ENDPOINTS.auth.sendEmailConfirmation, {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },
}

// Funciones específicas para usuarios
export const strapiUsers = {
  findByEmail: async (email) => {
    return strapiRequest(STRAPI_ENDPOINTS.users.byEmail(email))
  },
  
  list: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      queryParams.append(key, value)
    })
    
    const endpoint = queryParams.toString() 
      ? `${STRAPI_ENDPOINTS.users.list}?${queryParams.toString()}`
      : STRAPI_ENDPOINTS.users.list
      
    return strapiRequest(endpoint)
  },
}

// Exportar configuración para casos especiales
export const getStrapiConfig = () => ({
  apiUrl: STRAPI_CONFIG.apiUrl,
  apiToken: STRAPI_CONFIG.apiToken,
})

export default {
  endpoints: STRAPI_ENDPOINTS,
  request: strapiRequest,
  auth: strapiAuth,
  users: strapiUsers,
  config: getStrapiConfig,
  buildUrl: buildStrapiUrl,
  getHeaders: getDefaultHeaders,
}