import axios from 'axios';

let BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Robustness: ensure full URLs end with /api
if (BASE_URL.startsWith('http') && !BASE_URL.endsWith('/api')) {
    BASE_URL = `${BASE_URL.replace(/\/$/, '')}/api`;
}

// Strip trailing /api to get the root host URL
const HOST_URL = BASE_URL.replace(/\/api$/, '');

const API = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    timeout: 15000,
});

// Request interceptor
API.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
);

// Response interceptor
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !error.config.url.includes('/auth/me')) {
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
    getMe: () => API.get('/auth/me'),
    logout: () => API.post('/auth/logout'),
    status: () => API.get('/auth/status'),
    googleLoginUrl: `${HOST_URL}/api/auth/google`,
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const usersAPI = {
    completeProfile: (data) => API.post('/users/complete-profile', data),
    updateProfile: (data) => API.put('/users/profile', data),
    getProfile: (id) => API.get(`/users/${id}`),
    validateEnrollment: (enrollmentNo) => API.post('/users/validate-enrollment', { enrollmentNo }),
};

// ─── Products ────────────────────────────────────────────────────────────────
export const productsAPI = {
    getAll: (params) => API.get('/products', { params }),
    getOne: (id) => API.get(`/products/${id}`),
    create: (data) => API.post('/products', data),
    update: (id, data) => API.put(`/products/${id}`, data),
    delete: (id) => API.delete(`/products/${id}`),
    getMyListings: (status) => API.get('/products/seller/my-listings', { params: { status } }),
    markSold: (id) => API.patch(`/products/${id}/mark-sold`),
};

// ─── Chats ───────────────────────────────────────────────────────────────────
export const chatsAPI = {
    startChat: (sellerId, productId) => API.post('/chats/start', { sellerId, productId }),
    getChats: () => API.get('/chats'),
    getMessages: (chatId) => API.get(`/chats/${chatId}/messages`),
    sendMessage: (chatId, message) => API.post(`/chats/${chatId}/messages`, { message }),
};

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportsAPI = {
    submit: (data) => API.post('/reports', data),
};

// ─── Lost & Found ─────────────────────────────────────────────────────────────
export const lostFoundAPI = {
    getAll: (params) => API.get('/lost-found', { params }),
    reportLost: (data) => API.post('/lost-found/report-lost', data),
    reportFound: (data) => API.post('/lost-found/report-found', data),
    claimItem: (id) => API.patch(`/lost-found/${id}/claim`),
    deleteItem: (id) => API.delete(`/lost-found/${id}`),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminAPI = {
    getStats: () => API.get('/admin/stats'),
    // Verifications
    getVerifications: () => API.get('/admin/verifications'),
    getVerificationPhoto: (id) => `${HOST_URL}/api/admin/verifications/${id}/photo`,
    approveVerification: (id) => API.post(`/admin/verifications/${id}/approve`),
    rejectVerification: (id, reason) => API.post(`/admin/verifications/${id}/reject`, { reason }),
    // Reports
    getReports: (status) => API.get('/admin/reports', { params: { status } }),
    dismissReport: (id) => API.post(`/admin/reports/${id}/dismiss`),
    removeListing: (id) => API.post(`/admin/reports/${id}/remove-listing`),
    banUser: (id, reason) => API.post(`/admin/reports/${id}/ban-user`, { reason }),
    // Users
    getUsers: (params) => API.get('/admin/users', { params }),
    banUserById: (id, reason) => API.patch(`/admin/users/${id}/ban`, { reason }),
    unbanUser: (id) => API.patch(`/admin/users/${id}/unban`),
    makeAdmin: (id) => API.patch(`/admin/users/${id}/make-admin`),
    // Lost & Found
    getLostFound: (status) => API.get('/admin/lost-found', { params: { status } }),
    verifyClaim: (id) => API.patch(`/admin/lost-found/${id}/verify-claim`),
    deleteLostFound: (id) => API.delete(`/admin/lost-found/${id}`),
    // Logs
    getLogs: (params) => API.get('/admin/logs', { params }),
    // Seller verification submit
    submitVerification: (formData) => API.post('/admin/verify/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export default API;
