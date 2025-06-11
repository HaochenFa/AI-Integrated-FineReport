/**
 * @file chat-window.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description 聊天窗口模块 - 管理AI对话窗口的显示和交互
 */

// 聊天窗口DOM元素ID
const CHAT_WINDOW_ID = "ai-chat-window";
const CHAT_HEADER_ID = "ai-chat-header";
const CHAT_BODY_ID = "ai-chat-body";
const CHAT_INPUT_ID = "ai-chat-input";
const CHAT_SEND_BUTTON_ID = "ai-chat-send-button";
const CHAT_TOGGLE_BUTTON_ID = "ai-chat-toggle-button";
const CHAT_CLOSE_BUTTON_ID = "ai-chat-close-button";
const CHAT_MINIMIZE_BUTTON_ID = "ai-chat-minimize-button";

// 聊天窗口状态
let chatWindowState = {
  isVisible: false,
  isMinimized: false,
  position: { x: 20, y: 20 },
  size: { width: 350, height: 500 },
};

// 拖动状态
let dragState = {
  isDragging: false,
  startX: 0,
  startY: 0,
  startPosX: 0,
  startPosY: 0,
};

// 调整大小状态
let resizeState = {
  isResizing: false,
  startX: 0,
  startY: 0,
  startWidth: 0,
  startHeight: 0,
};

/**
 * 创建聊天窗口
 */
function createChatWindow() {
  // 检查是否已创建聊天窗口
  if (document.getElementById(CHAT_WINDOW_ID)) {
    return;
  }

  // 注入聊天窗口样式
  injectChatStyles();

  // 创建聊天窗口元素
  const chatWindow = document.createElement("div");
  chatWindow.id = CHAT_WINDOW_ID;
  chatWindow.className = "ai-chat-window";
  chatWindow.style.display = chatWindowState.isVisible ? "flex" : "none";
  chatWindow.style.left = `${chatWindowState.position.x}px`;
  chatWindow.style.top = `${chatWindowState.position.y}px`;
  chatWindow.style.width = `${chatWindowState.size.width}px`;
  chatWindow.style.height = `${chatWindowState.size.height}px`;

  // 创建聊天窗口头部
  const chatHeader = document.createElement("div");
  chatHeader.id = CHAT_HEADER_ID;
  chatHeader.className = "ai-chat-header";
  chatHeader.innerHTML = `
    <div class="ai-chat-title">AI 助手</div>
    <div class="ai-chat-header-buttons">
      <button id="${CHAT_MINIMIZE_BUTTON_ID}" class="ai-chat-minimize-button" title="最小化">-</button>
      <button id="${CHAT_CLOSE_BUTTON_ID}" class="ai-chat-close-button" title="关闭">×</button>
    </div>
  `;

  // 创建聊天窗口主体
  const chatBody = document.createElement("div");
  chatBody.id = CHAT_BODY_ID;
  chatBody.className = "ai-chat-body";

  // 创建聊天窗口输入区域
  const chatInputArea = document.createElement("div");
  chatInputArea.className = "ai-chat-input-area";
  chatInputArea.innerHTML = `
    <textarea id="${CHAT_INPUT_ID}" class="ai-chat-input" placeholder="输入您的问题..."></textarea>
    <button id="${CHAT_SEND_BUTTON_ID}" class="ai-chat-send-button">发送</button>
  `;

  // 创建调整大小手柄
  const resizeHandle = document.createElement("div");
  resizeHandle.className = "ai-chat-resize-handle";

  // 组装聊天窗口
  chatWindow.appendChild(chatHeader);
  chatWindow.appendChild(chatBody);
  chatWindow.appendChild(chatInputArea);
  chatWindow.appendChild(resizeHandle);
  document.body.appendChild(chatWindow);

  // 创建聊天切换按钮
  const toggleButton = document.createElement("button");
  toggleButton.id = CHAT_TOGGLE_BUTTON_ID;
  toggleButton.className = "ai-chat-toggle-button";
  toggleButton.innerHTML = `<span>AI 助手</span>`;
  toggleButton.style.display = "block";
  document.body.appendChild(toggleButton);

  // 添加事件监听器
  setupEventListeners();
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
  // 获取元素
  const chatWindow = document.getElementById(CHAT_WINDOW_ID);
  const chatHeader = document.getElementById(CHAT_HEADER_ID);
  const chatInput = document.getElementById(CHAT_INPUT_ID);
  const sendButton = document.getElementById(CHAT_SEND_BUTTON_ID);
  const toggleButton = document.getElementById(CHAT_TOGGLE_BUTTON_ID);
  const closeButton = document.getElementById(CHAT_CLOSE_BUTTON_ID);
  const minimizeButton = document.getElementById(CHAT_MINIMIZE_BUTTON_ID);
  const resizeHandle = chatWindow.querySelector(".ai-chat-resize-handle");

  // 拖动窗口
  chatHeader.addEventListener("mousedown", startDrag);
  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", stopDrag);

  // 调整窗口大小
  resizeHandle.addEventListener("mousedown", startResize);
  document.addEventListener("mousemove", resize);
  document.addEventListener("mouseup", stopResize);

  // 发送消息
  sendButton.addEventListener("click", sendMessage);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // 切换窗口显示
  toggleButton.addEventListener("click", toggleChatWindow);

  // 关闭窗口
  closeButton.addEventListener("click", hideChatWindow);

  // 最小化窗口
  minimizeButton.addEventListener("click", minimizeChatWindow);
}

/**
 * 开始拖动
 * @param {MouseEvent} e - 鼠标事件
 */
