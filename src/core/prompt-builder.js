/**
 * Prompt构建模块 - 根据报表数据构建AI分析的prompt
 */
import { getPromptTemplates } from "../config/prompt-templates.js";

/**
 * 构建基础分析prompt
 * @param {Object} reportData - 报表数据
 * @returns {String} 构造好的prompt
 */
function buildBasicAnalysisPrompt(reportData) {
  const templates = getPromptTemplates();

  const prompt = {
    instruction: templates.defaultBasicAnalysis.header,
    data: {
      table: reportData.tableData || [],
      chart: reportData.chartData || [],
    },
    requirements: templates.defaultBasicAnalysis.requirements,
  };

  return JSON.stringify(prompt);
}

// /**
//  * 构建自定义分析prompt
//  * @param {Object} reportData - 报表数据
//  * @param {Object} options - 自定义选项
//  * @returns {String} 构造好的prompt
//  */
// function buildCustomAnalysisPrompt(reportData, options) {
//   const templates = getPromptTemplates();
//   let prompt = templates.customAnalysis.header;

//   // 添加表格数据
//   if (reportData.tableData && reportData.tableData.length > 0) {
//     prompt += templates.customAnalysis.tableSection;
//     prompt += JSON.stringify(reportData.tableData, null, 2);
//     prompt += "\n\n";
//   }

//   // 添加图表数据
//   if (reportData.chartData && reportData.chartData.length > 0) {
//     prompt += templates.customAnalysis.chartSection;
//     prompt += JSON.stringify(reportData.chartData, null, 2);
//     prompt += "\n\n";
//   }

//   // 添加自定义分析要求
//   prompt += templates.customAnalysis.customRequirements;

//   // 添加用户自定义选项
//   if (options && options.focusAreas && options.focusAreas.length > 0) {
//     prompt += "\n重点关注以下方面：\n";
//     options.focusAreas.forEach((area, index) => {
//       prompt += `${index + 1}. ${area}\n`;
//     });
//   }

//   if (options && options.additionalContext) {
//     prompt += "\n额外上下文信息：\n";
//     prompt += options.additionalContext;
//   }

//   prompt += "\n\n请以JSON格式返回结果，包含以下字段：summary, trends, insights, recommendations";

//   return prompt;
// }

export { buildBasicAnalysisPrompt };
