const DEFAULT_BASE_URL = 'https://smart-khata-production.up.railway.app';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');

const TOKEN_KEY = 'sk_superadmin_token';
const USER_KEY = 'sk_superadmin_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user || {}));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function toObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return { ...value };
}

export function toArray(value) {
  return Array.isArray(value) ? value : [];
}

export function money(value, currency = 'PKR') {
  const n = Number(value || 0);
  try {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch (_) {
    return `${currency} ${n.toLocaleString()}`;
  }
}

export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_) {
    return { success: false, message: text };
  }
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body,
  });

  const data = await parseJson(response);

  if (!response.ok || data.success === false) {
    if (response.status === 401) clearSession();
    const message = data.message || data.error || `Request failed with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function login(emailOrPhone, password) {
  const data = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { emailOrPhone, password },
  });
  const user = toObject(data.user);
  if (!user.isSuperAdmin && !user.is_super_admin) {
    throw new Error('This account is not Super Admin. Promote the user in PostgreSQL first.');
  }
  saveSession(data.token, user);
  return { token: data.token, user };
}

export async function loadMe() {
  const data = await apiRequest('/api/auth/me');
  return toObject(data.user);
}

export async function adminDashboard() {
  const data = await apiRequest('/api/admin/dashboard');
  return toObject(data.data);
}

export async function listBusinesses({ page = 1, search = '' } = {}) {
  const qs = new URLSearchParams({ page: String(page), limit: '20' });
  if (search) qs.set('search', search);
  const data = await apiRequest(`/api/admin/businesses?${qs.toString()}`);
  return {
    data: toArray(data.data),
    pagination: toObject(data.pagination),
  };
}

export async function setBusinessBlocked(publicId, isBlocked, reason = '') {
  return apiRequest(`/api/admin/businesses/${publicId}/block`, {
    method: 'PATCH',
    body: { isBlocked, reason },
  });
}

export async function listSubscriptionPayments(status = '') {
  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiRequest(`/api/admin/subscription-payments${suffix}`);
  return toArray(data.data);
}

export async function approvePayment(id) {
  return apiRequest(`/api/admin/subscription-payments/${id}/approve`, { method: 'POST' });
}

export async function rejectPayment(id, reason) {
  return apiRequest(`/api/admin/subscription-payments/${id}/reject`, {
    method: 'POST',
    body: { reason },
  });
}

export async function listPlans() {
  const data = await apiRequest('/api/subscriptions/plans');
  return toArray(data.data);
}
