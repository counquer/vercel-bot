// services/cacheService.js

const cache = new Map();

const cacheService = {
  get(key) {
    return cache.has(key) ? cache.get(key).value : null;
  },

  set(key, value, ttlSeconds = 300) {
    const expireAt = Date.now() + ttlSeconds * 1000;
    cache.set(key, { value, expireAt });

    setTimeout(() => {
      const item = cache.get(key);
      if (item && Date.now() >= item.expireAt) {
        cache.delete(key);
      }
    }, ttlSeconds * 1000);
  },

  has(key) {
    return cache.has(key);
  },

  clear() {
    cache.clear();
  },

  check() {
    return true; // Hook de prueba para health.js
  },

  generateKey(trigger) {
    return `trigger-${trigger.trim().toLowerCase()}`;
  }
};

export default cacheService;
