/**
 * @file main.test.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description main.js 模块的单元测试
 */

import { jest } from "@jest/globals";

// Mock all direct dependencies of main.js
jest.mock("../core/data-collector.js");
jest.mock("../core/prompt-builder.js");
jest.mock("../config/prompt-templates.js");
jest.mock("../core/ai-analyzer.js");
jest.mock("../integration/fr-api-wrapper.js");
jest.mock("../ui/message-box.js");
jest.mock("../config/api-config.js");
jest.mock("../ui/styles.js");
jest.mock("../core/performance-monitor.js");
jest.mock("../ui/performance-dashboard.js");
jest.mock("../ui/chat-window.js");
jest.mock("../core/chat-manager.js");
jest.mock("../integration/fr-chat-integration.js");

describe("main.js", () => {
  let mainModule;
  let mockDataCollector;
  let mockPromptBuilder;
  let mockPromptTemplates;
  let mockAiAnalyzer;
  let mockFrApiWrapper;
  let mockMessageBox;
  let mockApiConfig;
  let mockStyles;
  let mockPerformanceMonitor;
  let mockPerformanceDashboard;
  let mockChatWindow;
  let mockChatManager;
  let mockFrChatIntegration;

  beforeEach(async () => {
    jest.resetModules();

    // Mock window.FR.Widget if it exists
    global.window = {
      FR: {
        Widget: {
          getWidgetByName: jest.fn((id) => {
            if (id === "ai-analysis-result") {
              return {
                setText: jest.fn(),
                innerHTML: "",
                querySelector: jest.fn(() => document.createElement("div")),
                appendChild: jest.fn(),
              };
            }
            return null;
          }),
        },
      },
    };

    // Mock document.getElementById
    global.document = {
      getElementById: jest.fn((id) => {
        if (id === "ai-analysis-result") {
          return {
            setText: jest.fn(),
            innerHTML: "",
            querySelector: jest.fn(() => document.createElement("div")),
            appendChild: jest.fn(),
          };
        }
        return null;
      }),
      createElement: jest.fn((tag) => {
        if (tag === "div") {
          return {
            className: "",
            textContent: "",
          };
        }
        return null;
      }),
    };

    mainModule = await import("../main.js");

    mockDataCollector = await import("../core/data-collector.js");
    mockPromptBuilder = await import("../core/prompt-builder.js");
    mockPromptTemplates = await import("../config/prompt-templates.js");
    mockAiAnalyzer = await import("../core/ai-analyzer.js");
    mockFrApiWrapper = await import("../integration/fr-api-wrapper.js");
    mockMessageBox = await import("../ui/message-box.js");
    mockApiConfig = await import("../config/api-config.js");
    mockStyles = await import("../ui/styles.js");
    mockPerformanceMonitor = await import("../core/performance-monitor.js");
    mockPerformanceDashboard = await import("../ui/performance-dashboard.js");
    mockChatWindow = await import("../ui/chat-window.js");
    mockChatManager = await import("../core/chat-manager.js");
    mockFrChatIntegration = await import("../integration/fr-chat-integration.js");

    // Clear all mocks
    jest.clearAllMocks();

    // Default mock implementations
    mockDataCollector.collectReportData.mockReturnValue({
      tableData: [{ a: 1 }],
      timestamp: "2023-01-01",
    });
    mockPromptTemplates.getPromptTemplates.mockReturnValue({
      defaultBasicAnalysis: { header: "", requirements: "" },
    });
    mockPromptBuilder.buildBasicAnalysisPrompt.mockReturnValue("mock prompt");
    mockAiAnalyzer.streamAnalyzeWithAI.mockResolvedValue({ analysis: "mocked stream result" });
    mockAiAnalyzer.analyzeWithAI.mockResolvedValue({ analysis: "mocked analysis result" });
    mockFrApiWrapper.getFRAPIWrapper.mockReturnValue({
      updateAnalysisResult: jest.fn(() => true),
    });
    mockMessageBox.showErrorMessage.mockReturnValue(undefined);
    mockMessageBox.showSuccessMessage.mockReturnValue(undefined);
    mockApiConfig.updateAPIConfig.mockReturnValue(undefined);
    mockStyles.injectGlobalStyles.mockReturnValue(undefined);
    mockPerformanceMonitor.getPerformanceData.mockReturnValue({});
    mockPerformanceMonitor.resetPerformanceData.mockReturnValue(undefined);
    mockPerformanceMonitor.configurePerformanceMonitor.mockReturnValue(undefined);
    mockPerformanceDashboard.showPerformanceDashboard.mockReturnValue(undefined);
    mockPerformanceDashboard.configureDashboard.mockReturnValue(undefined);
    mockAiAnalyzer.clearCache.mockReturnValue(undefined);
    mockChatWindow.createChatWindow.mockReturnValue(undefined);
    mockChatWindow.showChatWindow.mockReturnValue(undefined);
    mockChatWindow.hideChatWindow.mockReturnValue(undefined);
    mockChatWindow.toggleChatWindow.mockReturnValue(undefined);
    mockChatManager.initChatManager.mockReturnValue(undefined);
    mockChatManager.getChatHistory.mockReturnValue([]);
    mockChatManager.clearChatHistory.mockReturnValue(undefined);
    mockFrChatIntegration.initFRChatIntegration.mockReturnValue(undefined);
  });

  // Test 1: init function should configure API, inject styles, and initialize chat
  test("init should configure API, inject styles, and initialize chat", () => {
    const config = {
      api: { key: "test-key" },
      enableChat: true,
      chat: { enableFRIntegration: false },
    };
    mainModule.init(config);

    expect(mockApiConfig.updateAPIConfig).toHaveBeenCalledWith(config.api);
    expect(mockStyles.injectGlobalStyles).toHaveBeenCalledTimes(1);
    expect(mockChatWindow.createChatWindow).toHaveBeenCalledTimes(1);
    expect(mockChatManager.initChatManager).toHaveBeenCalledWith({
      enableFRIntegration: false,
      enableDefaultAnalysis: true,
    });
    expect(mockFrChatIntegration.initFRChatIntegration).not.toHaveBeenCalled();
    expect(window.AIDA_Watchboard).toBeDefined();
  });

  // Test 2: init function should not initialize chat if enableChat is false
  test("init should not initialize chat if enableChat is false", () => {
    const config = { enableChat: false };
    mainModule.init(config);

    expect(mockChatWindow.createChatWindow).not.toHaveBeenCalled();
    expect(mockChatManager.initChatManager).not.toHaveBeenCalled();
    expect(mockFrChatIntegration.initFRChatIntegration).not.toHaveBeenCalled();
  });

  // Test 3: runBasicAnalysis should call runStreamAnalysis
  test("runBasicAnalysis should call runStreamAnalysis", async () => {
    const options = { someOption: true };
    const spy = jest.spyOn(mainModule, "runStreamAnalysis");
    await mainModule.runBasicAnalysis(options);
    expect(spy).toHaveBeenCalledWith(options);
    spy.mockRestore();
  });

  // Test 4: runStreamAnalysis should collect data, build prompt, and call streamAnalyzeWithAI
  test("runStreamAnalysis should collect data, build prompt, and call streamAnalyzeWithAI", async () => {
    const options = { timeout: 5000 };
    const result = await mainModule.runStreamAnalysis(options);

    expect(mockDataCollector.collectReportData).toHaveBeenCalledTimes(1);
    expect(mockPromptTemplates.getPromptTemplates).toHaveBeenCalledTimes(1);
    expect(mockPromptBuilder.buildBasicAnalysisPrompt).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object)
    );
    expect(mockAiAnalyzer.streamAnalyzeWithAI).toHaveBeenCalledWith(
      "mock prompt",
      options,
      expect.any(Function),
      expect.any(Function),
      "2023-01-01"
    );
    expect(result).toBe(true);
  });

  // Test 5: runStreamAnalysis should show error if no report data
  test("runStreamAnalysis should show error if no report data", async () => {
    mockDataCollector.collectReportData.mockReturnValue(null);
    const result = await mainModule.runStreamAnalysis();

    expect(mockMessageBox.showErrorMessage).toHaveBeenCalledWith(
      "无法获取报表数据，请确保报表已加载完成。"
    );
    expect(result).toBe(false);
  });

  // Test 6: runStreamAnalysis should handle streamAnalyzeWithAI returning null
  test("runStreamAnalysis should handle streamAnalyzeWithAI returning null", async () => {
    mockAiAnalyzer.streamAnalyzeWithAI.mockResolvedValue(null);
    const result = await mainModule.runStreamAnalysis();

    expect(result).toBe(false);
  });

  // Test 7: runStreamAnalysis onChunk callback updates result container
  test("runStreamAnalysis onChunk callback updates result container", async () => {
    const mockResultContainer = {
      setText: jest.fn(),
      innerHTML: "",
      querySelector: jest.fn(() => {
        const div = document.createElement("div");
        div.textContent = "";
        return div;
      }),
      appendChild: jest.fn(),
    };
    global.document.getElementById.mockReturnValue(mockResultContainer);

    mockAiAnalyzer.streamAnalyzeWithAI.mockImplementationOnce(
      async (prompt, options, onChunk, onComplete, dataTimestamp) => {
        onChunk("chunk1");
        onChunk("chunk2");
        onComplete({ analysis: "final result" });
        return { analysis: "final result" };
      }
    );

    await mainModule.runStreamAnalysis();

    expect(mockResultContainer.querySelector).toHaveBeenCalledWith(".ai-analysis-stream-container");
    expect(mockResultContainer.appendChild).toHaveBeenCalled();
    expect(mockResultContainer.querySelector().textContent).toBe("chunk1chunk2");
  });

  // Test 8: runStreamAnalysis onComplete callback updates analysis result and shows success message
  test("runStreamAnalysis onComplete callback updates analysis result and shows success message", async () => {
    const finalResult = {
      analysis: "final result",
      responseTime: 100,
      responseTimeFormatted: "100ms",
    };
    mockAiAnalyzer.streamAnalyzeWithAI.mockImplementationOnce(
      async (prompt, options, onChunk, onComplete, dataTimestamp) => {
        onComplete(finalResult);
        return finalResult;
      }
    );

    await mainModule.runStreamAnalysis();

    expect(mockFrApiWrapper.getFRAPIWrapper().updateAnalysisResult).toHaveBeenCalledWith(
      finalResult
    );
    expect(mockMessageBox.showSuccessMessage).toHaveBeenCalledWith(
      "流式AI分析完成！ 响应时间: 100ms"
    );
  });

  // Test 9: configureAPI should call updateAPIConfig
  test("configureAPI should call updateAPIConfig", () => {
    const config = { key: "new-key" };
    mainModule.configureAPI(config);
    expect(mockApiConfig.updateAPIConfig).toHaveBeenCalledWith(config);
  });

  // Test 10: Exposed AIDA_Watchboard object contains correct functions
  test("AIDA_Watchboard object should contain correct functions", () => {
    mainModule.init(); // Initialize to populate window.AIDA_Watchboard
    const aidaWatchboard = window.AIDA_Watchboard;

    expect(aidaWatchboard.runBasicAnalysis).toBeInstanceOf(Function);
    expect(aidaWatchboard.runStreamAnalysis).toBeInstanceOf(Function);
    expect(aidaWatchboard.configureAPI).toBeInstanceOf(Function);
    expect(aidaWatchboard.getPerformanceData).toBeInstanceOf(Function);
    expect(aidaWatchboard.resetPerformanceData).toBeInstanceOf(Function);
    expect(aidaWatchboard.configurePerformanceMonitor).toBeInstanceOf(Function);
    expect(aidaWatchboard.showPerformanceDashboard).toBeInstanceOf(Function);
    expect(aidaWatchboard.configureDashboard).toBeInstanceOf(Function);
    expect(aidaWatchboard.clearCache).toBeInstanceOf(Function);
    expect(aidaWatchboard.showChatWindow).toBeInstanceOf(Function);
    expect(aidaWatchboard.hideChatWindow).toBeInstanceOf(Function);
    expect(aidaWatchboard.toggleChatWindow).toBeInstanceOf(Function);
    expect(aidaWatchboard.getChatHistory).toBeInstanceOf(Function);
    expect(aidaWatchboard.clearChatHistory).toBeInstanceOf(Function);
  });

  // Test 11: initChat should initialize FR integration by default
  test("initChat should initialize FR integration by default", () => {
    mainModule.init({
      enableChat: true,
      chat: {},
    });
    expect(mockFrChatIntegration.initFRChatIntegration).toHaveBeenCalledTimes(1);
  });

  // Test 12: initChat should not initialize FR integration if enableFRIntegration is false
  test("initChat should not initialize FR integration if enableFRIntegration is false", () => {
    mainModule.init({
      enableChat: true,
      chat: { enableFRIntegration: false },
    });
    expect(mockFrChatIntegration.initFRChatIntegration).not.toHaveBeenCalled();
  });

  // Test 13: runStreamAnalysis handles resultContainer not found
  test("runStreamAnalysis should log warning if resultContainer not found", async () => {
    global.window.FR.Widget.getWidgetByName.mockReturnValue(null);
    global.document.getElementById.mockReturnValue(null);
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    await mainModule.runStreamAnalysis();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "结果容器元素 ai-analysis-result 未找到，将只在控制台显示结果"
    );
    consoleWarnSpy.mockRestore();
  });

  // Test 14: runStreamAnalysis handles error during streamAnalyzeWithAI
  test("runStreamAnalysis should show error message if streamAnalyzeWithAI throws error", async () => {
    mockAiAnalyzer.streamAnalyzeWithAI.mockRejectedValue(new Error("Stream error"));

    const result = await mainModule.runStreamAnalysis();

    expect(mockMessageBox.showErrorMessage).toHaveBeenCalledWith("执行流式AI分析过程中发生错误。");
    expect(result).toBe(false);
  });
});
