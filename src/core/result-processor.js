/**
 * 结果处理模块 - 处理AI返回的分析结果
 */

/**
 * 验证分析数据结构
 * @param {Object} data - 解析后的数据
 * @returns {Object} 验证结果，包含是否有效和缺失字段
 */
function validateAnalysisData(data) {
  const requiredFields = ['summary', 'trends', 'insights', 'recommendations'];
  const missingFields = [];
  
  requiredFields.forEach(field => {
    if (!data[field]) {
      missingFields.push(field);
    }
  });
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    data
  };
}

/**
 * 尝试解析分析内容
 * @param {String} content - 原始内容
 * @returns {Object} 解析结果
 */
function parseAnalysisContent(content) {
  // 尝试直接解析完整JSON
  try {
    const data = JSON.parse(content);
    return validateAnalysisData(data);
  } catch (e) {
    // 如果直接解析失败，尝试提取JSON部分
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/); // 匹配最外层的花括号及其内容
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const data = JSON.parse(jsonStr);
        return validateAnalysisData(data);
      }
    } catch (e2) {
      // 提取JSON部分也失败，使用文本内容
    }
    
    // 所有解析尝试都失败，返回文本格式
    return {
      isValid: false,
      missingFields: ['summary', 'trends', 'insights', 'recommendations'],
      data: {
        summary: content,
        trends: '',
        insights: '',
        recommendations: ''
      }
    };
  }
}

/**
 * 处理错误并返回标准化的错误信息
 * @param {Error} error - 错误对象
 * @param {String} context - 错误上下文
 * @returns {Object} 标准化的错误信息
 */
function handleProcessingError(error, context = '') {
  // 记录详细错误信息
  console.error(`处理AI分析结果出错 [${context}]:`, error);
  
  // 根据错误类型返回不同的错误信息
  if (error.name === 'SyntaxError') {
    return {
      errorType: 'PARSE_ERROR',
      message: '无法解析AI返回的结果格式',
      details: error.message
    };
  } else if (error.name === 'TypeError') {
    return {
      errorType: 'TYPE_ERROR',
      message: 'AI返回的结果结构不符合预期',
      details: error.message
    };
  } else if (error.message.includes('network') || error.message.includes('fetch')) {
    return {
      errorType: 'NETWORK_ERROR',
      message: '网络错误，无法获取AI分析结果',
      details: error.message
    };
  } else {
    return {
      errorType: 'UNKNOWN_ERROR',
      message: '处理AI分析结果时发生未知错误',
      details: error.message
    };
  }
}

/**
 * 验证分析结果的完整性和质量
 * @param {Object} result - 处理后的分析结果
 * @returns {Object} 验证结果
 */
function validateResult(result) {
  const validationResults = {
    isValid: true,
    issues: [],
    qualityScore: 10 // 满分10分
  };
  
  // 检查必要字段是否存在且不为空
  const requiredFields = ['summary', 'trends', 'insights', 'recommendations'];
  requiredFields.forEach(field => {
    if (!result[field]) {
      validationResults.isValid = false;
      validationResults.issues.push(`缺少${field}字段`); 
      validationResults.qualityScore -= 2;
    } else if (result[field].length < 10) {
      validationResults.issues.push(`${field}字段内容过少`); 
      validationResults.qualityScore -= 1;
    }
  });
  
  // 检查内容质量
  if (result.summary && result.summary.length < 50) {
    validationResults.issues.push('摘要内容过短'); 
    validationResults.qualityScore -= 1;
  }
  
  // 确保质量分数不为负
  validationResults.qualityScore = Math.max(0, validationResults.qualityScore);
  
  return validationResults;
}

/**
 * 处理AI分析结果
 * @param {Object} result - AI分析原始结果
 * @param {Object} options - 处理选项
 * @param {String} options.outputFormat - 输出格式 (html, markdown, text)
 * @param {Boolean} options.includeRaw - 是否包含原始响应
 * @param {Boolean} options.validateResult - 是否验证结果
 * @returns {Object} 处理后的分析结果
 */
