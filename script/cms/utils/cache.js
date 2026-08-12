/* utils/cache.js
 * Role: cache générique localStorage avec TTL, pour éviter les rechargements
 * inutiles d'API entre les vues du router SPA et les cold starts Render.
 */

const DEFAULT_TTL = 5 * 60 * 1000; // 5 min — Ripoll publie via Strapi, on ne veut pas de contenu périmé trop longtemps

export function getCached(key, ttlMs = DEFAULT_TTL) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > ttlMs) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch (e) {
    console.warn(`[cache] lecture échouée pour ${key}:`, e.message);
    return null;
  }
}

export function setCached(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    // Quota dépassé ou localStorage désactivé — pas bloquant, on continue sans cache
    console.warn(`[cache] écriture échouée pour ${key}:`, e.message);
  }
}

export function clearCache(key) {
  localStorage.removeItem(key);
}

export function clearAllCache() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('cms:'));
  keys.forEach(k => localStorage.removeItem(k));
  return keys.length;
}