/**
 * @file chat-manager.test.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description chat-manager.js 模块的单元测试 (最终架构版)
 */

// 模拟依赖项放在顶部
jest.mock("../../ui/chat-window.js", () => ({ addMessage: jest.fn() }));
jest.mock("../data-collector.js", () => ({ collectReportData: jest.fn() }));
jest.mock("../chat-prompt-builder.js", () => ({ buildChatPrompt: jest.fn() }));
jest.mock("../ai-analyzer.js", () => ({ streamAnalyzeWithAI: jest.fn() }));
jest.mock("../prompt-builder.js", () => ({ buildBasicAnalysisPrompt: jest.fn() }));
jest.mock("../../config/prompt-templates.js", () => ({ getPromptTemplates: jest.fn() }));

// 重新引入模块，因为 resetModules 会清除缓存
let chatManager;
let addMessage, collectReportData, buildChatPrompt, streamAnalyzeWithAI;

describe("chat-manager.js", () => {
  // 在所有测试开始前，准备一个干净的模块和模拟函数引用
  beforeEach(() => {
    // 关键：重置模块，确保拿到一个全新的 chat-manager 实例，所有内部状态都是初始的
    jest.resetModules();

    // 重新加载模块和它们的模拟版本
    chatManager = require("../chat-manager.js");
    addMessage = require("../../ui/chat-window.js").addMessage;
    collectReportData = require("../data-collector.js").collectReportData;
    buildChatPrompt = require("../chat-prompt-builder.js").buildChatPrompt;
    streamAnalyzeWithAI = require("../ai-analyzer.js").streamAnalyzeWithAI;

    // 准备模拟DOM环境
    document.body.innerHTML = '<div id="ai-chat-body"></div>';

    // 准备模拟函数的默认返回值
    streamAnalyzeWithAI.mockResolvedValue({ content: "AI的最终响应" });
  });

  // 关键：在每个测试结束后，清理所有模拟，避免测试间的干扰
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Initialization", () => {
    it("当 enableDefaultAnalysis 为 false 时，应只显示欢迎消息", () => {
      chatManager.initChatManager({ enableDefaultAnalysis: false });

      expect(addMessage).toHaveBeenCalledTimes(1);
      expect(addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("您好！我是AI助手"),
        })
      );
      expect(streamAnalyzeWithAI).not.toHaveBeenCalled();
    });

    it("当 enableDefaultAnalysis 为 true (默认) 时，应执行默认分析流程", async () => {
      // 模拟 generateDefaultAnalysisReport 所需的依赖
      const buildBasicAnalysisPrompt = require("../prompt-builder.js").buildBasicAnalysisPrompt;
      const getPromptTemplates = require("../../config/prompt-templates.js").getPromptTemplates;
      getPromptTemplates.mockReturnValue({});
      buildBasicAnalysisPrompt.mockReturnValue("mocked basic prompt");

      // 使用 fake timers 来控制 setTimeout
      jest.useFakeTimers();

      chatManager.initChatManager(); // 默认 enableDefaultAnalysis 为 true

      // 断言：立即调用的部分
      expect(collectReportData).toHaveBeenCalledTimes(1);
      expect(buildBasicAnalysisPrompt).toHaveBeenCalledTimes(1);
      expect(streamAnalyzeWithAI).toHaveBeenCalledTimes(1);

      // 快进时间，以执行 setTimeout 里的回调
      await jest.runAllTimersAsync();

      // 断言：后续引导消息被添加
      expect(addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("以上是基于当前报表数据的默认分析报告"),
        })
      );

      // 清理 fake timers
      jest.useRealTimers();
    });
  });

  describe("User Interaction", () => {
    let handleUserMessage;

    beforeEach(() => {
      // 在这个 describe 块的 beforeEach 中初始化，以捕获事件监听器
      const eventMap = {};
      document.addEventListener = jest.fn((event, callback) => {
        eventMap[event] = callback;
      });
      chatManager.initChatManager({ enableDefaultAnalysis: false });
      handleUserMessage = eventMap["ai-chat-message-sent"];
    });

    it("接收到用户消息后，应正确调用依赖并更新历史", async () => {
      const userMessage = "分析一下销售数据";
      const event = new CustomEvent("ai-chat-message-sent", { detail: { message: userMessage } });

      // 行为
      await handleUserMessage(event);

      // 断言
      expect(addMessage).toHaveBeenCalledWith({ type: "user", content: userMessage });
      expect(collectReportData).toHaveBeenCalledTimes(1);
      expect(buildChatPrompt).toHaveBeenCalledTimes(1);
      expect(streamAnalyzeWithAI).toHaveBeenCalledTimes(1);

      const history = chatManager.getChatHistory();
      expect(history).toHaveLength(2);
      expect(history[0].content).toBe(userMessage);
      expect(history[1].content).toBe("AI的最终响应");
    });

    it("clearChatHistory 应能清空历史记录", async () => {
      const event = new CustomEvent("ai-chat-message-sent", { detail: { message: "test" } });
      await handleUserMessage(event);

      expect(chatManager.getChatHistory().length).toBe(2);

      chatManager.clearChatHistory();

      expect(chatManager.getChatHistory()).toEqual([]);
    });
  });
});
