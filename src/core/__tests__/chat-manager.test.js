/**
 * @file chat-manager.test.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description chat-manager.js 模块的单元测试 (已修正路径)
 */

// --- 模块模拟 ---
// 路径相对于此测试文件 (`src/core/__tests__/`)

jest.mock("../../ui/chat-window.js", () => ({
  addMessage: jest.fn(),
}));

// 修正了以下所有路径
jest.mock("../data-collector.js", () => ({
  collectReportData: jest.fn(),
}));
jest.mock("../chat-prompt-builder.js", () => ({
  buildChatPrompt: jest.fn(),
}));
jest.mock("../ai-analyzer.js", () => ({
  streamAnalyzeWithAI: jest.fn(),
}));
jest.mock("../prompt-builder.js", () => ({
  buildBasicAnalysisPrompt: jest.fn(),
}));
jest.mock("../../config/prompt-templates.js", () => ({
  getPromptTemplates: jest.fn(),
}));

// --- 测试代码 ---

let chatManager;
let addMessage,
  collectReportData,
  streamAnalyzeWithAI,
  buildBasicAnalysisPrompt,
  getPromptTemplates,
  buildChatPrompt;

describe("chat-manager.js", () => {
  beforeEach(() => {
    // 为每个测试重置模块以获取干净的实例和状态
    jest.resetModules();

    // 重新加载模块及其模拟的依赖项
    chatManager = require("../chat-manager.js");
    addMessage = require("../../ui/chat-window.js").addMessage;
    collectReportData = require("../data-collector.js").collectReportData;
    streamAnalyzeWithAI = require("../ai-analyzer.js").streamAnalyzeWithAI;
    buildBasicAnalysisPrompt = require("../prompt-builder.js").buildBasicAnalysisPrompt;
    getPromptTemplates = require("../../config/prompt-templates.js").getPromptTemplates;
    buildChatPrompt = require("../chat-prompt-builder.js").buildChatPrompt;

    // JSDOM 环境准备: chat-manager.js 内部会查找这个元素
    document.body.innerHTML = '<div id="ai-chat-body"></div>';

    // 设置所有模拟的默认返回值/实现
    streamAnalyzeWithAI.mockImplementation(async (prompt, options, onChunk, onComplete) => {
      const finalResult = { content: "AI的最终响应" };
      if (typeof onComplete === "function") {
        onComplete(finalResult);
      }
      return finalResult;
    });
    getPromptTemplates.mockReturnValue({});
    buildBasicAnalysisPrompt.mockReturnValue("mocked basic prompt");
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers(); // 确保在每次测试后恢复真实计时器
  });

  describe("Initialization", () => {
    it("当 enableDefaultAnalysis 为 false 时，应只显示欢迎消息", async () => {
      await chatManager.initChatManager({ enableDefaultAnalysis: false });

      expect(addMessage).toHaveBeenCalledTimes(1);
      expect(addMessage).toHaveBeenCalledWith({
        type: "assistant",
        content: expect.stringContaining("您好！我是AI助手"),
      });
      expect(streamAnalyzeWithAI).not.toHaveBeenCalled();
    });

    it("当 enableDefaultAnalysis 为 true 时，应执行默认分析的完整流程", async () => {
      jest.useFakeTimers();

      // 正确地 await 异步的 initChatManager
      await chatManager.initChatManager();

      // 断言核心异步流程被调用
      expect(collectReportData).toHaveBeenCalledTimes(1);
      expect(buildBasicAnalysisPrompt).toHaveBeenCalledTimes(1);
      expect(streamAnalyzeWithAI).toHaveBeenCalledTimes(1);

      // 在核心异步流程完成后，执行 setTimeout 中的回调
      await jest.runAllTimersAsync();

      // 断言后续的引导消息被添加
      expect(addMessage).toHaveBeenCalledWith({
        type: "assistant",
        content: expect.stringContaining("以上是基于当前报表数据的默认分析报告"),
      });

      jest.useRealTimers();
    });
  });

  describe("User Interaction", () => {
    let handleUserMessage;

    beforeEach(async () => {
      const eventMap = {};
      document.addEventListener = jest.fn((event, callback) => {
        eventMap[event] = callback;
      });
      await chatManager.initChatManager({ enableDefaultAnalysis: false });
      handleUserMessage = eventMap["ai-chat-message-sent"];
    });

    it("接收到用户消息后，应正确调用依赖并更新历史", async () => {
      const userMessage = "分析一下销售数据";
      const event = new CustomEvent("ai-chat-message-sent", { detail: { message: userMessage } });

      await handleUserMessage(event);

      expect(addMessage).toHaveBeenCalledWith({ type: "user", content: userMessage });
      expect(collectReportData).toHaveBeenCalledTimes(1);
      expect(buildChatPrompt).toHaveBeenCalledTimes(1);
      expect(streamAnalyzeWithAI).toHaveBeenCalledTimes(1);

      const history = chatManager.getChatHistory();
      expect(history).toHaveLength(2);
      expect(history[0].role).toBe("user");
      expect(history[0].content).toBe(userMessage);
      expect(history[1].role).toBe("assistant");
    });
  });
});
