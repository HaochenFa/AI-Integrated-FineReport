/**
 * @file chat-manager.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description 聊天管理器模块 - 管理AI对话流程和历史
 */
import { addMessage } from "../ui/chat-window.js";
import { collectReportData } from "./data-collector.js";
import { buildChatPrompt } from "./chat-prompt-builder.js";
import { buildBasicAnalysisPrompt } from "./prompt-builder.js";
import { getPromptTemplates } from "../config/prompt-templates.js";
import { streamAnalyzeWithAI } from "./ai-analyzer.js";

// 聊天历史记录
let chatHistory = [];

// 聊天历史最大长度
const MAX_HISTORY_LENGTH = 10;

// 聊天状态
let chatState = {
  isProcessing: false,
};

/**
 * 初始化聊天管理器
 * @param {Object} options - 初始化选项
 */
async function initChatManager(options = {}) {
  // 监听聊天消息发送事件
  document.addEventListener("ai-chat-message-sent", handleUserMessage);

  // 如果启用默认分析报告，则生成并显示
  if (options.enableDefaultAnalysis !== false) {
    // AWAIT the async function to ensure completion
    await generateDefaultAnalysisReport();
  } else {
    // 添加欢迎消息
    addAssistantMessage("您好！我是AI助手，可以帮您分析报表数据。请问有什么可以帮助您的？");
  }
}

/**
 * 处理用户消息
 * @param {CustomEvent} event - 消息事件
 */
function handleUserMessage(event) {
  const message = event.detail.message;

  // 如果正在处理消息，则忽略
  if (chatState.isProcessing) {
    return;
  }

  // 添加用户消息到聊天窗口
  addUserMessage(message);

  // 处理用户消息
  processUserMessage(message);
}

/**
 * 处理用户消息并生成回复
 * @param {string} message - 用户消息
 */
async function processUserMessage(message) {
  try {
    // 设置处理状态
    chatState.isProcessing = true;

    // 收集报表数据
    const reportData = collectReportData();

    // 构建带有历史记录的提示
    const prompt = buildChatPrompt(message, chatHistory, reportData);

    // 创建一个空的助手消息占位符
    const assistantMessageElement = createAssistantMessagePlaceholder();

    // 流式调用AI分析
    await streamAnalyzeWithAI(prompt, (chunk) => {
      // 更新助手消息内容
      updateAssistantMessageContent(assistantMessageElement, chunk);
    });

    // 获取完整的助手回复
    const assistantResponse = assistantMessageElement.querySelector(
      ".ai-chat-message-content"
    ).innerHTML;

    // 更新聊天历史
    updateChatHistory(message, assistantResponse);
  } catch (error) {
    console.error("处理消息时出错:", error);
    addAssistantMessage("抱歉，处理您的请求时出现了错误。请稍后再试。");
  } finally {
    // 重置处理状态
    chatState.isProcessing = false;
  }
}

/**
 * 创建助手消息占位符
 * @returns {HTMLElement} 消息元素
 */
function createAssistantMessagePlaceholder() {
  const chatBody = document.getElementById("ai-chat-body");
  if (!chatBody) return null;

  // 创建消息元素
  const messageElement = document.createElement("div");
  messageElement.className = "ai-chat-message assistant";

  // 设置消息内容
  const timestamp = new Date().toLocaleTimeString();
  messageElement.innerHTML = `
    <div class="ai-chat-message-content"><div class="ai-typing-indicator">AI正在思考...</div></div>
    <div class="ai-chat-message-timestamp">${timestamp}</div>
  `;

  // 添加到聊天窗口
  chatBody.appendChild(messageElement);

  // 滚动到底部
  chatBody.scrollTop = chatBody.scrollHeight;

  return messageElement;
}

/**
 * 更新助手消息内容
 * @param {HTMLElement} messageElement - 消息元素
 * @param {string} content - 新内容
 */
