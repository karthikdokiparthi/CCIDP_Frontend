import axios from 'axios';
import { api, apiOrigin, getAccessToken, unwrap } from './client';

function originPath(path) {
  const origin = apiOrigin();
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return origin ? `${origin}${suffix}` : suffix;
}

export function getDashboard() {
  return api.get('/admin/dashboard').then(unwrap);
}

export function getSystemStats() {
  return api.get('/admin/stats/system').then(unwrap);
}

export function getSecurityStats(hours = 24) {
  return api.get('/admin/stats/security', { params: { hours } }).then(unwrap);
}

export function getHealth() {
  const token = getAccessToken();
  return axios
    .get(originPath('/actuator/health'), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    .then((response) => response.data);
}

export function searchUsers({ q, status, page = 0, size = 20 } = {}) {
  return api
    .get('/admin/users', { params: { q, status, page, size } })
    .then(unwrap);
}

export function getAdminUser(id) {
  return api.get(`/admin/users/${id}`).then(unwrap);
}

export function createUser(payload) {
  return api.post('/users', payload).then(unwrap);
}

export function updateUser(id, payload) {
  return api.put(`/users/${id}`, payload).then(unwrap);
}

export function updateUserStatus(id, status) {
  return api.patch(`/users/${id}/status`, { status }).then(unwrap);
}

export function setUserPassword(id, password) {
  return api.post(`/users/${id}/credentials`, { password }).then(unwrap);
}

export function setUserAdminPassword(id, newPassword) {
  return api.put(`/users/${id}/credentials/password/admin`, { newPassword }).then(unwrap);
}

export function changeUserPassword(id, currentPassword, newPassword) {
  return api
    .put(`/users/${id}/credentials/password`, { currentPassword, newPassword })
    .then(unwrap);
}

export async function deleteUser(id) {
  await api.delete(`/users/${id}`);
}

export function setUserMfaRequired(id, mfaRequired) {
  return api.put(`/users/${id}/mfa`, { mfaRequired }).then(unwrap);
}

export function assignUserRole(userId, roleId) {
  return api.post(`/users/${userId}/roles/${roleId}`).then(unwrap);
}

export function listUserRoles(userId) {
  return api.get(`/users/${userId}/roles`).then(unwrap);
}

export function removeUserRole(userId, roleId) {
  return api.delete(`/users/${userId}/roles/${roleId}`).then(unwrap);
}

export function searchRoles({ page = 0, size = 20 } = {}) {
  return api.get('/admin/roles', { params: { page, size } }).then(unwrap);
}

export function listRoles() {
  return api.get('/roles').then(unwrap);
}

export function getRole(id) {
  return api.get(`/roles/${id}`).then(unwrap);
}

export function createRole(payload) {
  return api.post('/roles', payload).then(unwrap);
}

export function updateRole(id, payload) {
  return api.put(`/roles/${id}`, payload).then(unwrap);
}

export function deleteRole(id) {
  return api.delete(`/roles/${id}`).then(unwrap);
}

export function listPermissions() {
  return api.get('/permissions').then(unwrap);
}

export function getPermission(id) {
  return api.get(`/permissions/${id}`).then(unwrap);
}

export function createPermission(payload) {
  return api.post('/permissions', payload).then(unwrap);
}

export function updatePermission(id, payload) {
  return api.put(`/permissions/${id}`, payload).then(unwrap);
}

export function deletePermission(id) {
  return api.delete(`/permissions/${id}`).then(unwrap);
}

export function getRolePermissions(roleId) {
  return api.get(`/roles/${roleId}/permissions`).then(unwrap);
}

export function assignRolePermission(roleId, permissionId) {
  return api.post(`/roles/${roleId}/permissions/${permissionId}`).then(unwrap);
}

export function removeRolePermission(roleId, permissionId) {
  return api.delete(`/roles/${roleId}/permissions/${permissionId}`).then(unwrap);
}

export function searchClients({ q, status, page = 0, size = 20 } = {}) {
  return api
    .get('/admin/clients', { params: { q, status, page, size } })
    .then(unwrap);
}

export function getClient(id) {
  return api.get(`/oauth/clients/${id}`).then(unwrap);
}

export function createClient(payload) {
  return api.post('/oauth/clients', payload).then(unwrap);
}

export function updateClient(id, payload) {
  return api.put(`/oauth/clients/${id}`, payload).then(unwrap);
}

export function rotateClientSecret(id) {
  return api.post(`/oauth/clients/${id}/rotate-secret`).then(unwrap);
}

export function disableClient(id) {
  return api.post(`/oauth/clients/${id}/disable`).then(unwrap);
}

export function enableClient(id) {
  return api.post(`/oauth/clients/${id}/enable`).then(unwrap);
}

export function deleteClient(id) {
  return api.delete(`/oauth/clients/${id}`).then(unwrap);
}

export function searchSessions({ userId, page = 0, size = 20 } = {}) {
  return api
    .get('/admin/sessions', { params: { userId, page, size } })
    .then(unwrap);
}

export function revokeSession(userId, sessionId) {
  return api.delete(`/users/${userId}/sessions/${sessionId}`).then(unwrap);
}

export function revokeAllSessions(userId) {
  return api.delete(`/users/${userId}/sessions`).then(unwrap);
}

export function listUserSessions(userId) {
  return api.get(`/users/${userId}/sessions`).then(unwrap);
}

export function searchAudit({ userId, eventType, page = 0, size = 20 } = {}) {
  return api
    .get('/admin/audit', { params: { userId, eventType, page, size } })
    .then(unwrap);
}

export function getOpenIdConfiguration() {
  return axios.get(originPath('/.well-known/openid-configuration')).then((response) => response.data);
}
