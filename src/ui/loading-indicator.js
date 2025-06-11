/**
 * @file loading-indicator.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description 加载指示器模块 - 管理AI分析过程中的加载状态显示
 */

// 加载指示器DOM元素ID (占位符，实际使用时需替换为帆软报表中的元素ID)
const LOADING_INDICATOR_ID = "ai-analysis-loading";
const PROGRESS_BAR_ID = "ai-analysis-progress"; // 进度条元素ID

/**
 * 显示加载指示器
 */
function showLoadingIndicator() {
  try {
    // 尝试使用帆软报表API显示加载指示器
    // 这里使用占位符，实际实现时需要根据帆软报表的API进行调整
    if (window.FR && window.FR.Widget) {
      const loadingElement = window.FR.Widget.getWidgetByName(LOADING_INDICATOR_ID);
      if (loadingElement) {
        loadingElement.setVisible(true);
        return;
      }
    }

    // 如果帆软API不可用，则使用DOM操作
    const loadingElement = document.getElementById(LOADING_INDICATOR_ID);
    if (loadingElement) {
      loadingElement.style.display = "block";
    } else {
      console.warn("加载指示器元素未找到");
    }
  } catch (error) {
    console.error("显示加载指示器出错:", error);
  }
}

/**
 * 隐藏加载指示器
 */
function hideLoadingIndicator() {
  try {
    // 尝试使用帆软报表API隐藏加载指示器
    if (window.FR && window.FR.Widget) {
      const loadingElement = window.FR.Widget.getWidgetByName(LOADING_INDICATOR_ID);
      if (loadingElement) {
        loadingElement.setVisible(false);
        return;
      }
    }

    // 如果帆软API不可用，则使用DOM操作
    const loadingElement = document.getElementById(LOADING_INDICATOR_ID);
    if (loadingElement) {
      loadingElement.style.display = "none";
    } else {
      console.warn("加载指示器元素未找到");
    }
  } catch (error) {
    console.error("隐藏加载指示器出错:", error);
  }
}

/**
 * 更新加载进度
 * @param {number} percent - 进度百分比 (0-100)
 */
function updateLoadingProgress(percent) {
  try {
    // 确保百分比在有效范围内
    const validPercent = Math.max(0, Math.min(100, percent));

    // 尝试使用帆软报表API更新进度条
    if (window.FR && window.FR.Widget) {
      const progressElement = window.FR.Widget.getWidgetByName(PROGRESS_BAR_ID);
      if (progressElement && typeof progressElement.setValue === "function") {
        progressElement.setValue(validPercent);
        return;
      }
    }

    // 如果帆软API不可用，则使用DOM操作
    const progressElement = document.getElementById(PROGRESS_BAR_ID);
    if (progressElement) {
      // 根据元素类型不同，可能需要不同的更新方式
      if (progressElement.tagName.toLowerCase() === "progress") {
        progressElement.value = validPercent;
        progressElement.setAttribute("value", validPercent);
      } else {
        // 假设是div类型的进度条
        progressElement.style.width = `${validPercent}%`;
      }
    } else {
      // 如果找不到进度条元素，则在控制台输出进度
      console.log(`AI分析进度: ${validPercent}%`);
    }
  } catch (error) {
    console.error("更新加载进度出错:", error);
  }
}

export { showLoadingIndicator, hideLoadingIndicator, updateLoadingProgress };
