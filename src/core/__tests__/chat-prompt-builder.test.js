/**
 * @file chat-prompt-builder.test.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description chat-prompt-builder.js 模块的单元测试
 */

import { buildChatPrompt } from "../chat-prompt-builder.js";
import { getCurrentAPIConfig } from "../../config/api-config.js";

// 模拟 'api-config' 模块
// 这是至关重要的一步，它允许我们在测试中控制API配置，而无需依赖实际文件
jest.mock("../../config/api-config.js", () => ({
  getCurrentAPIConfig: jest.fn(),
}));

describe("chat-prompt-builder.js", () => {
  // 定义可复用的模拟数据
  const mockApiConfig = {
    model: "test-model-v1",
    temperature: 0.5,
    max_tokens: 1024,
    system_prompt: "你是一个测试助手。",
  };

  const mockUserMessage = "最新的销售额是多少？";

  const mockChatHistory = [
    { role: "user", content: "你好" },
    { role: "assistant", content: "你好，有什么可以帮忙的？" },
  ];

  const mockFullReportData = {
    table: [{ id: 1, name: "表格1" }],
    chart: [{ id: 2, name: "图表1" }],
    crosstable: [{ id: 3, name: "交叉表1" }],
    dashboard: [{ id: 4, name: "仪表盘1" }],
    map: [{ id: 5, name: "地图1" }],
    metadata: { reportName: "测试报告" },
  };

  // 在每个测试用例运行前，重置模拟函数并设置默认返回值
  beforeEach(() => {
    getCurrentAPIConfig.mockClear();
    getCurrentAPIConfig.mockReturnValue(mockApiConfig);
  });

  it("当提供完整数据和历史记录时，应构建正确的Prompt", () => {
    // 调用待测函数
    const result = buildChatPrompt(mockUserMessage, mockChatHistory, mockFullReportData);

    // 验证顶层结构
    expect(result.model).toBe(mockApiConfig.model);
    expect(result.temperature).toBe(mockApiConfig.temperature);
    expect(result.max_tokens).toBe(mockApiConfig.max_tokens);
    expect(result.stream).toBe(true);

    // 验证 messages 数组
    expect(result.messages).toHaveLength(1 + mockChatHistory.length + 1);
    expect(result.messages[0].role).toBe("system");
    expect(result.messages[1].role).toBe("user");
    expect(result.messages[2].role).toBe("assistant");
    expect(result.messages[3].role).toBe("user");
    expect(result.messages[3].content).toBe(mockUserMessage);

    // 验证 system prompt 内容是否包含所有数据部分的标题
    const systemContent = result.messages[0].content;
    expect(systemContent).toContain(mockApiConfig.system_prompt);
    expect(systemContent).toContain("## 表格数据");
    expect(systemContent).toContain("## 图表数据");
    expect(systemContent).toContain("## 交叉表数据");
    expect(systemContent).toContain("## 仪表盘数据");
    expect(systemContent).toContain("## 地图数据");
    expect(systemContent).toContain("## 报表元数据");
    expect(systemContent).toContain(JSON.stringify(mockFullReportData.table[0], null, 2));
    expect(systemContent).toContain(JSON.stringify(mockFullReportData.metadata, null, 2));
  });

  it("当报表数据稀疏时，应只包含存在的数据部分", () => {
    const sparseReportData = {
      table: [{ id: 1, name: "唯一的表格" }],
      metadata: { reportName: "稀疏报告" },
    };

    const result = buildChatPrompt(mockUserMessage, [], sparseReportData);
    const systemContent = result.messages[0].content;

    // 验证应包含的部分
    expect(systemContent).toContain("## 表格数据");
    expect(systemContent).toContain("## 报表元数据");

    // 验证不应包含的部分
    expect(systemContent).not.toContain("## 图表数据");
    expect(systemContent).not.toContain("## 地图数据");
  });

  it("当报表数据为空对象时，不应包含任何数据区块", () => {
    const result = buildChatPrompt(mockUserMessage, [], {});
    const systemContent = result.messages[0].content;

    // 验证除了默认指令外，不包含任何数据标题
    expect(systemContent).not.toContain("## 表格数据");
    expect(systemContent).not.toContain("## 图表数据");
    expect(systemContent).not.toContain("## 报表元数据");
  });

  it("当聊天历史为空时，应构建正确的初始Prompt", () => {
    const result = buildChatPrompt(mockUserMessage, [], mockFullReportData);

    expect(result.messages).toHaveLength(2); // 只有 system 和 user
    expect(result.messages[0].role).toBe("system");
    expect(result.messages[1].role).toBe("user");
    expect(result.messages[1].content).toBe(mockUserMessage);
  });

  it("应完全遵循从 `getCurrentAPIConfig` 获取的配置", () => {
    const customConfig = {
      model: "custom-llm-4",
      temperature: 0.9,
      max_tokens: 4096,
      system_prompt: "这是一个自定义的系统指令。",
    };
    getCurrentAPIConfig.mockReturnValue(customConfig);

    const result = buildChatPrompt(mockUserMessage, [], {});

    expect(result.model).toBe(customConfig.model);
    expect(result.temperature).toBe(customConfig.temperature);
    expect(result.max_tokens).toBe(customConfig.max_tokens);
    expect(result.messages[0].content).toContain(customConfig.system_prompt);
  });
});
