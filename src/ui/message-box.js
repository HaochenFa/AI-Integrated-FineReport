/**
 * 消息框模块 - 管理错误和提示信息的显示
 */

// 消息框DOM元素ID (占位符，实际使用时需替换为帆软报表中的元素ID)
const MESSAGE_BOX_ID = "ai-analysis-message";
const MESSAGE_TEXT_ID = "ai-analysis-message-text";

/**
 * 显示错误消息
 * @param {String} message - 错误消息内容
 */
function showErrorMessage(message) {
  showMessage(message, "error");
}

/**
 * 显示成功消息
 * @param {String} message - 成功消息内容
 */
function showSuccessMessage(message) {
  showMessage(message, "success");
}

/**
 * 显示警告消息
 * @param {String} message - 警告消息内容
 */
function showWarningMessage(message) {
  showMessage(message, "warning");
}

/**
 * 显示信息消息
 * @param {String} message - 信息消息内容
 */
function showInfoMessage(message) {
  showMessage(message, "info");
}

/**
 * 显示消息
 * @param {String} message - 消息内容
 * @param {String} type - 消息类型 (error, success, warning, info)
 */
function showMessage(message, type = "info") {
  try {
    // 尝试使用帆软报表API显示消息
    // 这里使用占位符，实际实现时需要根据帆软报表的API进行调整
    if (window.FR && window.FR.Widget) {
      const messageBox = window.FR.Widget.getWidgetByName(MESSAGE_BOX_ID);
      const messageText = window.FR.Widget.getWidgetByName(MESSAGE_TEXT_ID);

      if (messageBox && messageText) {
        // 设置消息内容
        messageText.setValue(message);

        // 根据消息类型设置样式
        switch (type) {
          case "error":
            messageBox.setCSS("background-color", "#ffebee");
            messageBox.setCSS("color", "#d32f2f");
            break;
          case "success":
            messageBox.setCSS("background-color", "#e8f5e9");
            messageBox.setCSS("color", "#388e3c");
            break;
          case "warning":
            messageBox.setCSS("background-color", "#fff8e1");
            messageBox.setCSS("color", "#f57c00");
            break;
          case "info":
          default:
            messageBox.setCSS("background-color", "#e3f2fd");
            messageBox.setCSS("color", "#1976d2");
            break;
        }

        // 显示消息框
        messageBox.setVisible(true);

        // 设置自动隐藏
        setTimeout(() => {
          messageBox.setVisible(false);
        }, 5000);

        return;
      }
    }

    // 如果帆软API不可用，则使用DOM操作
    const messageBox = document.getElementById(MESSAGE_BOX_ID);
    const messageText = document.getElementById(MESSAGE_TEXT_ID);

    if (messageBox && messageText) {
      // 设置消息内容
      messageText.textContent = message;

      // 根据消息类型设置样式
      messageBox.className = `ai-message-box ${type}`;

      // 显示消息框
      messageBox.style.display = "block";

      // 设置自动隐藏
      setTimeout(() => {
        messageBox.style.display = "none";
      }, 5000);
    } else {
      // 如果找不到消息框元素，则使用alert作为备选方案
      console.warn("消息框元素未找到，使用alert显示消息");
      alert(`${type.toUpperCase()}: ${message}`);
    }
  } catch (error) {
    console.error("显示消息出错:", error);
    // 出错时使用alert作为备选方案
    alert(`${type.toUpperCase()}: ${message}`);
  }
}

export { showErrorMessage, showSuccessMessage, showWarningMessage, showInfoMessage };
