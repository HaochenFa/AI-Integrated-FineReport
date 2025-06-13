/**
 * @file request-cache.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description 请求缓存模块 - 封装所有关于缓存的操作
 */

/**
 * 缓存存储容器
 * @type {Map<string, {data: any, timestamp: number}>}
 */
const resultCache = new Map();

/**
 * 从缓存中获取结果
 * @param {string} key - 缓存键
 * @param {number} ttl - 缓存有效期 (毫秒)
 * @returns {any|null} 缓存的数据或null
 */
function getFromCache(key, ttl) {
  if (!resultCache.has(key)) {
    return null;
  }

  const cachedItem = resultCache.get(key);
  const now = Date.now();

  // 检查缓存是否过期
  if (now - cachedItem.timestamp > ttl) {
    resultCache.delete(key);
    return null;
  }

  return cachedItem.data;
}

/**
 * 将结果存入缓存
 * @param {string} key - 缓存键
 * @param {any} data - 要缓存的数据
 */
function saveToCache(key, data) {
  resultCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * 清除缓存
 * @param {string} [key] - 可选的缓存键。如果提供，则删除指定项；否则清除所有缓存。
 */
function clearCache(key) {
  if (key) {
    resultCache.delete(key);
  } else {
    resultCache.clear();
  }
}

/**
 * 获取当前缓存中的项目数量
 * @returns {number} 缓存大小
 */
function getCacheSize() {
  return resultCache.size;
}

export { getFromCache, saveToCache, clearCache, getCacheSize };