function processResult(result, options = {}) {
  const defaultOptions = {
    outputFormat: 'html',
    includeRaw: false,
    validateResult: true
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    // 检查结果是否为空
    if (!result) {
      throw new Error('AI分析结果为空');
    }
    
    // 检查结果结构
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new TypeError('AI分析结果结构不符合预期');
    }
    
    // 从AI响应中提取分析内容
    const analysisContent = result.choices[0].message.content;
    
    // 解析分析内容
    const parseResult = parseAnalysisContent(analysisContent);
    
    // 处理和格式化结果
    const processedResult = {
      summary: formatText(parseResult.data.summary, mergedOptions.outputFormat),
      trends: formatText(parseResult.data.trends, mergedOptions.outputFormat),
      insights: formatText(parseResult.data.insights, mergedOptions.outputFormat),
      recommendations: formatText(parseResult.data.recommendations, mergedOptions.outputFormat),
      isComplete: parseResult.isValid,
      missingFields: parseResult.missingFields,
      timestamp: new Date().toISOString()
    };
    
    // 根据选项决定是否包含原始响应
    if (mergedOptions.includeRaw) {
      processedResult.rawResponse = result;
    }
    
    // 根据选项决定是否验证结果
    if (mergedOptions.validateResult) {
      processedResult.validation = validateResult(processedResult);
    }
    
    return processedResult;
  } catch (error) {
    // 使用增强的错误处理
    const errorInfo = handleProcessingError(error, 'processResult');
    
    return {
      summary: `处理分析结果时发生错误: ${errorInfo.message}`,
      trends: '',
      insights: '',
      recommendations: '',
      error: errorInfo,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 将Markdown文本转换为HTML
 * @param {String} text - Markdown格式的文本
 * @returns {String} HTML格式的文本
 */
function convertMarkdownToHTML(text) {
  if (!text) return "";

  // 转换代码块
  text = text.replace(/```([\s\S]*?)```/g, function(match, code) {
    return `<pre><code>${code.trim()}</code></pre>`;
  });
  
  // 转换行内代码
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 转换Markdown标题为HTML
  text = text.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  text = text.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  text = text.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  text = text.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  text = text.replace(/^##### (.+)$/gm, "<h5>$1</h5>");

  // 转换Markdown列表为HTML
  text = text.replace(/^\* (.+)$/gm, "<li>$1</li>");
  text = text.replace(/^- (.+)$/gm, "<li>$1</li>");
  text = text.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

  // 转换Markdown强调为HTML
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  text = text.replace(/~~(.+?)~~/g, "<del>$1</del>");

  // 转换链接
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // 将连续的列表项包装在ul或ol标签中
  text = text.replace(/(<li>.+<\/li>\n*)+/g, function(match) {
    if (match.includes('\d+\.')) {
      return "<ol>" + match + "</ol>";
    } else {
      return "<ul>" + match + "</ul>";
    }
  });

  // 转换水平线
  text = text.replace(/^---$/gm, "<hr>");

  // 转换换行符为HTML换行
  text = text.replace(/\n\n/g, "<p></p>");
  text = text.replace(/\n/g, "<br>");

  return text;
}

/**
 * 将结果转换为表格格式
 * @param {Object} result - 分析结果
 * @param {String} format - 输出格式 (html, markdown)
 * @returns {String} 表格格式的结果
 */
function convertResultToTable(result, format = 'html') {
  const sections = [
    { title: '摘要', content: result.summary },
    { title: '趋势', content: result.trends },
    { title: '洞察', content: result.insights },
    { title: '建议', content: result.recommendations }
  ];
  
  if (format === 'html') {
    let tableHtml = '<table class="analysis-table">';
    tableHtml += '<thead><tr><th>分析类型</th><th>内容</th></tr></thead><tbody>';
    
    sections.forEach(section => {
      if (section.content) {
        tableHtml += `<tr><td>${section.title}</td><td>${section.content}</td></tr>`;
      }
    });
    
    tableHtml += '</tbody></table>';
    return tableHtml;
  } else if (format === 'markdown') {
    let markdownTable = '| 分析类型 | 内容 |\n| --- | --- |\n';
    
    sections.forEach(section => {
      if (section.content) {
        // 在Markdown表格中，需要处理内容中的换行和竖线
        const safeContent = section.content.replace(/\n/g, '<br>').replace(/\|/g, '\\|');
        markdownTable += `| ${section.title} | ${safeContent} |\n`;
      }
    });
    
    return markdownTable;
  }
  
  return '';
}

/**
 * 格式化文本内容，根据指定格式处理
 * @param {String} text - 原始文本
 * @param {String} format - 输出格式 (html, markdown, text)
 * @returns {String} 格式化后的文本
 */
function formatText(text, format = 'html') {
  if (!text) return "";

  switch (format) {
    case 'html':
      return convertMarkdownToHTML(text);
    case 'markdown':
      // 保持Markdown格式，但确保格式正确
      return text.trim();
    case 'text':
      // 移除所有Markdown标记
      return text
        .replace(/^#+\s+/gm, '') // 移除标题标记
        .replace(/\*\*(.+?)\*\*/g, '$1') // 移除粗体
        .replace(/\*(.+?)\*/g, '$1') // 移除斜体
        .replace(/~~(.+?)~~/g, '$1') // 移除删除线
        .replace(/^[\*-]\s+/gm, '• ') // 将列表项转换为简单的项目符号
        .replace(/^\d+\.\s+/gm, '• ') // 将有序列表转换为简单的项目符号
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)') // 简化链接
        .replace(/```[\s\S]*?```/g, function(match) { // 简化代码块
          return match.replace(/```\w*\n?|```/g, '').trim();
        })
        .replace(/`([^`]+)`/g, '$1'); // 移除行内代码标记
    default:
      return text;
  }
}

export {
  processResult,
  formatText,
  convertMarkdownToHTML,
  validateAnalysisData,
  validateResult,
  convertResultToTable
};
