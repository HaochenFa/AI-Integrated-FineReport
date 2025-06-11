/**
 * AI集成帆软报表框架 - 主入口文件
 */
import { collectReportData } from "./core/data-collector.js";
import { buildBasicAnalysisPrompt } from "./core/prompt-builder.js";
import { analyzeWithAI, streamAnalyzeWithAI, clearCache } from "./core/ai-analyzer.js";
import { getFRAPIWrapper } from "./integration/fr-api-wrapper.js";
import { showSuccessMessage, showErrorMessage } from "./ui/message-box.js";
import { updateAPIConfig } from "./config/api-config.js";
import { injectGlobalStyles } from "./ui/styles.js";
import {
  getPerformanceData,
  resetPerformanceData,
  configurePerformanceMonitor,
} from "./core/performance-monitor.js";
import { showPerformanceDashboard, configureDashboard } from "./ui/performance-dashboard.js";

// 导入聊天相关模块
import { createChatWindow, showChatWindow, hideChatWindow, toggleChatWindow } from "./ui/chat-window.js";
import { initChatManager, getChatHistory, clearChatHistory } from "./core/chat-manager.js";
import { initFRChatIntegration } from "./integration/fr-chat-integration.js";

/**
 * 执行基础AI分析
 * @param {Object} [options] - 分析选项
 * @returns {Promise<Boolean>} 分析是否成功
 */
async function runBasicAnalysis(options = {}) {
  // 直接调用流式分析，使用默认的结果容器ID
  return runStreamAnalysis(options);
}

/**
 * 使用流式响应执行AI分析
 * @param {Object} [options] - 分析选项
 * @param {string} [resultContainerId] - 结果容器元素ID
 * @returns {Promise<Boolean>} 分析是否成功
 */
async function runStreamAnalysis(options = {}, resultContainerId = "ai-analysis-result") {
  try {
    // 1. 收集报表数据
    const reportData = collectReportData();
    if (!reportData || (!reportData.tableData && !reportData.chartData)) {
      showErrorMessage("无法获取报表数据，请确保报表已加载完成。");
      return false;
    }

    // 2. 构建分析prompt
    const prompt = buildBasicAnalysisPrompt(reportData);

    // 获取结果容器元素
    let resultContainer;
    if (window.FR && window.FR.Widget) {
      resultContainer = window.FR.Widget.getWidgetByName(resultContainerId);
    } else {
      resultContainer = document.getElementById(resultContainerId);
    }

    if (!resultContainer) {
      console.warn(`结果容器元素 ${resultContainerId} 未找到，将只在控制台显示结果`);
    }

    // 清空结果容器
    if (resultContainer) {
      if (typeof resultContainer.setText === "function") {
        resultContainer.setText("");
      } else if (resultContainer.innerHTML !== undefined) {
        resultContainer.innerHTML = "<div class='ai-analysis-stream-container'></div>";
      }
    }

    // 获取或创建流式内容容器
    let streamContainer;
    if (resultContainer) {
      if (resultContainer.innerHTML !== undefined) {
        streamContainer = resultContainer.querySelector(".ai-analysis-stream-container");
        if (!streamContainer) {
          streamContainer = document.createElement("div");
          streamContainer.className = "ai-analysis-stream-container";
          resultContainer.appendChild(streamContainer);
        }
      }
    }

    // 创建临时存储完整响应的变量
    let completeResponse = "";

    // 3. 调用流式AI分析，传递数据时间戳以确保缓存与数据版本一致
    const result = await streamAnalyzeWithAI(
      prompt,
      options,
      // 处理每个响应块
      (chunk) => {
        completeResponse += chunk;
        console.log("收到流式响应块:", chunk);

        // 更新UI
        if (streamContainer) {
          streamContainer.textContent = completeResponse;
        } else if (resultContainer && typeof resultContainer.setText === "function") {
          resultContainer.setText(completeResponse);
        }
      },
      // 处理完成回调
      (finalResult) => {
        if (!finalResult) return;

        // 4. 更新最终分析结果到报表
        const frAPI = getFRAPIWrapper();

        // 添加响应时间信息到成功消息
        let successMessage = "流式AI分析完成！";
        if (finalResult.responseTime) {
          successMessage += ` 响应时间: ${
            finalResult.responseTimeFormatted || finalResult.responseTime + "毫秒"
          }`;
        }

        const updateSuccess = frAPI.updateAnalysisResult(finalResult);

        if (updateSuccess) {
          showSuccessMessage(successMessage);
        } else {
          showErrorMessage("无法更新最终分析结果到报表。");
        }
      },
      // 传递数据时间戳
      reportData.timestamp
    );

    return !!result;
  } catch (error) {
    console.error("执行流式AI分析出错:", error);
    showErrorMessage("执行流式AI分析过程中发生错误。");
    return false;
  }
}

