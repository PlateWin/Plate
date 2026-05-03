const LOCAL_DEV_API_ROOT = 'http://localhost:3001/api';

function resolveApiRoot() {
  if (window.__PLATE_API_ROOT__) return window.__PLATE_API_ROOT__.replace(/\/$/, '');
  const isLocalVite = ['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.port !== '3001';
  return isLocalVite ? LOCAL_DEV_API_ROOT : '/api';
}

export const API_ROOT = resolveApiRoot();
export const POSTS_URL = `${API_ROOT}/posts`;
export const CONFIG_URL = `${API_ROOT}/config`;
export const FRAGMENTS_URL = `${API_ROOT}/fragments`;
export const AI_URL = `${API_ROOT}/ai`;
