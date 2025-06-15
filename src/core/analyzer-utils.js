/**
 * @file analyzer-utils.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description 分析工具模块 - 封装所有与分析相关的工具函数
 */

/**
 * 生成缓存键
 * @param {string} prompt - 分析提示
 * @param {Object} apiConfig - API配置
 * @param {string} [dataTimestamp] - 数据时间戳，用于确保缓存与数据版本一致
 * @returns {string} 缓存键
 */
function generateCacheKey(prompt, apiConfig, dataTimestamp) {
  // 使用prompt、关键配置参数和数据时间戳生成缓存键
  const keyParts = [
    prompt,
    apiConfig.model,
    apiConfig.temperature,
    apiConfig.maxTokens,
    dataTimestamp, // 添加数据时间戳，确保数据更新时缓存键也会更新
  ];
  return JSON.stringify(keyParts);
}

/**
 * 将文本分割成小块以模拟流式响应
 * @param {string} text - 要分割的文本
 * @returns {Array<string>} 文本块数组
 */
function simulateStreamFromText(text) {
  if (!text) {
    return [];
  }

  const chunks = [];
  const avgChunkSize = 15; // 平均每个块的字符数

  let start = 0;
  while (start < text.length) {
    // 随机化块大小，使其看起来更自然
    const size = Math.max(
      1,
      Math.floor(avgChunkSize + (Math.random() * avgChunkSize - avgChunkSize / 2))
    );
    const end = Math.min(start + size, text.length);
    chunks.push(text.substring(start, end));
    start = end;
  }

  return chunks;
}

export {generateCacheKey, simulateStreamFromText};