// /**
//  * 执行自定义AI分析
//  * @param {Object} options - 自定义分析选项
//  * @returns {Promise<Boolean>} 分析是否成功
//  */
// async function runCustomAnalysis(options = {}) {
//   try {
//     // 1. 收集报表数据
//     const reportData = collectReportData();
//     if (!reportData || (!reportData.tableData && !reportData.chartData)) {
//       showErrorMessage("无法获取报表数据，请确保报表已加载完成。");
//       return false;
//     }

//     // 2. 构建自定义分析prompt
//     const prompt = buildCustomAnalysisPrompt(reportData, options);

//     // 3. 调用AI分析
//     const result = await analyzeWithAI(prompt);
//     if (!result) {
//       showErrorMessage("AI分析失败，请稍后再试。");
//       return false;
//     }

//     // 4. 更新分析结果到报表
//     const frAPI = getFRAPIWrapper();
//     const updateSuccess = frAPI.updateAnalysisResult(result);

//     if (updateSuccess) {
//       showSuccessMessage("自定义AI分析完成！");
//       return true;
//     } else {
//       showErrorMessage("无法更新分析结果到报表。");
//       return false;
//     }
//   } catch (error) {
//     console.error("执行自定义AI分析出错:", error);
//     showErrorMessage("执行自定义AI分析过程中发生错误。");
//     return false;
//   }
// }

/**
 * 配置API参数
 * @param {Object} config - API配置
 */
function configureAPI(config) {
  updateAPIConfig(config);
}

/**
 * 初始化聊天功能
 * @param {Object} options - 聊天选项
 */
function initChat(options = {}) {
  // 创建聊天窗口
  createChatWindow();
  
  // 初始化聊天管理器，传递选项
  initChatManager(options);
  
  // 初始化FineReport聊天集成
  if (options.enableFRIntegration !== false) {
    initFRChatIntegration(options.frIntegration || {});
  }
  
  console.log("聊天功能初始化完成");
}

/**
 * 初始化框架
 * @param {Object} config - 初始化配置
 */
function init(config = {}) {
  // 更新API配置
  if (config.api) {
    configureAPI(config.api);
  }

  // 注入全局样式
  injectGlobalStyles();
  
  // 初始化聊天功能
  if (config.enableChat !== false) {
    // 合并聊天选项
    const chatOptions = config.chat || {};
    
    // 默认分析报告配置只能在后端设置，不从前端config获取
    // IT管理员可以在此处修改默认值
    chatOptions.enableDefaultAnalysis = true; // 默认启用，IT管理员可以在此修改
    
    initChat(chatOptions);
  }

  // 注册到全局对象，方便在帆软报表中调用
  window.AIDA_Watchboard = {
    runBasicAnalysis,
    runStreamAnalysis,
    configureAPI,
    getPerformanceData,
    resetPerformanceData,
    configurePerformanceMonitor,
    showPerformanceDashboard,
    configureDashboard,
    clearCache,
    // 聊天相关API
    showChatWindow,
    hideChatWindow,
    toggleChatWindow,
    getChatHistory,
    clearChatHistory,
  };

  console.log("AI集成帆软报表框架初始化完成");
}

// 导出公共API
export { init, runBasicAnalysis, runStreamAnalysis, configureAPI };
