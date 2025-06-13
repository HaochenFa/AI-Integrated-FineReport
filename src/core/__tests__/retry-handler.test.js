/**
 * @file retry-handler.test.js (Final Corrected Test)
 * @description retry-handler.js 的单元测试
 */
import { executeRequestWithRetry } from "../retry-handler.js";

jest.mock("../../config/api-config.js", () => ({
  switchToModel: jest.fn(),
  getAPIConfig: jest.fn(),
}));

jest.useFakeTimers();

describe("executeRequestWithRetry", () => {
  const mockFetcher = jest.fn();
  const mockHooks = {
    onRetry: jest.fn(),
    onFallback: jest.fn((modelId) => Promise.resolve({ model: modelId })),
  };
  const initialConfig = { model: "primary-model" };
  const fallbackModels = [{ id: "fallback-1", name: "Fallback Model 1" }];
  const options = { maxRetries: 2, retryDelay: 100, modelFallback: true, exponentialBackoff: true };

  beforeEach(() => {
    mockFetcher.mockClear();
    mockHooks.onRetry.mockClear();
    mockHooks.onFallback.mockClear();
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
  });

  it("如果遇到可重试的错误，应按次数重试直到成功", async () => {
    mockFetcher
      .mockRejectedValueOnce(new Error("HTTP 错误! 状态码: 503"))
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ success: true });

    const promise = executeRequestWithRetry(initialConfig, [], options, mockFetcher, mockHooks);
    await jest.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ success: true });
  });

  // --- 唯一的关键修正点 ---
  it("如果重试耗尽仍失败，应抛出最后一次的错误", async () => {
    const firstError = new Error("Attempt 1 failed");
    const finalError = new Error("Final error");

    // 精确地模拟每一次失败
    mockFetcher
      .mockRejectedValueOnce(firstError) // 第一次尝试失败
      .mockRejectedValueOnce(finalError); // 第二次尝试（重试）也失败

    const promise = executeRequestWithRetry(
      initialConfig,
      [],
      { ...options, maxRetries: 1 },
      mockFetcher,
      mockHooks
    );

    await jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow(finalError);
    expect(mockFetcher).toHaveBeenCalledTimes(2);
    expect(mockHooks.onRetry).toHaveBeenCalledTimes(1);
  });

  it("如果遇到不可重试的错误，应立即失败并不再重试", async () => {
    const fatalError = new Error("HTTP 错误! 状态码: 400");
    mockFetcher.mockRejectedValueOnce(fatalError);
    await expect(
      executeRequestWithRetry(initialConfig, [], options, mockFetcher, mockHooks)
    ).rejects.toThrow(fatalError);
  });

  it("如果主模型失败，应通过钩子尝试回退到备用模型并成功", async () => {
    mockFetcher
      .mockRejectedValueOnce(new Error("primary failed"))
      .mockResolvedValueOnce({ success: true, from: "fallback" });

    const promise = executeRequestWithRetry(
      initialConfig,
      fallbackModels,
      { ...options, maxRetries: 0 },
      mockFetcher,
      mockHooks
    );
    await jest.runAllTimersAsync();

    await expect(promise).resolves.toEqual({ success: true, from: "fallback" });
    expect(mockHooks.onFallback).toHaveBeenCalledWith("fallback-1");
  });
});
