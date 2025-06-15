/**
 * @file retry-handler.test.js (Final & Stable Version)
 * @description retry-handler.js 的单元测试
 */

import { executeRequestWithRetry } from "../retry-handler.js";

// 模拟依赖
jest.mock("../../config/api-config.js", () => ({
  getAPIConfig: jest.fn(),
}));

// [!!] 重要：不再使用 jest.useFakeTimers()

describe("executeRequestWithRetry", () => {
  const mockFetcher = jest.fn();
  const mockHooks = {
    onRetry: jest.fn(),
    onFallback: jest.fn((modelId) => Promise.resolve({ model: modelId })),
  };
  const initialConfig = { model: "primary-model" };
  const fallbackModels = [{ id: "fallback-1", name: "Fallback Model 1" }];
  const options = { maxRetries: 2, retryDelay: 100, modelFallback: true, exponentialBackoff: true };

  let setTimeoutSpy;

  beforeEach(() => {
    // 使用 mockReset() 来彻底重置模拟，避免测试间的状态污染
    mockFetcher.mockReset();
    mockHooks.onRetry.mockClear();
    mockHooks.onFallback.mockClear();

    // 关键修正：
    // 监控全局的 setTimeout 函数，并将其实现替换为“立即执行回调”
    setTimeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation((callback) => {
      if (typeof callback === "function") {
        callback();
      }
      // [!!] 修正：返回一个纯 JavaScript 对象，移除 TypeScript 的 "as" 语法
      return { hasRef: () => false };
    });
  });

  afterEach(() => {
    // [!!] 在每个测试后恢复原始的 setTimeout 函数，避免影响其他测试
    setTimeoutSpy.mockRestore();
  });

  it("如果第一次就成功，应直接返回结果且不重试", async () => {
    mockFetcher.mockResolvedValueOnce({ success: true });

    await expect(
      executeRequestWithRetry(
        initialConfig,
        [],
        { ...options, maxRetries: 0 },
        mockFetcher,
        mockHooks
      )
    ).resolves.toEqual({ success: true });

    expect(mockFetcher).toHaveBeenCalledTimes(1);
    expect(mockHooks.onRetry).not.toHaveBeenCalled();
  });

  it("如果遇到可重试的错误，应按次数重试直到成功", async () => {
    mockFetcher
      .mockRejectedValueOnce(new Error("HTTP 错误! 状态码: 503"))
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ success: true });

    // 现在可以直接 await，因为 setTimeout 被模拟为立即执行
    await expect(
      executeRequestWithRetry(initialConfig, [], options, mockFetcher, mockHooks)
    ).resolves.toEqual({ success: true });

    expect(mockFetcher).toHaveBeenCalledTimes(3);
    expect(mockHooks.onRetry).toHaveBeenCalledTimes(2);
  });

  it("如果重试耗尽仍失败，应抛出最后一次的错误", async () => {
    const firstError = new Error("Attempt 1 failed");
    const finalError = new Error("Final error");

    mockFetcher.mockRejectedValueOnce(firstError).mockRejectedValueOnce(finalError);

    await expect(
      executeRequestWithRetry(
        initialConfig,
        [],
        { ...options, maxRetries: 1 },
        mockFetcher,
        mockHooks
      )
    ).rejects.toThrow(finalError);

    expect(mockFetcher).toHaveBeenCalledTimes(2);
    expect(mockHooks.onRetry).toHaveBeenCalledTimes(1);
  });

  it("如果遇到不可重试的错误，应立即失败并不再重试", async () => {
    const fatalError = new Error("HTTP 错误! 状态码: 400");
    mockFetcher.mockRejectedValueOnce(fatalError);

    await expect(
      executeRequestWithRetry(initialConfig, [], options, mockFetcher, mockHooks)
    ).rejects.toThrow(fatalError);

    expect(mockFetcher).toHaveBeenCalledTimes(1);
    expect(mockHooks.onRetry).not.toHaveBeenCalled();
  });

  it("如果主模型失败，应通过钩子尝试回退到备用模型并成功", async () => {
    mockFetcher
      .mockRejectedValueOnce(new Error("primary failed"))
      .mockResolvedValueOnce({ success: true, from: "fallback" });

    await expect(
      executeRequestWithRetry(
        initialConfig,
        fallbackModels,
        { ...options, maxRetries: 0 },
        mockFetcher,
        mockHooks
      )
    ).resolves.toEqual({ success: true, from: "fallback" });

    expect(mockHooks.onFallback).toHaveBeenCalledWith("fallback-1");
    expect(mockFetcher).toHaveBeenCalledTimes(2);
  });
});
