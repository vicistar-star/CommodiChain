import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  getChallenge: (data) => api.post('/auth/challenge', data),
  verifyChallenge: (data) => api.post('/auth/verify', data),
  refreshToken: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.patch('/auth/profile', data),
}

// NFT API
export const nftAPI = {
  mint: (data) => api.post('/nft/mint', data),
  transfer: (data) => api.post('/nft/transfer', data),
  burn: (data) => api.post('/nft/burn', data),
  verify: (assetCode, issuer) => api.get(`/nft/verify/${assetCode}/${issuer}`),
  getOwned: (ownerAddress, params = {}) => api.get(`/nft/owned/${ownerAddress}`, { params }),
  getTransactionHistory: (assetCode, params = {}) => api.get(`/nft/transactions/${assetCode}`, { params }),
}

// Commodity API
export const commodityAPI = {
  register: (data) => api.post('/commodity/register', data),
  get: (batchId) => api.get(`/commodity/${batchId}`),
  getByProducer: (producerId, params = {}) => api.get(`/commodity/producer/${producerId}`, { params }),
  updateStatus: (batchId, data) => api.patch(`/commodity/${batchId}/status`, data),
  getStatistics: (params = {}) => api.get('/commodity/statistics', { params }),
  getAll: (params = {}) => api.get('/commodity', { params }),
}

export default api
