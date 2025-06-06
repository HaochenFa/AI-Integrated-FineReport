/**
 * API配置模块 - 管理与vLLM服务交互的配置
 */

// 默认API配置
const defaultAPIConfig = {
  // vLLM服务URL (内部服务)
  url: "http://internal-vllm-service.company.com/v1/chat/completions",
  // API密钥 (如果需要)
  apiKey: "YOUR_API_KEY",
  // 使用的模型
  model: "deepseek-coder",
  // 系统提示词
  systemPrompt:
    "你是一个专业的数据分析助手，擅长分析报表数据并提供洞察。请基于提供的数据进行分析，并给出关键发现和建议。",
  // 温度参数
  temperature: 0.3,
  // 最大生成token数
  maxTokens: 2000,
};

// 当前使用的API配置
let currentAPIConfig = { ...defaultAPIConfig };

/**
 * 获取当前API配置
 * @returns {Object} 当前API配置
 */
function getAPIConfig() {
  return { ...currentAPIConfig };
}

/**
 * 更新API配置
 * @param {Object} newConfig - 新的配置项
 */
function updateAPIConfig(newConfig) {
  currentAPIConfig = { ...currentAPIConfig, ...newConfig };
}

/**
 * 重置API配置为默认值
 */
function resetAPIConfig() {
  currentAPIConfig = { ...defaultAPIConfig };
}

export { getAPIConfig, updateAPIConfig, resetAPIConfig };
