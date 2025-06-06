// cache/cacheService.js

const cache = new Map();

function generateKey(trigger) {
  return `trigger:${trigger}`;
}

function get(key) {
  return cache.get(key);
}

function set(key, value) {
  cache.set(key, value);
}

export default {
  generateKey,
  get,
  set,
};