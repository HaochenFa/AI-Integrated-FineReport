/**
 * 结果处理模块 - 处理AI返回的分析结果
 */

/**
 * 处理AI分析结果
 * @param {Object} result - AI分析原始结果
 * @returns {Object} 处理后的分析结果
 */
function processResult(result) {
  try {
    // 从AI响应中提取分析内容
    const analysisContent = result.choices[0].message.content;

    // 尝试解析JSON格式的分析结果
    let analysisData;
    try {
      analysisData = JSON.parse(analysisContent);
    } catch (e) {
      // 如果不是有效的JSON，则直接使用文本内容
      analysisData = {
        summary: analysisContent,
        trends: "",
        insights: "",
        recommendations: "",
      };
    }

    // 进一步处理和格式化结果
    return {
      summary: formatText(analysisData.summary),
      trends: formatText(analysisData.trends),
      insights: formatText(analysisData.insights),
      recommendations: formatText(analysisData.recommendations),
      rawResponse: result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("处理AI分析结果出错:", error);
    return {
      summary: "处理分析结果时发生错误。",
      trends: "",
      insights: "",
      recommendations: "",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 格式化文本内容
 * @param {String} text - 原始文本
 * @returns {String} 格式化后的文本
 */
function formatText(text) {
  if (!text) return "";

  // 替换Markdown格式为HTML (如果需要在帆软报表中显示格式化文本)
  // 这里可以根据实际需求进行调整
  let formattedText = text;

  // 替换Markdown标题
  formattedText = formattedText.replace(/#{1,6}\s+(.+)/g, "<strong>$1</strong><br>");

  // 替换Markdown列表
  formattedText = formattedText.replace(/^\s*-\s+(.+)/gm, "• $1<br>");
  formattedText = formattedText.replace(/^\s*\d+\.\s+(.+)/gm, "$1<br>");

  // 替换Markdown强调
  formattedText = formattedText.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  formattedText = formattedText.replace(/\*(.+?)\*/g, "<em>$1</em>");

  return formattedText;
}

export { processResult };
