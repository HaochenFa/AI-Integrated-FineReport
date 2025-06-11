/**
 * 聊天窗口样式模块 - 为AI对话窗口提供样式
 */

/**
 * 注入聊天窗口样式
 */
function injectChatStyles() {
  // 检查是否已注入样式
  if (document.getElementById("ai-chat-styles")) {
    return;
  }

  // 创建样式元素
  const styleElement = document.createElement("style");
  styleElement.id = "ai-chat-styles";

  // 定义样式
  styleElement.textContent = `
    /* 聊天窗口 */
    .ai-chat-window {
      position: fixed;
      display: flex;
      flex-direction: column;
      width: 350px;
      height: 500px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      overflow: hidden;
      transition: height 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    /* 最小化状态 */
    .ai-chat-window.minimized {
      height: 40px !important;
      overflow: hidden;
    }

    /* 聊天窗口头部 */
    .ai-chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      background-color: #1890ff;
      color: white;
      cursor: move;
      user-select: none;
    }

    /* 聊天窗口标题 */
    .ai-chat-title {
      font-weight: 600;
      font-size: 14px;
    }

    /* 聊天窗口头部按钮区域 */
    .ai-chat-header-buttons {
      display: flex;
      gap: 5px;
    }

    /* 聊天窗口头部按钮 */
    .ai-chat-minimize-button,
    .ai-chat-close-button {
      background: none;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }

    .ai-chat-minimize-button:hover,
    .ai-chat-close-button:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }

    /* 聊天窗口主体 */
    .ai-chat-body {
      flex: 1;
      padding: 15px;
      overflow-y: auto;
      background-color: #f5f5f5;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* 聊天消息 */
    .ai-chat-message {
      max-width: 80%;
      padding: 10px 12px;
      border-radius: 8px;
      margin-bottom: 5px;
      position: relative;
      word-wrap: break-word;
    }

    /* 用户消息 */
    .ai-chat-message.user {
      align-self: flex-end;
      background-color: #1890ff;
      color: white;
      border-bottom-right-radius: 2px;
    }

    /* 助手消息 */
    .ai-chat-message.assistant {
      align-self: flex-start;
      background-color: white;
      color: #333;
      border-bottom-left-radius: 2px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    /* 消息内容 */
    .ai-chat-message-content {
      font-size: 14px;
      line-height: 1.5;
    }

    /* 消息时间戳 */
    .ai-chat-message-timestamp {
      font-size: 10px;
      opacity: 0.7;
      margin-top: 5px;
      text-align: right;
    }

    /* 代码块样式 */
    .ai-chat-message-content pre {
      background-color: #f0f0f0;
      padding: 8px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 5px 0;
    }

    .ai-chat-message-content code {
      font-family: monospace;
      background-color: #f0f0f0;
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 12px;
    }

    .ai-chat-message.assistant .ai-chat-message-content pre,
    .ai-chat-message.assistant .ai-chat-message-content code {
      background-color: #f5f5f5;
    }

    /* 输入区域 */
    .ai-chat-input-area {
      display: flex;
      padding: 10px;
      background-color: #fff;
      border-top: 1px solid #e8e8e8;
    }

    /* 输入框 */
    .ai-chat-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      resize: none;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.5;
      max-height: 100px;
      min-height: 36px;
    }

    .ai-chat-input:focus {
      outline: none;
      border-color: #40a9ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }

    /* 发送按钮 */
    .ai-chat-send-button {
      margin-left: 8px;
      padding: 0 15px;
      height: 36px;
      background-color: #1890ff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s;
    }

    .ai-chat-send-button:hover {
      background-color: #40a9ff;
    }

    /* 调整大小手柄 */
    .ai-chat-resize-handle {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 15px;
      height: 15px;
      cursor: nwse-resize;
      background: linear-gradient(135deg, transparent 50%, #d9d9d9 50%);
    }

    /* 聊天切换按钮 */
    .ai-chat-toggle-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: auto;
      height: 40px;
      padding: 0 15px;
      background-color: #1890ff;
      color: white;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.3s;
    }

    .ai-chat-toggle-button:hover {
      background-color: #40a9ff;
    }

    /* 响应式调整 */
    @media (max-width: 768px) {
      .ai-chat-window {
        width: 300px;
        height: 450px;
      }

      .ai-chat-message {
        max-width: 90%;
      }
    }
  `;

  // 添加到文档头部
  document.head.appendChild(styleElement);
}

export { injectChatStyles };
