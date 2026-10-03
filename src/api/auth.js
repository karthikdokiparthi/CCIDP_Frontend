import { api, unwrap } from './client';

export function getMe() {
  return api.get('/auth/me').then(unwrap);
}

export function login(username, password) {
  return api.post('/auth/login', { username, password }).then(unwrap);
}

export function verifyMfa(mfaChallengeToken, code) {
  return api
    .post('/auth/mfa/verify', { mfaChallengeToken, code })
    .then(unwrap);
}

export function verifyMfaRecovery(mfaChallengeToken, code) {
  return api
    .post('/auth/mfa/recovery', { mfaChallengeToken, code })
    .then(unwrap);
}

export function logout(refreshToken) {
  return api.post('/auth/logout', { refreshToken }).then(unwrap);
}

export function forgotPassword(email) {
  return api.post('/auth/forgot-password', { email }).then(unwrap);
}

export function signup(firstName, lastName, email, username) {
  return api.post('/auth/signup', { firstName, lastName, email, username }).then(unwrap);
}

export function verifySignupOtp(email, otp) {
  return api.post('/auth/signup/verify-otp', { email, otp }).then(unwrap);
}

export function setSignupPassword(email, password) {
  return api.post('/auth/signup/set-password', { email, password }).then(unwrap);
}

export function resetPassword(email, otp, newPassword) {
  return api.post('/auth/reset-password', { email, otp, newPassword }).then(unwrap);
}

export function getMfaStatus() {
  return api.get('/mfa/status').then(unwrap);
}

export function enrollMfa() {
  return api.post('/mfa/enroll').then(unwrap);
}

export function confirmMfa(code) {
  return api.post('/mfa/confirm', { code }).then(unwrap);
}

export function disableMfa(code) {
  return api.post('/mfa/disable', { code }).then(unwrap);
}

export function getOwnSessions() {
  return api.get('/sessions').then(unwrap);
}

export function revokeOwnSession(sessionId) {
  return api.delete(`/sessions/${sessionId}`).then(unwrap);
}

export function logoutAll() {
  return api.post('/auth/logout-all').then(unwrap);
}

export function getMyAudit({ eventType, page = 0, size = 10 } = {}) {
  return api.get('/audit/me', { params: { eventType, page, size } }).then(unwrap);
}
