/**
 * @file request-cache.test.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description request-cache.js 的单元测试。
 */

import { getFromCache, saveToCache, clearCache, getCacheSize } from "../request-cache.js";

// 使用 Jest 的模拟计时器来控制时间
jest.useFakeTimers();

describe("request-cache.js", () => {
  // 在每个测试用例运行前，清空缓存并重置所有模拟
  beforeEach(() => {
    clearCache();
    jest.clearAllMocks();
  });

  describe("saveToCache 和 getCacheSize", () => {
    it("应该能正确保存数据，并且 getCacheSize 能返回正确的数量", () => {
      expect(getCacheSize()).toBe(0);
      saveToCache("key1", { data: "value1" });
      expect(getCacheSize()).toBe(1);
      saveToCache("key2", { data: "value2" });
      expect(getCacheSize()).toBe(2);
    });
  });

  describe("getFromCache", () => {
    it("应该能获取到已保存且未过期的缓存", () => {
      const key = "test-key";
      const data = { message: "hello" };
      saveToCache(key, data);

      const result = getFromCache(key, 5000); // 5秒有效期
      expect(result).toEqual(data);
    });

    it("对于不存在的键，应该返回 null", () => {
      expect(getFromCache("non-existent-key", 5000)).toBeNull();
    });
  });

  describe("缓存过期 (TTL) 逻辑", () => {
    const key = "ttl-test";
    const data = { status: "ok" };
    const ttl = 30000; // 30秒有效期

    it("在缓存过期之前，应该能成功获取数据", () => {
      saveToCache(key, data);

      // 模拟时间流逝了 29 秒
      jest.advanceTimersByTime(29000);

      expect(getFromCache(key, ttl)).toEqual(data);
      expect(getCacheSize()).toBe(1);
    });

    it("在缓存过期之后，应该返回 null 并且清除该缓存项", () => {
      saveToCache(key, data);

      // 模拟时间流逝了 30.001 秒
      jest.advanceTimersByTime(30001);

      expect(getFromCache(key, ttl)).toBeNull();
      // 验证缓存项是否已被自动删除
      expect(getCacheSize()).toBe(0);
    });
  });

  describe("clearCache", () => {
    it("调用 clearCache() 不带参数时，应清空所有缓存", () => {
      saveToCache("key1", "data1");
      saveToCache("key2", "data2");
      expect(getCacheSize()).toBe(2);

      clearCache();
      expect(getCacheSize()).toBe(0);
    });

    it("调用 clearCache(key) 带参数时，应只清除指定的缓存项", () => {
      saveToCache("key1", "data1");
      saveToCache("key2", "data2");
      expect(getCacheSize()).toBe(2);

      clearCache("key1");
      expect(getCacheSize()).toBe(1);
      expect(getFromCache("key1", 5000)).toBeNull();
      expect(getFromCache("key2", 5000)).toBe("data2");
    });
  });
});