function startDrag(e) {
  e.preventDefault();
  const chatWindow = document.getElementById(CHAT_WINDOW_ID);

  dragState.isDragging = true;
  dragState.startX = e.clientX;
  dragState.startY = e.clientY;
  dragState.startPosX = parseInt(chatWindow.style.left) || 0;
  dragState.startPosY = parseInt(chatWindow.style.top) || 0;
}

/**
 * 拖动
 * @param {MouseEvent} e - 鼠标事件
 */
function drag(e) {
  if (!dragState.isDragging) return;

  const chatWindow = document.getElementById(CHAT_WINDOW_ID);
  const newX = dragState.startPosX + (e.clientX - dragState.startX);
  const newY = dragState.startPosY + (e.clientY - dragState.startY);

  chatWindow.style.left = `${newX}px`;
  chatWindow.style.top = `${newY}px`;

  chatWindowState.position.x = newX;
  chatWindowState.position.y = newY;
}

/**
 * 停止拖动
 */
function stopDrag() {
  dragState.isDragging = false;
}

/**
 * 开始调整大小
 * @param {MouseEvent} e - 鼠标事件
 */
function startResize(e) {
  e.preventDefault();
  const chatWindow = document.getElementById(CHAT_WINDOW_ID);

  resizeState.isResizing = true;
  resizeState.startX = e.clientX;
  resizeState.startY = e.clientY;
  resizeState.startWidth = parseInt(chatWindow.style.width) || chatWindowState.size.width;
  resizeState.startHeight = parseInt(chatWindow.style.height) || chatWindowState.size.height;
}

/**
 * 调整大小
 * @param {MouseEvent} e - 鼠标事件
 */
function resize(e) {
  if (!resizeState.isResizing) return;

  const chatWindow = document.getElementById(CHAT_WINDOW_ID);
  const newWidth = resizeState.startWidth + (e.clientX - resizeState.startX);
  const newHeight = resizeState.startHeight + (e.clientY - resizeState.startY);

  // 设置最小尺寸
  const minWidth = 300;
  const minHeight = 400;

  if (newWidth >= minWidth) {
    chatWindow.style.width = `${newWidth}px`;
    chatWindowState.size.width = newWidth;
  }

  if (newHeight >= minHeight) {
    chatWindow.style.height = `${newHeight}px`;
    chatWindowState.size.height = newHeight;
  }
}

/**
 * 停止调整大小
 */
function stopResize() {
  resizeState.isResizing = false;
}

/**
 * 发送消息
 */
function sendMessage() {
  const chatInput = document.getElementById(CHAT_INPUT_ID);
  const message = chatInput.value.trim();

  if (!message) return;

  // 清空输入框
  chatInput.value = "";

  // 触发消息发送事件
  const event = new CustomEvent("ai-chat-message-sent", { detail: { message } });
  document.dispatchEvent(event);
}

/**
 * 显示聊天窗口
 */
function showChatWindow() {
  const chatWindow = document.getElementById(CHAT_WINDOW_ID);
  if (!chatWindow) {
    createChatWindow();
  } else {
    chatWindow.style.display = "flex";
    chatWindowState.isMinimized = false;
    chatWindow.classList.remove("minimized");
  }

  chatWindowState.isVisible = true;
}

/**
 * 隐藏聊天窗口
 */
function hideChatWindow() {
  const chatWindow = document.getElementById(CHAT_WINDOW_ID);
  if (chatWindow) {
    chatWindow.style.display = "none";
    chatWindowState.isVisible = false;
  }
}

/**
 * 最小化聊天窗口
 */
function minimizeChatWindow() {
  const chatWindow = document.getElementById(CHAT_WINDOW_ID);
  if (chatWindow) {
    if (chatWindowState.isMinimized) {
      chatWindow.classList.remove("minimized");
      chatWindowState.isMinimized = false;
    } else {
      chatWindow.classList.add("minimized");
      chatWindowState.isMinimized = true;
    }
  }
}

/**
 * 切换聊天窗口显示状态
 */
function toggleChatWindow() {
  if (chatWindowState.isVisible) {
    hideChatWindow();
  } else {
    showChatWindow();
  }
}

/**
 * 添加消息到聊天窗口
 * @param {Object} message - 消息对象
 * @param {string} message.type - 消息类型 (user 或 assistant)
 * @param {string} message.content - 消息内容
 * @param {string} [message.timestamp] - 消息时间戳
 */
function addMessage(message) {
  const chatBody = document.getElementById(CHAT_BODY_ID);
  if (!chatBody) return;

  // 创建消息元素
  const messageElement = document.createElement("div");
  messageElement.className = `ai-chat-message ${message.type}`;

  // 设置消息内容
  const timestamp = message.timestamp || new Date().toLocaleTimeString();
  messageElement.innerHTML = `
    <div class="ai-chat-message-content">${message.content}</div>
    <div class="ai-chat-message-timestamp">${timestamp}</div>
  `;

  // 添加到聊天窗口
  chatBody.appendChild(messageElement);

  // 滚动到底部
  chatBody.scrollTop = chatBody.scrollHeight;

  // 如果是助手消息，应用Markdown格式化
  if (message.type === "assistant") {
    applyMarkdownFormatting(messageElement.querySelector(".ai-chat-message-content"));
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
 * 清空聊天历史
 */
function clearChatHistory() {
  const chatBody = document.getElementById(CHAT_BODY_ID);
  if (chatBody) {
    chatBody.innerHTML = "";
  }
}

/**
 * 获取聊天窗口状态
 * @returns {Object} 聊天窗口状态
 */
function getChatWindowState() {
  return { ...chatWindowState };
}

export {
  createChatWindow,
  showChatWindow,
  hideChatWindow,
  toggleChatWindow,
  addMessage,
  clearChatHistory,
  getChatWindowState,
};
