/**
 * @file api-config.example.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description API配置模块 - 管理与vLLM服务交互的配置
 */

// 可用模型列表
const availableModels = [
  {
    id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B",
    name: "DeepSeek-R1-Distill-Qwen-14B",
    provider: "deepseek-ai",
    url: "http://internal-vllm-service.company.com/v1/chat/completions",
    maxTokens: 2000,
    isPrimary: true,
  },
  {
    id: "Qwen/Qwen-7B-Chat",
    name: "Qwen-7B-Chat",
    provider: "Qwen",
    url: "http://internal-vllm-service.company.com/v1/chat/completions",
    maxTokens: 1500,
    isPrimary: false,
  },
  {
    id: "THUDM/chatglm3-6b",
    name: "ChatGLM3-6B",
    provider: "THUDM",
    url: "http://internal-vllm-service.company.com/v1/chat/completions",
    maxTokens: 1500,
    isPrimary: false,
  },
];

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
  // 模型回退设置
  modelFallback: true, // 是否启用模型回退
  availableModels: availableModels, // 可用模型列表
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

/**
 * 获取可用模型列表
 * @returns {Array} 可用模型列表
 */
function getAvailableModels() {
  return [...availableModels];
}

/**
 * 获取主要模型
 * @returns {Object} 主要模型配置
 */
function getPrimaryModel() {
  return availableModels.find((model) => model.isPrimary) || availableModels[0];
}

/**
 * 获取备用模型列表
 * @returns {Array} 备用模型列表
 */
function getFallbackModels() {
  return availableModels.filter((model) => !model.isPrimary);
}

/**
 * 切换到指定模型
 * @param {string} modelId - 模型ID
 * @returns {boolean} 是否切换成功
 */
function switchToModel(modelId) {
  const model = availableModels.find((m) => m.id === modelId);
  if (!model) {
    return false;
  }

  updateAPIConfig({
    model: model.id,
    url: model.url,
    maxTokens: model.maxTokens,
  });

  return true;
}

export {
  getAPIConfig,
  updateAPIConfig,
  resetAPIConfig,
  getAvailableModels,
  getPrimaryModel,
  getFallbackModels,
  switchToModel,
};
