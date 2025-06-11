/**
 * @file fr-chat-integration.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description FineReport聊天集成模块 - 在FineReport界面中添加聊天功能
 */

import { showChatWindow, hideChatWindow, toggleChatWindow } from "../ui/chat-window.js";

// 聊天按钮ID
const CHAT_BUTTON_ID = "ai-chat-button";

/**
 * 初始化FineReport聊天集成
 * @param {Object} options - 集成选项
 */
function initFRChatIntegration(options = {}) {
  // 检查是否已初始化
  if (document.getElementById(CHAT_BUTTON_ID)) {
    return;
  }

  // 创建聊天按钮
  createChatButton(options);

  console.log("FineReport聊天集成初始化完成");
}

/**
 * 创建聊天按钮
 * @param {Object} options - 按钮选项
 */
function createChatButton(options = {}) {
  // 获取按钮容器
  let buttonContainer;

  if (options.buttonContainerId) {
    // 如果指定了容器ID，则使用该容器
    buttonContainer = document.getElementById(options.buttonContainerId);
  } else {
    // 否则尝试获取FineReport工具栏
    buttonContainer =
      document.querySelector(".fr-toolbar") || document.querySelector(".fr-btn-panel");
  }

  // 如果没有找到容器，则创建一个新的容器并添加到报表容器中
  if (!buttonContainer) {
    const reportContainer =
      document.querySelector(".fr-designer") ||
      document.querySelector(".fr-viewer") ||
      document.body;

    buttonContainer = document.createElement("div");
    buttonContainer.className = "ai-chat-button-container";
    buttonContainer.style.position = "absolute";
    buttonContainer.style.top = "10px";
    buttonContainer.style.right = "10px";
    buttonContainer.style.zIndex = "1000";

    reportContainer.appendChild(buttonContainer);
  }

  // 创建聊天按钮
  const chatButton = document.createElement("button");
  chatButton.id = CHAT_BUTTON_ID;
  chatButton.className = "ai-chat-button";
  chatButton.innerHTML = `<span>AI 助手</span>`;
  chatButton.title = "打开AI助手聊天窗口";

  // 设置按钮样式
  chatButton.style.backgroundColor = options.buttonColor || "#1890ff";
  chatButton.style.color = "white";
  chatButton.style.border = "none";
  chatButton.style.borderRadius = "4px";
  chatButton.style.padding = "5px 10px";
  chatButton.style.cursor = "pointer";
  chatButton.style.fontSize = "14px";
  chatButton.style.fontWeight = "600";
  chatButton.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
  chatButton.style.margin = "0 5px";

  // 添加悬停效果
  chatButton.addEventListener("mouseover", () => {
    chatButton.style.backgroundColor = options.buttonHoverColor || "#40a9ff";
  });

  chatButton.addEventListener("mouseout", () => {
    chatButton.style.backgroundColor = options.buttonColor || "#1890ff";
  });

  // 添加点击事件
  chatButton.addEventListener("click", toggleChatWindow);

  // 添加按钮到容器
  buttonContainer.appendChild(chatButton);
}

/**
 * 显示聊天按钮
 */
function showChatButton() {
  const chatButton = document.getElementById(CHAT_BUTTON_ID);
  if (chatButton) {
    chatButton.style.display = "inline-block";
  }
}

/**
 * 隐藏聊天按钮
 */
function hideChatButton() {
  const chatButton = document.getElementById(CHAT_BUTTON_ID);
  if (chatButton) {
    chatButton.style.display = "none";
  }
}

export { initFRChatIntegration, showChatButton, hideChatButton };
