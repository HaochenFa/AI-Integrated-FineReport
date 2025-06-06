/**
 * AI分析模块 - 负责与vLLM服务交互
 */
import { getAPIConfig } from "../config/api-config.js";
import { showLoadingIndicator, hideLoadingIndicator } from "../ui/loading-indicator.js";
import { showErrorMessage } from "../ui/message-box.js";

/**
 * 使用AI分析报表数据
 * @param {Object} prompt - 构造好的prompt
 * @returns {Promise<Object>} AI分析结果
 */
async function analyzeWithAI(prompt) {
  try {
    showLoadingIndicator();

    const apiConfig = getAPIConfig();
    const response = await fetch(apiConfig.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: apiConfig.model,
        messages: [
          {
            role: "system",
            content: apiConfig.systemPrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: apiConfig.temperature,
        max_tokens: apiConfig.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("AI分析出错:", error);
    showErrorMessage("AI分析过程中发生错误，请稍后再试。");
    return null;
  } finally {
    hideLoadingIndicator();
  }
}

export { analyzeWithAI };
