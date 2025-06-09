/**
 * AI集成帆软报表框架 - 主入口文件
 */
import { collectReportData } from "./core/data-collector.js";
import { buildBasicAnalysisPrompt } from "./core/prompt-builder.js";
import { analyzeWithAI } from "./core/ai-analyzer.js";
import { getFRAPIWrapper } from "./integration/fr-api-wrapper.js";
import { showSuccessMessage, showErrorMessage } from "./ui/message-box.js";
import { updateAPIConfig } from "./config/api-config.js";

/**
 * 执行基础AI分析
 * @returns {Promise<Boolean>} 分析是否成功
 */
async function runBasicAnalysis() {
  try {
    // 1. 收集报表数据
    const reportData = collectReportData();
    if (!reportData || (!reportData.tableData && !reportData.chartData)) {
      showErrorMessage("无法获取报表数据，请确保报表已加载完成。");
      return false;
    }

    // 2. 构建分析prompt
    const prompt = buildBasicAnalysisPrompt(reportData);

    // 3. 调用AI分析
    const result = await analyzeWithAI(prompt);
    if (!result) {
      showErrorMessage("AI分析失败，请稍后再试。");
      return false;
    }

    // 4. 更新分析结果到报表
    const frAPI = getFRAPIWrapper();
    const updateSuccess = frAPI.updateAnalysisResult(result);

    if (updateSuccess) {
      showSuccessMessage("AI分析完成！");
      return true;
    } else {
      showErrorMessage("无法更新分析结果到报表。");
      return false;
    }
  } catch (error) {
    console.error("执行AI分析出错:", error);
    showErrorMessage("执行AI分析过程中发生错误。");
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
 * 初始化框架
 * @param {Object} config - 初始化配置
 */
function init(config = {}) {
  // 更新API配置
  if (config.api) {
    configureAPI(config.api);
  }

  // 注册到全局对象，方便在帆软报表中调用
  window.AIDA_Watchboard = {
    runBasicAnalysis,
    configureAPI,
  };

  console.log("AI集成帆软报表框架初始化完成");
}

// 导出公共API
export { init, runBasicAnalysis, configureAPI };
