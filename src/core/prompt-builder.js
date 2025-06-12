/**
 * @file prompt-builder.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description Prompt构建模块 - 根据报表数据构建AI分析的prompt (已重构)
 */

/**
 * 构建基础分析prompt (接收 templates 作为参数)
 * @param {Object} reportData - 报表数据
 * @param {Object} templates - prompt 模板
 * @returns {String} 构造好的prompt
 */
function buildBasicAnalysisPrompt(reportData, templates) {
  // const templates = getPromptTemplates(); // 这行被移除了
  let prompt = templates.defaultBasicAnalysis.header + "\n\n";

  // 添加表格数据
  if (reportData.tableData && reportData.tableData.length > 0) {
    prompt += templates.defaultBasicAnalysis.tableSection;
    prompt += JSON.stringify(reportData.tableData, null, 2);
    prompt += "\n```\n\n";
  }

  // 添加图表数据
  if (reportData.chartData && Object.keys(reportData.chartData).length > 0) {
    prompt += templates.defaultBasicAnalysis.chartSection;
    prompt += JSON.stringify(reportData.chartData, null, 2);
    prompt += "\n```\n\n";
  }

  // 添加交叉表数据
  if (reportData.crossTableData && Object.keys(reportData.crossTableData).length > 0) {
    prompt += templates.defaultBasicAnalysis.crossTableSection || "交叉表数据：\n```json\n";
    prompt += JSON.stringify(reportData.crossTableData, null, 2);
    prompt += "\n```\n\n";
  }

  // 添加仪表盘数据
  if (reportData.dashboardData && Object.keys(reportData.dashboardData).length > 0) {
    prompt += templates.defaultBasicAnalysis.dashboardSection || "仪表盘数据：\n```json\n";
    prompt += JSON.stringify(reportData.dashboardData, null, 2);
    prompt += "\n```\n\n";
  }

  // 添加地图数据
  if (reportData.mapData && Object.keys(reportData.mapData).length > 0) {
    prompt += templates.defaultBasicAnalysis.mapSection || "地图数据：\n```json\n";
    prompt += JSON.stringify(reportData.mapData, null, 2);
    prompt += "\n```\n\n";
  }

  // 添加分析要求
  prompt += templates.defaultBasicAnalysis.requirements;

  return prompt;
}

export { buildBasicAnalysisPrompt };
