/**
 * API配置模块 - 管理与vLLM服务交互的配置
 */

// 默认API配置
const defaultAPIConfig = {
  // vLLM服务URL
  url: "http://internal-vllm-service.company.com/v1/chat/completions",
  // API密钥 (如果需要)
  apiKey: "YOUR_API_KEY", // 如果不需要 API KEY，则改为 null
  // 使用的模型
  model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B", // 假设集团内部托管的LLM是从HF上下载的，沿用HF的模型命名
  // 系统提示词
  systemPrompt:
    "你是一个专业的数据分析师，擅长从大量数据以及总结性数据中提取数据亮点、数据趋势、数据异常等关键信息，并且能够根据数据简要且清晰地总结出分析报告。你给出的报告应该结构清晰，让所有人能够快速理解，且有利于业务的决策分析。",
  // 温度参数
  temperature: 0.3, // 温度越高，生成的文本越随机，越有创造性；温度越低，生成的文本越保守，越固定
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
