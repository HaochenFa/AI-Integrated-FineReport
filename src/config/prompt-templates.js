/**
 * Prompt模板配置模块 - 管理不同类型分析的prompt模板
 */

// 默认prompt模板
const defaultPromptTemplates = {
  // 基础分析模板
  basicAnalysis: {
    header: "请对以下报表数据进行分析，提供关键洞察和发现：\n\n",
    tableSection: "表格数据：\n```json\n",
    chartSection: "图表数据：\n```json\n",
    requirements:
      "请提供以下分析：\n1. 数据摘要和关键指标\n2. 主要趋势和模式\n3. 重要洞察和发现\n4. 基于数据的建议和行动点",
  },

  // 自定义分析模板
  customAnalysis: {
    header: "请根据以下报表数据进行深入分析：\n\n",
    tableSection: "表格数据：\n```json\n",
    chartSection: "图表数据：\n```json\n",
    customRequirements: "请根据以下要求进行分析：\n",
  },

  // 异常检测模板
  anomalyDetection: {
    header: "请对以下报表数据进行异常检测分析：\n\n",
    tableSection: "表格数据：\n```json\n",
    chartSection: "图表数据：\n```json\n",
    requirements:
      "请识别并分析数据中的异常值和模式，包括：\n1. 显著偏离正常范围的数据点\n2. 异常趋势和突变\n3. 可能的异常原因\n4. 建议的后续调查方向",
  },

  // 预测分析模板
  predictiveAnalysis: {
    header: "请基于以下历史报表数据进行预测分析：\n\n",
    tableSection: "历史数据：\n```json\n",
    chartSection: "趋势图表：\n```json\n",
    requirements:
      "请提供以下预测分析：\n1. 未来趋势预测\n2. 潜在风险和机会\n3. 预测的可信度评估\n4. 基于预测的建议行动",
  },
};

// 当前使用的prompt模板
let currentPromptTemplates = { ...defaultPromptTemplates };

/**
 * 获取当前prompt模板
 * @returns {Object} 当前prompt模板
 */
function getPromptTemplates() {
  return { ...currentPromptTemplates };
}

/**
 * 更新prompt模板
 * @param {Object} newTemplates - 新的模板
 */
function updatePromptTemplates(newTemplates) {
  currentPromptTemplates = { ...currentPromptTemplates, ...newTemplates };
}

/**
 * 重置prompt模板为默认值
 */
function resetPromptTemplates() {
  currentPromptTemplates = { ...defaultPromptTemplates };
}

export { getPromptTemplates, updatePromptTemplates, resetPromptTemplates };
