/**
 * @file performance-monitor.test.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description performance-monitor.js 模块的单元测试
 */

import { jest } from "@jest/globals";

let performanceMonitor;

// 模拟 localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
// 将可写的 localStorage 挂载到全局对象上
Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true, // 关键：允许我们在测试中修改它
});

describe("performance-monitor.js", () => {
  let initialTime;
  let errorSpy;

  beforeEach(async () => {
    jest.resetModules();
    performanceMonitor = await import("../performance-monitor.js");

    Object.values(localStorageMock).forEach((mockFn) => mockFn.mockClear());

    initialTime = 1677610000000;
    jest.spyOn(Date, "now").mockReturnValue(initialTime);

    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // 确保在每个测试后恢复 localStorage
    Object.defineProperty(global, "localStorage", { value: localStorageMock, writable: true });
  });

  // 新增测试用例
  it("在没有 localStorage 的环境中，持久化相关函数应直接返回", () => {
    global.localStorage = undefined; // 模拟没有 localStorage 的环境

    // 重新加载模块以应用无localStorage的环境
    jest.resetModules();
    return import("../performance-monitor.js").then((pm) => {
      pm.configurePerformanceMonitor({ persistData: true });
      // 验证 reset 调用了 removeItem，但因为 localStorage 未定义，所以 spy 不会被调用
      pm.resetPerformanceData();
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();

      // 验证 endRequest 调用了 setItem，但因为 localStorage 未定义，所以 spy 不会被调用
      pm.endRequest(pm.startRequest("p"), "success");
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe("Configuration", () => {
    it("如果监控被禁用，多个函数应直接返回", () => {
      performanceMonitor.configurePerformanceMonitor({ enabled: false });

      expect(performanceMonitor.startRequest("test")).toBeNull();
      performanceMonitor.endRequest("some-id", "success");
      performanceMonitor.recordRetry("some-id");

      const data = performanceMonitor.getPerformanceData();
      expect(data.overall.totalRequests).toBe(0);
    });

    it("当localStorage为空时，加载持久化数据不应报错", () => {
      localStorageMock.getItem.mockReturnValue(null);
      performanceMonitor.configurePerformanceMonitor({ persistData: true });
      // 不报错即为通过
    });

    it("当localStorage中数据损坏时，应能捕获异常", () => {
      localStorageMock.getItem.mockReturnValue('{"bad json":,');
      performanceMonitor.configurePerformanceMonitor({ persistData: true });
      expect(errorSpy).toHaveBeenCalledWith("加载持久化性能数据出错:", expect.any(Error));
    });
  });

  // ... 其他所有 describe 和 it 块保持不变 ...
  describe("Request Lifecycle & Stats", () => {
    it("应该正确记录一个包含所有元数据的成功请求", () => {
      const requestId = performanceMonitor.startRequest("prompt 1", {}, "model-a");
      Date.now.mockReturnValue(initialTime + 200);

      const metadata = { tokenUsage: { promptTokens: 10, completionTokens: 50, totalTokens: 60 } };
      performanceMonitor.endRequest(requestId, "success", null, null, metadata);

      const data = performanceMonitor.getPerformanceData();
      expect(data.overall.successfulRequests).toBe(1);
      expect(data.tokenUsage.totalTokens).toBe(60);
    });

    it("应该正确处理一个失败的请求", () => {
      const requestId = performanceMonitor.startRequest("fail prompt", {}, "model-a");
      performanceMonitor.endRequest(requestId, "error");
      const data = performanceMonitor.getPerformanceData();
      expect(data.overall.failedRequests).toBe(1);
      expect(data.modelPerformance["model-a"].failedRequests).toBe(1);
    });

    it("应该正确记录重试和模型回退", () => {
      const requestId = performanceMonitor.startRequest("fallback", {}, "model-a");
      performanceMonitor.recordRetry(requestId);
      performanceMonitor.recordModelFallback(requestId, "model-b");
      performanceMonitor.endRequest(requestId, "success");

      const data = performanceMonitor.getPerformanceData();
      expect(data.overall.totalRetries).toBe(1);
      expect(data.overall.totalModelFallbacks).toBe(1);
    });

    it("当达到最近请求上限时，应移除旧的记录", () => {
      performanceMonitor.configurePerformanceMonitor({ maxRecentRequests: 1 });
      performanceMonitor.endRequest(performanceMonitor.startRequest("req 1"), "success");
      performanceMonitor.endRequest(performanceMonitor.startRequest("req 2"), "success");

      const data = performanceMonitor.getPerformanceData();
      expect(data.recentRequests).toHaveLength(1);
    });
  });

  describe("Cache Stats", () => {
    it("应该正确处理缓存命中和未命中", () => {
      const reqId = performanceMonitor.startRequest("hit");
      performanceMonitor.recordCacheHit(reqId);
      performanceMonitor.recordCacheMiss();
      const data = performanceMonitor.getPerformanceData();
      expect(data.cacheStats.hits).toBe(1);
      expect(data.cacheStats.misses).toBe(1);
    });
  });

  describe("Persistence", () => {
    it("当localStorage写入失败时，应能捕获异常", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage full");
      });

      performanceMonitor.configurePerformanceMonitor({ persistData: true });
      performanceMonitor.endRequest(performanceMonitor.startRequest("p"), "success");
      expect(errorSpy).toHaveBeenCalledWith("持久化存储性能数据出错:", expect.any(Error));
    });

    it("resetPerformanceData 应该能调用 removeItem", () => {
      performanceMonitor.configurePerformanceMonitor({ persistData: true });
      performanceMonitor.resetPerformanceData();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("aida_performance_data");
    });
  });

  describe("Utility Functions", () => {
    it("formatDuration 应该能正确格式化时间", () => {
      expect(performanceMonitor.formatDuration(500)).toBe("500毫秒");
      expect(performanceMonitor.formatDuration(1500)).toBe("1.50秒");
      expect(performanceMonitor.formatDuration(65500)).toBe("1分5.50秒");
    });
  });
});
