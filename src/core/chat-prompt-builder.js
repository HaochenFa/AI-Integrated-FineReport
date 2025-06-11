/**
 * @file chat-prompt-builder.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description 聊天提示构建器模块 - 构建包含聊天历史和报表数据的提示
 */

import { getCurrentAPIConfig } from "../config/api-config.js";

/**
 * 构建聊天提示
 * @param {string} userMessage - 用户消息
 * @param {Array} chatHistory - 聊天历史记录
 * @param {Object} reportData - 报表数据
 * @returns {Object} 完整的提示对象
 */
function buildChatPrompt(userMessage, chatHistory, reportData) {
  // 获取当前API配置
  const apiConfig = getCurrentAPIConfig();

  // 构建消息数组
  const messages = [];

  // 添加系统提示
  messages.push({
    role: "system",
    content: buildSystemPrompt(reportData),
  });

  // 添加聊天历史
  if (chatHistory && chatHistory.length > 0) {
    messages.push(...chatHistory);
  }

  // 添加用户当前消息
  messages.push({
    role: "user",
    content: userMessage,
  });

  // 构建完整的提示对象
  return {
    messages,
    model: apiConfig.model,
    temperature: apiConfig.temperature,
    max_tokens: apiConfig.max_tokens,
    stream: true,
  };
}

/**
 * 构建系统提示
 * @param {Object} reportData - 报表数据
 * @returns {string} 系统提示内容
 */
function buildSystemPrompt(reportData) {
  // 获取当前API配置中的系统提示
  const apiConfig = getCurrentAPIConfig();
  let systemPrompt = apiConfig.system_prompt || "";

  // 添加报表数据上下文
  systemPrompt += "\n\n以下是当前报表的数据上下文：\n";

  // 添加表格数据
  if (reportData.table && reportData.table.length > 0) {
    systemPrompt += "\n## 表格数据\n";
    reportData.table.forEach((table, index) => {
      systemPrompt += `\n### 表格 ${index + 1}: ${table.name || "未命名表格"}\n`;
      systemPrompt += JSON.stringify(table, null, 2);
      systemPrompt += "\n";
    });
  }

  // 添加图表数据
  if (reportData.chart && reportData.chart.length > 0) {
    systemPrompt += "\n## 图表数据\n";
    reportData.chart.forEach((chart, index) => {
      systemPrompt += `\n### 图表 ${index + 1}: ${chart.name || "未命名图表"}\n`;
      systemPrompt += JSON.stringify(chart, null, 2);
      systemPrompt += "\n";
    });
  }

  // 添加交叉表数据
  if (reportData.crosstable && reportData.crosstable.length > 0) {
    systemPrompt += "\n## 交叉表数据\n";
    reportData.crosstable.forEach((crosstable, index) => {
      systemPrompt += `\n### 交叉表 ${index + 1}: ${crosstable.name || "未命名交叉表"}\n`;
      systemPrompt += JSON.stringify(crosstable, null, 2);
      systemPrompt += "\n";
    });
  }

  // 添加仪表盘数据
  if (reportData.dashboard && reportData.dashboard.length > 0) {
    systemPrompt += "\n## 仪表盘数据\n";
    reportData.dashboard.forEach((dashboard, index) => {
      systemPrompt += `\n### 仪表盘 ${index + 1}: ${dashboard.name || "未命名仪表盘"}\n`;
      systemPrompt += JSON.stringify(dashboard, null, 2);
      systemPrompt += "\n";
    });
  }

  // 添加地图数据
  if (reportData.map && reportData.map.length > 0) {
    systemPrompt += "\n## 地图数据\n";
    reportData.map.forEach((map, index) => {
      systemPrompt += `\n### 地图 ${index + 1}: ${map.name || "未命名地图"}\n`;
      systemPrompt += JSON.stringify(map, null, 2);
      systemPrompt += "\n";
    });
  }

  // 添加元数据
  if (reportData.metadata) {
    systemPrompt += "\n## 报表元数据\n";
    systemPrompt += JSON.stringify(reportData.metadata, null, 2);
    systemPrompt += "\n";
  }

  // 添加指导说明
  systemPrompt += `
\n请根据上述报表数据和用户的问题提供专业、准确的分析和见解。回答应当简洁明了，重点突出，并尽可能提供可操作的建议。如果用户的问题不明确或缺少必要信息，请礼貌地要求澄清。

在回答中，你可以：
1. 解释数据趋势和模式
2. 提供数据的比较分析
3. 指出异常值和潜在问题
4. 建议进一步的分析方向
5. 回答关于报表数据的具体问题

请使用Markdown格式来组织你的回答，使用适当的标题、列表和强调来提高可读性。
`;

  return systemPrompt;
}

export { buildChatPrompt };
