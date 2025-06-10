/**
 * 全局样式模块 - 管理应用的全局CSS样式
 */

/**
 * 注入全局样式
 */
function injectGlobalStyles() {
  // 检查是否已注入样式
  if (document.getElementById("aida-global-styles")) {
    return;
  }

  const styleElement = document.createElement("style");
  styleElement.id = "aida-global-styles";
  styleElement.textContent = `
    /* 分析结果页脚样式 */
    .ai-analysis-footer {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: #888;
      margin-top: 10px;
      padding-top: 5px;
      border-top: 1px solid #eee;
    }
    
    /* 响应时间显示样式 */
    .ai-response-time {
      text-align: right;
    }
    
    /* 时间戳显示样式 */
    .ai-analysis-timestamp {
      text-align: left;
    }
    
    /* 流式响应容器样式 */
    .ai-analysis-stream-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.5;
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
      white-space: pre-wrap;
      overflow-wrap: break-word;
      min-height: 100px;
    }
  `;

  document.head.appendChild(styleElement);
}

export { injectGlobalStyles };
