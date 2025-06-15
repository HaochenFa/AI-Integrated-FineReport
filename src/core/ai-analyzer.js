/**
 * @file ai-analyzer.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description AI分析模块 - 负责与vLLM服务交互
 */

import * as cache from "./request-cache.js";
import * as utils from "./analyzer-utils.js";
import * as fetcher from "./api-fetcher.js";
import * as retryHandler from "./retry-handler.js";
import * as monitor from "./performance-monitor.js";
import {getAPIConfig, getFallbackModels} from "../config/api-config.js";
import {showLoadingIndicator, hideLoadingIndicator} from "../ui/loading-indicator.js";
import {showErrorMessage} from "../ui/message-box.js";

// 默认请求配置
const DEFAULT_REQUEST_CONFIG = {
  maxRetries: 3, // 最大重试次数
  retryDelay: 1000, // 重试间隔(毫秒)
  timeout: 30000, // 请求超时时间(毫秒)
  exponentialBackoff: true, // 是否使用指数退避策略
  useCache: true, // 是否使用缓存
  cacheTTL: 300000, // 缓存有效期(毫秒)，默认5分钟
  modelFallback: true, // 是否启用模型回退
  maxFallbackAttempts: 2, // 最大模型回退尝试次数
  maxConcurrentRequests: 2, // 最大并发请求数
  streamResponse: true, // 是否使用流式响应（默认启用）
};

// 当前请求状态
let requestStatus = {
  inProgress: false, // 是否有请求正在进行
  lastRequestTime: null, // 上次请求时间
  requestCount: 0, // 请求计数
  successCount: 0, // 成功请求计数
  failureCount: 0, // 失败请求计数
  averageResponseTime: 0, // 平均响应时间
  cacheHits: 0, // 缓存命中次数
  cacheMisses: 0, // 缓存未命中次数
  modelSwitchCount: 0, // 模型切换次数
  currentModel: null, // 当前使用的模型ID
  modelPerformance: {}, // 各模型性能统计
  queuedRequests: 0, // 队列中的请求数
  activeRequests: 0, // 当前活跃的请求数
};

/**
 * 获取当前请求状态
 * @returns {Object} 当前请求状态
 */
function getRequestStatus() {
  return {...requestStatus};
}

/**
 * 内部核心分析函数，包含了所有通用的协调逻辑。
 * @private
 * @param {string} prompt - 分析提示
 * @param {object} options - 请求选项
 * @param {string} dataTimestamp - 数据时间戳
 * @param {function(object): Promise<any>} fetcherFn - 要执行的实际请求函数 (由外部注入)
 * @returns {Promise<object|null>} 分析结果
 */
async function _runAnalysisCore(prompt, options, dataTimestamp, fetcherFn) {
  const config = {...DEFAULT_REQUEST_CONFIG, ...options};
  const apiConfig = getAPIConfig();
  const fallbackModels = getFallbackModels();

  const requestId = monitor.startRequest(prompt, config, apiConfig.model);

  try {
    showLoadingIndicator();

    // 步骤 1: 协调缓存模块 (逻辑与之前相同)
    if (config.useCache && !options.forceRefresh) {
      const cacheKey = utils.generateCacheKey(prompt, apiConfig, dataTimestamp);
      const cachedResult = cache.getFromCache(cacheKey, config.cacheTTL);
      if (cachedResult) {
        monitor.recordCacheHit(requestId);
        // todo)) 检查这里有没有遗漏
        // ...
        return cachedResult;
      }
      monitor.recordCacheMiss();
    }

    // 步骤 2: 协调重试/回退处理器
    const result = await retryHandler.executeRequestWithRetry(
      apiConfig,
      fallbackModels,
      config,
      fetcherFn, // <--- 使用被注入的 fetcher 函数
      {
        onRetry: () => monitor.recordRetry(requestId),
        onFallback: (newModelId) => monitor.recordModelFallback(requestId, newModelId),
      }
    );

    // 步骤 3: 协调成功后的收尾工作
    const finalResultObject = typeof result === "string" ? JSON.parse(result) : result;
    const cacheKey = utils.generateCacheKey(prompt, apiConfig, dataTimestamp);
    cache.saveToCache(cacheKey, finalResultObject);
    monitor.endRequest(requestId, "success", finalResultObject);

    return finalResultObject;
  } catch (error) {
    // 步骤 4: 协调失败后的收尾工作
    console.error("AI分析协调过程中发生最终错误:", error);
    showErrorMessage(`AI分析失败: ${error.message}`);
    monitor.endRequest(requestId, "error", null, error);
    return null;
  } finally {
    hideLoadingIndicator();
  }
}

// --- 公共 API ---

/**
 * 执行标准的、非流式的AI分析。
 * @public
 */
async function analyzeWithAI(prompt, options = {}, dataTimestamp = null) {
  // 定义并注入 "标准 fetcher"
  const standardFetcher = (currentApiConfig) =>
    fetcher.fetchStandard(
      currentApiConfig,
      prompt,
      options,
      options.timeout || DEFAULT_REQUEST_CONFIG.timeout
    );

  const result = await _runAnalysisCore(prompt, options, dataTimestamp, standardFetcher);

  // 对于非流式，可以有一个完成回调
  if (options.onComplete) options.onComplete(result);

  return result;
}

/**
 * 执行流式的AI分析。
 * @public
 */
async function streamAnalyzeWithAI(
  prompt,
  options = {},
  onChunk,
  onComplete,
  dataTimestamp = null
) {
  // 定义并注入 "流式 fetcher"
  const streamFetcher = (currentApiConfig) =>
    fetcher.fetchStream(
      currentApiConfig,
      prompt,
      options,
      options.timeout || DEFAULT_REQUEST_CONFIG.timeout,
      onChunk // 将 onChunk 回调传递给 fetcher
    );

  const result = await _runAnalysisCore(prompt, options, dataTimestamp, streamFetcher);

  // 流式分析的完成回调
  if (onComplete) onComplete(result);

  return result;
}

export {getRequestStatus, streamAnalyzeWithAI, analyzeWithAI};
