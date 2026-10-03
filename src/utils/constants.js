export const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED'];
export const ACCOUNT_TYPES = ['EMPLOYEE', 'ADMIN', 'SERVICE'];
export const CLIENT_STATUSES = ['ACTIVE', 'DISABLED'];
export const CLIENT_TYPES = ['CONFIDENTIAL', 'PUBLIC'];

export const AUDIT_EVENT_TYPES = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'LOGIN_MFA_REQUIRED',
  'MFA_SUCCESS',
  'MFA_FAILURE',
  'MFA_ENROLL',
  'MFA_CONFIRM',
  'MFA_DISABLE',
  'LOGOUT',
  'LOGOUT_ALL',
  'SESSION_REVOKE',
  'CLIENT_CREATE',
  'CLIENT_UPDATE',
  'CLIENT_DELETE',
  'PASSWORD_RESET',
];

export const GRANT_TYPES = [
  'authorization_code',
  'refresh_token',
  'client_credentials',
];
