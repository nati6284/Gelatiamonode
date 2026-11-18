import { API_BASE } from './config'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}), ...options.headers },
    ...options,
  })
  const text = await response.text()
  const data = text ? (() => { try { return JSON.parse(text) } catch { return text } })() : null
  if (!response.ok) throw new Error(data?.message || data?.error || `Request failed (${response.status})`)
  return data
}

export const api = {
  // Public
  menu: () => request('/menu'),
  menuByBranch: (branchCode) => request(`/menu/branch/${branchCode}`),
  popularByBranch: (branchCode) => request(`/menu/branch/${branchCode}/popular`),
  branches: () => request('/branches'),
  categories: () => request('/categories'),
  submitFeedback: (payload) => request('/feedback', { method: 'POST', body: JSON.stringify(payload) }),

  // Auth
  adminLogin: payload => request('/admin/login', { method: 'POST', body: JSON.stringify(payload) }),
  adminLogout: (token) => request('/admin/logout', { method: 'POST', token }),

  // Menu catalog admin (global item definitions)
  adminMenu: (token) => request('/admin/menu', { token }),
  createMenuItem: (payload, token) => request('/admin/menu', { method: 'POST', token, body: JSON.stringify(payload) }),
  updateMenuItem: (id, payload, token) => request(`/admin/menu/${id}`, { method: 'PUT', token, body: JSON.stringify(payload) }),
  deleteMenuItem: (id, token) => request(`/admin/menu/${id}`, { method: 'DELETE', token }),

  // Category admin
  adminCategories: (token) => request('/admin/categories', { token }),
  createCategory: (payload, token) => request('/admin/categories', { method: 'POST', token, body: JSON.stringify(payload) }),
  updateCategory: (id, payload, token) => request(`/admin/categories/${id}`, { method: 'PUT', token, body: JSON.stringify(payload) }),
  deleteCategory: (id, token) => request(`/admin/categories/${id}`, { method: 'DELETE', token }),

  // Branch admin
  adminBranches: (token) => request('/admin/branches', { token }),
  createBranch: (payload, token) => request('/admin/branches', { method: 'POST', token, body: JSON.stringify(payload) }),
  updateBranch: (id, payload, token) => request(`/admin/branches/${id}`, { method: 'PUT', token, body: JSON.stringify(payload) }),
  deleteBranch: (id, token) => request(`/admin/branches/${id}`, { method: 'DELETE', token }),

  // Branch-specific menu management
  getBranchMenu: (branchId, token) => request(`/admin/branches/${branchId}/menu`, { token }),
  addItemToBranch: (branchId, menuItemId, fields, token) =>
    request(`/admin/branches/${branchId}/menu/${menuItemId}`, { method: 'POST', token, body: JSON.stringify(fields) }),
  removeItemFromBranch: (branchId, menuItemId, token) =>
    request(`/admin/branches/${branchId}/menu/${menuItemId}`, { method: 'DELETE', token }),
  updateBranchMenuItem: (branchId, menuItemId, fields, token) =>
    request(`/admin/branches/${branchId}/menu/${menuItemId}`, { method: 'PUT', token, body: JSON.stringify(fields) }),

  // Legacy aliases
  getBranchPrices: (branchId, token) => request(`/admin/branches/${branchId}/menu`, { token }),
  updateBranchPrice: (branchId, menuItemId, fields, token) =>
    request(`/admin/branches/${branchId}/menu/${menuItemId}`, { method: 'PUT', token, body: JSON.stringify(fields) }),

  // Feedback admin
  adminFeedback: (token) => request('/admin/feedback', { token }),
  deleteFeedback: (id, token) => request(`/admin/feedback/${id}`, { method: 'DELETE', token }),
}
