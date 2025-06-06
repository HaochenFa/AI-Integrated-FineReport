/**
 * 加载指示器模块 - 管理AI分析过程中的加载状态显示
 */

// 加载指示器DOM元素ID (占位符，实际使用时需替换为帆软报表中的元素ID)
const LOADING_INDICATOR_ID = "ai-analysis-loading";

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

export { showLoadingIndicator, hideLoadingIndicator };
