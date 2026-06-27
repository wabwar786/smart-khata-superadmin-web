const DEFAULT_BASE_URL = 'https://smart-khata-production.up.railway.app';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');

const TOKEN_KEY = 'sk_superadmin_token';
const USER_KEY = 'sk_superadmin_user';

export function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
export function getStoredUser() { try { const raw = localStorage.getItem(USER_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export function saveSession(token, user) { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, JSON.stringify(user || {})); }
export function clearSession() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
export function toObject(value) { return value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {}; }
export function toArray(value) { return Array.isArray(value) ? value : []; }

export function money(value, currency = 'PKR') {
  const n = Number(value || 0);
  try { return new Intl.NumberFormat('en-PK', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n); }
  catch { return `${currency} ${n.toLocaleString()}`; }
}
export function number(value) { return Number(value || 0).toLocaleString(); }
export function formatDate(value) { if (!value) return '-'; const d = new Date(value); return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
export function formatDateTime(value) { if (!value) return '-'; const d = new Date(value); return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

async function parseJson(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { success: false, message: text }; }
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) {
    if (response.status === 401) clearSession();
    const err = new Error(data.message || data.error || `Request failed with status ${response.status}`);
    err.status = response.status; err.data = data; throw err;
  }
  return data;
}

export async function login(emailOrPhone, password) {
  const data = await apiRequest('/api/auth/login', { method: 'POST', body: { emailOrPhone, password } });
  const user = toObject(data.user);
  if (!user.isSuperAdmin && !user.is_super_admin) throw new Error('This account is not Super Admin. Promote this user in PostgreSQL first.');
  saveSession(data.token, user);
  return { token: data.token, user };
}

export const AdminApi = {
  dashboard: async () => toObject((await apiRequest('/api/admin/dashboard')).data),
  listBusinesses: async ({ page = 1, search = '' } = {}) => {
    const qs = new URLSearchParams({ page: String(page), limit: '20' }); if (search) qs.set('search', search);
    const data = await apiRequest(`/api/admin/businesses?${qs.toString()}`);
    return { data: toArray(data.data), pagination: toObject(data.pagination) };
  },
  createBusiness: (body) => apiRequest('/api/admin/businesses', { method: 'POST', body }),
  getBusiness: async (publicId) => toObject((await apiRequest(`/api/admin/businesses/${publicId}`)).data),
  updateBusiness: (publicId, body) => apiRequest(`/api/admin/businesses/${publicId}`, { method: 'PATCH', body }),
  setBusinessBlocked: (publicId, isBlocked, reason = '') => apiRequest(`/api/admin/businesses/${publicId}/block`, { method: 'PATCH', body: { isBlocked, reason } }),
  attachSubscription: (publicId, body) => apiRequest(`/api/admin/businesses/${publicId}/subscription`, { method: 'PATCH', body }),
  nearExpiry: async (days = 14) => toArray((await apiRequest(`/api/admin/businesses/near-expiry?days=${days}`)).data),
  businessUsers: async (publicId) => toArray((await apiRequest(`/api/admin/businesses/${publicId}/users`)).data),
  businessCustomers: async (publicId) => toArray((await apiRequest(`/api/admin/businesses/${publicId}/customers`)).data),
  businessProducts: async (publicId) => toArray((await apiRequest(`/api/admin/businesses/${publicId}/products`)).data),
  businessSales: async (publicId) => toArray((await apiRequest(`/api/admin/businesses/${publicId}/sales`)).data),
  businessInventory: async (publicId) => toArray((await apiRequest(`/api/admin/businesses/${publicId}/inventory`)).data),
  businessPerformance: async (publicId) => toObject((await apiRequest(`/api/admin/businesses/${publicId}/performance`)).data),
  billingHistory: async (publicId) => toArray((await apiRequest(`/api/admin/businesses/${publicId}/billing-history`)).data),
  getWhatsapp: async (publicId) => toObject((await apiRequest(`/api/admin/businesses/${publicId}/whatsapp`)).data),
  saveWhatsapp: (publicId, body) => apiRequest(`/api/admin/businesses/${publicId}/whatsapp`, { method: 'PUT', body }),
  listUsers: async ({ page = 1, search = '' } = {}) => {
    const qs = new URLSearchParams({ page: String(page), limit: '20' }); if (search) qs.set('search', search);
    const data = await apiRequest(`/api/admin/users?${qs.toString()}`); return { data: toArray(data.data), pagination: toObject(data.pagination) };
  },
  createSuperUser: (body) => apiRequest('/api/admin/super-users', { method: 'POST', body }),
  setUserActive: (publicId, isActive) => apiRequest(`/api/admin/users/${publicId}/block`, { method: 'PATCH', body: { isActive } }),
  deleteUser: (publicId) => apiRequest(`/api/admin/users/${publicId}`, { method: 'DELETE' }),
  plans: async () => toArray((await apiRequest('/api/admin/plans')).data),
  subscriptionPayments: async (status = '') => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : ''; return toArray((await apiRequest(`/api/admin/subscription-payments${qs}`)).data);
  },
  approvePayment: (id) => apiRequest(`/api/admin/subscription-payments/${id}/approve`, { method: 'POST' }),
  rejectPayment: (id, reason) => apiRequest(`/api/admin/subscription-payments/${id}/reject`, { method: 'POST', body: { reason } }),
};

export function exportCsv(filename, rows) {
  const arr = toArray(rows);
  if (!arr.length) return;
  const keys = Object.keys(arr[0]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [keys.map(esc).join(','), ...arr.map((row) => keys.map((key) => esc(row[key])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}
