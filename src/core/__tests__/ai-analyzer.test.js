/**
 * @file ai-analyzer.test.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description ai-analyzer.js 模块的单元测试
 */

import { jest } from "@jest/globals";

// Mock all direct dependencies of ai-analyzer.js
jest.mock("../request-cache.js");
jest.mock("../analyzer-utils.js");
jest.mock("../api-fetcher.js");
jest.mock("../retry-handler.js");
jest.mock("../performance-monitor.js");
jest.mock("../../config/api-config.js");
jest.mock("../../ui/loading-indicator.js");
jest.mock("../../ui/message-box.js");

describe("ai-analyzer.js", () => {
  let aiAnalyzer;
  let mockCache;
  let mockUtils;
  let mockFetcher;
  let mockRetryHandler;
  let mockMonitor;
  let mockApiConfig;
  let mockLoadingIndicator;
  let mockMessageBox;

  beforeEach(async () => {
    jest.resetModules();

    // Dynamically import the module after mocks are set up
    aiAnalyzer = await import("../ai-analyzer.js");

    // Get mocked modules
    mockCache = await import("../request-cache.js");
    mockUtils = await import("../analyzer-utils.js");
    mockFetcher = await import("../api-fetcher.js");
    mockRetryHandler = await import("../retry-handler.js");
    mockMonitor = await import("../performance-monitor.js");
    mockApiConfig = await import("../../config/api-config.js");
    mockLoadingIndicator = await import("../../ui/loading-indicator.js");
    mockMessageBox = await import("../../ui/message-box.js");

    // Reset mocks before each test
    for (const mock of [
      mockCache,
      mockUtils,
      mockFetcher,
      mockRetryHandler,
      mockMonitor,
      mockApiConfig,
      mockLoadingIndicator,
      mockMessageBox,
    ]) {
      for (const key in mock) {
        if (typeof mock[key] === "function") {
          mock[key].mockClear();
        }
      }
    }

    // Default mock implementations
    mockApiConfig.getAPIConfig.mockReturnValue({
      model: "default-model",
      endpoint: "http://api.example.com",
    });
    mockApiConfig.getFallbackModels.mockReturnValue(["fallback-model-1", "fallback-model-2"]);
    mockUtils.generateCacheKey.mockReturnValue("mock-cache-key");
    mockCache.getFromCache.mockReturnValue(null);
    mockCache.saveToCache.mockReturnValue(undefined);
    mockRetryHandler.executeRequestWithRetry.mockResolvedValue(
      JSON.stringify({ analysis: "mocked result" })
    );
    mockMonitor.startRequest.mockReturnValue("mock-request-id");
    mockMonitor.endRequest.mockReturnValue(undefined);
    mockMonitor.recordCacheHit.mockReturnValue(undefined);
    mockMonitor.recordCacheMiss.mockReturnValue(undefined);
    mockMonitor.recordRetry.mockReturnValue(undefined);
    mockMonitor.recordModelFallback.mockReturnValue(undefined);
    mockLoadingIndicator.showLoadingIndicator.mockReturnValue(undefined);
    mockLoadingIndicator.hideLoadingIndicator.mockReturnValue(undefined);
    mockMessageBox.showErrorMessage.mockReturnValue(undefined);
  });

  // Test 1: analyzeWithAI should call core analysis function and return result
  test("analyzeWithAI should call _runAnalysisCore with standard fetcher and return result", async () => {
    const prompt = "test prompt";
    const options = { useCache: false };
    const dataTimestamp = "2023-01-01";
    const expectedResult = { analysis: "mocked result" };

    const result = await aiAnalyzer.analyzeWithAI(prompt, options, dataTimestamp);

    expect(mockLoadingIndicator.showLoadingIndicator).toHaveBeenCalledTimes(1);
    expect(mockRetryHandler.executeRequestWithRetry).toHaveBeenCalledTimes(1);
    expect(mockMonitor.endRequest).toHaveBeenCalledWith(
      "mock-request-id",
      "success",
      expectedResult
    );
    expect(mockLoadingIndicator.hideLoadingIndicator).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedResult);
  });

  // Test 2: streamAnalyzeWithAI should call core analysis function with stream fetcher
  test("streamAnalyzeWithAI should call _runAnalysisCore with stream fetcher", async () => {
    const prompt = "stream prompt";
    const onChunk = jest.fn();
    const onComplete = jest.fn();
    const dataTimestamp = "2023-01-02";

    await aiAnalyzer.streamAnalyzeWithAI(prompt, {}, onChunk, onComplete, dataTimestamp);

    expect(mockLoadingIndicator.showLoadingIndicator).toHaveBeenCalledTimes(1);
    expect(mockRetryHandler.executeRequestWithRetry).toHaveBeenCalledTimes(1);
    expect(mockMonitor.endRequest).toHaveBeenCalledWith("mock-request-id", "success", {
      analysis: "mocked result",
    });
    expect(mockLoadingIndicator.hideLoadingIndicator).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({ analysis: "mocked result" });
  });

  // Test 3: Caching mechanism - cache hit
  test("should return cached result if available", async () => {
    const cachedData = { analysis: "cached data" };
    mockCache.getFromCache.mockReturnValue(cachedData);

    const prompt = "cached prompt";
    const result = await aiAnalyzer.analyzeWithAI(prompt);

    expect(mockCache.getFromCache).toHaveBeenCalledTimes(1);
    expect(mockMonitor.recordCacheHit).toHaveBeenCalledTimes(1);
    expect(mockRetryHandler.executeRequestWithRetry).not.toHaveBeenCalled(); // Should not call fetcher if cache hit
    expect(result).toEqual(cachedData);
  });

  // Test 4: Caching mechanism - cache miss, then save to cache
  test("should fetch and save to cache if no cached result", async () => {
    const prompt = "new prompt";
    const expectedResult = { analysis: "new result" };
    mockRetryHandler.executeRequestWithRetry.mockResolvedValue(JSON.stringify(expectedResult));

    const result = await aiAnalyzer.analyzeWithAI(prompt);

    expect(mockCache.getFromCache).toHaveBeenCalledTimes(1);
    expect(mockMonitor.recordCacheMiss).toHaveBeenCalledTimes(1);
    expect(mockRetryHandler.executeRequestWithRetry).toHaveBeenCalledTimes(1);
    expect(mockCache.saveToCache).toHaveBeenCalledWith("mock-cache-key", expectedResult);
    expect(result).toEqual(expectedResult);
  });

  // Test 5: Error handling during analysis
  test("should handle errors during analysis and show error message", async () => {
    const errorMessage = "Network error";
    mockRetryHandler.executeRequestWithRetry.mockRejectedValue(new Error(errorMessage));

    const prompt = "error prompt";
    const result = await aiAnalyzer.analyzeWithAI(prompt);

    expect(mockLoadingIndicator.showLoadingIndicator).toHaveBeenCalledTimes(1);
    expect(mockRetryHandler.executeRequestWithRetry).toHaveBeenCalledTimes(1);
    expect(mockMessageBox.showErrorMessage).toHaveBeenCalledWith(`AI分析失败: ${errorMessage}`);
    expect(mockMonitor.endRequest).toHaveBeenCalledWith(
      "mock-request-id",
      "error",
      null,
      expect.any(Error)
    );
    expect(mockLoadingIndicator.hideLoadingIndicator).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });

  // Test 6: getRequestStatus should return current status
  test("getRequestStatus should return the current request status", () => {
    const status = aiAnalyzer.getRequestStatus();
    expect(status).toHaveProperty("inProgress");
    expect(status).toHaveProperty("lastRequestTime");
    expect(status).toHaveProperty("requestCount");
    // ... add more assertions for other properties if needed
  });

  // Test 7: onComplete callback for analyzeWithAI
  test("analyzeWithAI should call onComplete callback if provided", async () => {
    const onCompleteMock = jest.fn();
    const prompt = "callback test";
    const expectedResult = { analysis: "mocked result" };

    await aiAnalyzer.analyzeWithAI(prompt, { onComplete: onCompleteMock });

    expect(onCompleteMock).toHaveBeenCalledTimes(1);
    expect(onCompleteMock).toHaveBeenCalledWith(expectedResult);
  });

  // Test 8: ensure default request config is used
  test("should use default request config if options are not provided", async () => {
    const prompt = "default config test";
    await aiAnalyzer.analyzeWithAI(prompt);

    // Check if executeRequestWithRetry received default config values
    const passedConfig = mockRetryHandler.executeRequestWithRetry.mock.calls[0][2];
    expect(passedConfig).toHaveProperty("maxRetries", 3);
    expect(passedConfig).toHaveProperty("retryDelay", 1000);
    expect(passedConfig).toHaveProperty("timeout", 30000);
    expect(passedConfig).toHaveProperty("useCache", true);
  });

  // Test 9: options should override default config
  test("options should override default request config", async () => {
    const prompt = "override config test";
    const customOptions = {
      maxRetries: 5,
      timeout: 50000,
      useCache: false,
    };
    await aiAnalyzer.analyzeWithAI(prompt, customOptions);

    const passedConfig = mockRetryHandler.executeRequestWithRetry.mock.calls[0][2];
    expect(passedConfig).toHaveProperty("maxRetries", 5);
    expect(passedConfig).toHaveProperty("timeout", 50000);
    expect(passedConfig).toHaveProperty("useCache", false);
    // Ensure other default properties are still present if not overridden
    expect(passedConfig).toHaveProperty("retryDelay", 1000);
  });

  // Test 10: forceRefresh option should bypass cache
  test("forceRefresh option should bypass cache", async () => {
    const cachedData = { analysis: "cached data" };
    mockCache.getFromCache.mockReturnValue(cachedData);

    const prompt = "force refresh test";
    await aiAnalyzer.analyzeWithAI(prompt, { forceRefresh: true });

    expect(mockCache.getFromCache).not.toHaveBeenCalled(); // Should not check cache when forceRefresh is true
    expect(mockRetryHandler.executeRequestWithRetry).toHaveBeenCalledTimes(1); // Should call fetcher
    expect(mockMonitor.recordCacheMiss).not.toHaveBeenCalled(); // Should NOT record cache miss when forceRefresh is true
  });

  // Test 11: JSON parsing of result
  test("should parse JSON string result from retryHandler", async () => {
    const jsonStringResult = '{"data": "parsed json"}';
    mockRetryHandler.executeRequestWithRetry.mockResolvedValue(jsonStringResult);

    const prompt = "json parse test";
    const result = await aiAnalyzer.analyzeWithAI(prompt);

    expect(result).toEqual({ data: "parsed json" });
    expect(mockCache.saveToCache).toHaveBeenCalledWith("mock-cache-key", { data: "parsed json" });
  });

  // Test 12: direct object result from retryHandler
  test("should handle direct object result from retryHandler", async () => {
    const directObjectResult = { data: "direct object" };
    mockRetryHandler.executeRequestWithRetry.mockResolvedValue(directObjectResult);

    const prompt = "direct object test";
    const result = await aiAnalyzer.analyzeWithAI(prompt);

    expect(result).toEqual(directObjectResult);
    expect(mockCache.saveToCache).toHaveBeenCalledWith("mock-cache-key", directObjectResult);
  });
});