function updateAssistantMessageContent(messageElement, content) {
  if (!messageElement) return;

  const contentElement = messageElement.querySelector(".ai-chat-message-content");
  if (contentElement) {
    contentElement.innerHTML = content;

    // 应用Markdown格式化
    applyMarkdownFormatting(contentElement);

    // 滚动到底部
    const chatBody = document.getElementById("ai-chat-body");
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }
}

/**
 * 应用Markdown格式化
 * @param {HTMLElement} element - 要格式化的元素
 */
function applyMarkdownFormatting(element) {
  // 这里可以使用第三方Markdown库，如marked.js
  // 简单实现：替换代码块、粗体、斜体等
  let html = element.innerHTML;

  // 代码块
  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

  // 行内代码
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // 粗体
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // 斜体
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // 列表项
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");

  element.innerHTML = html;
}

/**
 * 添加用户消息
 * @param {string} message - 用户消息
 */
function addUserMessage(message) {
  addMessage({
    type: "user",
    content: message,
  });
}

/**
 * 添加助手消息
 * @param {string} message - 助手消息
 */
function addAssistantMessage(message) {
  addMessage({
    type: "assistant",
    content: message,
  });
}

/**
 * 更新聊天历史
 * @param {string} userMessage - 用户消息
 * @param {string} assistantResponse - 助手回复
 */
function updateChatHistory(userMessage, assistantResponse) {
  // 添加新的对话到历史记录
  chatHistory.push({
    role: "user",
    content: userMessage,
  });

  chatHistory.push({
    role: "assistant",
    content: assistantResponse,
  });

  // 如果历史记录超过最大长度，则移除最早的对话
  if (chatHistory.length > MAX_HISTORY_LENGTH * 2) {
    chatHistory = chatHistory.slice(-MAX_HISTORY_LENGTH * 2);
  }
}

/**
 * 获取聊天历史
 * @returns {Array} 聊天历史记录
 */
function getChatHistory() {
  return [...chatHistory];
}

/**
 * 清空聊天历史
 */
function clearChatHistory() {
  chatHistory = [];
}

/**
 * 生成默认分析报告
 */
async function generateDefaultAnalysisReport() {
  try {
    // 设置处理状态
    chatState.isProcessing = true;

    // 收集报表数据
    const reportData = collectReportData();

    // 构建基础分析提示
    const templates = getPromptTemplates(); // 先获取模板
    const prompt = buildBasicAnalysisPrompt(reportData, templates); // 再将模板注入

    // 创建一个空的助手消息占位符
    const assistantMessageElement = createAssistantMessagePlaceholder();

    // 更新占位符内容，显示正在生成分析报告
    updateAssistantMessageContent(
      assistantMessageElement,
      '<div class="ai-typing-indicator">正在生成默认分析报告...</div>'
    );

    // 流式调用AI分析
    await streamAnalyzeWithAI(prompt, {}, (chunk) => {
      // 更新助手消息内容
      updateAssistantMessageContent(assistantMessageElement, chunk);
    });

    // 获取完整的助手回复
    const assistantResponse = assistantMessageElement.querySelector(
      ".ai-chat-message-content"
    ).innerHTML;

    // 更新聊天历史
    updateChatHistory("请为当前报表生成一份分析报告", assistantResponse);

    // 添加后续引导消息
    setTimeout(() => {
      addAssistantMessage(
        "以上是基于当前报表数据的默认分析报告。您可以询问更多关于报表数据的问题，或者请求更深入的分析。"
      );
    }, 1000);
  } catch (error) {
    console.error("生成默认分析报告时出错:", error);
    addAssistantMessage("抱歉，生成默认分析报告时出现了错误。您可以直接询问我关于报表数据的问题。");
  } finally {
    // 重置处理状态
    chatState.isProcessing = false;
  }
}

export { initChatManager, getChatHistory, clearChatHistory, handleUserMessage };
