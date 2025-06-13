/**
 * @file chat-prompt-builder.test.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description chat-prompt-builder.js 模块的单元测试
 */

import { buildChatPrompt } from "../chat-prompt-builder.js";
import { getCurrentAPIConfig } from "../../config/api-config.js";

// 模拟 'api-config' 模块
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
    const result = buildChatPrompt(mockUserMessage, mockChatHistory, mockFullReportData);

    expect(result.model).toBe(mockApiConfig.model);
    expect(result.temperature).toBe(mockApiConfig.temperature);
    expect(result.max_tokens).toBe(mockApiConfig.max_tokens);
    expect(result.stream).toBe(true);
    expect(result.messages).toHaveLength(1 + mockChatHistory.length + 1);
    expect(result.messages[0].role).toBe("system");
    expect(result.messages[3].role).toBe("user");
    expect(result.messages[3].content).toBe(mockUserMessage);

    const systemContent = result.messages[0].content;
    expect(systemContent).toContain("## 表格数据");
    expect(systemContent).toContain("## 图表数据");
    expect(systemContent).toContain("## 交叉表数据");
    expect(systemContent).toContain("## 仪表盘数据");
    expect(systemContent).toContain("## 地图数据");
    expect(systemContent).toContain("## 报表元数据");
  });

  it("当报表数据稀疏时，应只包含存在的数据部分", () => {
    const sparseReportData = {
      table: [{ id: 1, name: "唯一的表格" }],
      metadata: { reportName: "稀疏报告" },
    };

    const result = buildChatPrompt(mockUserMessage, [], sparseReportData);
    const systemContent = result.messages[0].content;

    expect(systemContent).toContain("## 表格数据");
    expect(systemContent).toContain("## 报表元数据");
    expect(systemContent).not.toContain("## 图表数据");
  });

  it("当报表数据为空对象时，不应包含任何数据区块", () => {
    const result = buildChatPrompt(mockUserMessage, [], {});
    const systemContent = result.messages[0].content;

    expect(systemContent).not.toContain("## 表格数据");
    expect(systemContent).not.toContain("## 报表元数据");
  });

  /**
   * 新增测试用例：覆盖分支
   * 这个测试用例专门用于测试当数据键存在但其值为空数组时的场景。
   * 这将覆盖 if (reportData.key && reportData.key.length > 0) 中的第二个条件分支。
   */
  it("当报表数据键存在但为空数组时，不应包含数据区块", () => {
    const reportDataWithEmptyArrays = {
      table: [],
      chart: [],
      crosstable: [],
      dashboard: [],
      map: [],
      metadata: null, // 测试 metadata 为假值的情况
    };

    const result = buildChatPrompt(mockUserMessage, [], reportDataWithEmptyArrays);
    const systemContent = result.messages[0].content;

    // 验证不应包含任何数据区块
    expect(systemContent).not.toContain("## 表格数据");
    expect(systemContent).not.toContain("## 图表数据");
    expect(systemContent).not.toContain("## 交叉表数据");
    expect(systemContent).not.toContain("## 仪表盘数据");
    expect(systemContent).not.toContain("## 地图数据");
    expect(systemContent).not.toContain("## 报表元数据");
  });

  it("当聊天历史为空时，应构建正确的初始Prompt", () => {
    const result = buildChatPrompt(mockUserMessage, [], mockFullReportData);

    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].role).toBe("system");
    expect(result.messages[1].role).toBe("user");
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

  it("当报表数据项缺少name属性或数据键存在但为空时，应正确处理", () => {
    // 构造一个覆盖所有剩余分支的 reportData
    const reportDataWithMissingDetails = {
      table: [{ id: 1 }], // 缺少 name
      chart: [], // 键存在，但数组为空
      crosstable: [{ id: 3, type: "pivot" }], // 缺少 name
      dashboard: [{ id: 4, value: 100 }], // 缺少 name
      map: [{ id: 5, region: "north" }], // 缺少 name
      metadata: {}, // metadata 存在但为空对象，依然会进入if块
    };

    const result = buildChatPrompt("test", [], reportDataWithMissingDetails);
    const systemContent = result.messages[0].content;

    // 验证：缺少name的项是否使用了默认名称
    expect(systemContent).toContain("未命名表格");
    expect(systemContent).toContain("未命名交叉表");
    expect(systemContent).toContain("未命名仪表盘");
    expect(systemContent).toContain("未命名地图");
    expect(systemContent).toContain("## 报表元数据"); // metadata 的区块头应该出现

    // 验证：键存在但数组为空的项，其区块头不应出现
    expect(systemContent).not.toContain("## 图表数据");
  });
});
