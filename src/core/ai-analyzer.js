/**
 * AI分析模块 - 负责与vLLM服务交互
 */
import { getAPIConfig, getFallbackModels, switchToModel } from "../config/api-config.js";
import {
  showLoadingIndicator,
  hideLoadingIndicator,
  updateLoadingProgress,
} from "../ui/loading-indicator.js";
import { showErrorMessage, showWarningMessage, showInfoMessage } from "../ui/message-box.js";
import {
  startRequest,
  endRequest,
  recordRetry,
  recordModelFallback,
  recordCacheHit,
  recordCacheMiss,
  formatDuration,
} from "./performance-monitor.js";

// 默认请求配置
const DEFAULT_REQUEST_CONFIG = {
  maxRetries: 3, // 最大重试次数
  retryDelay: 1000, // 重试间隔(毫秒)
  timeout: 30000, // 请求超时时间(毫秒)
  exponentialBackoff: true, // 是否使用指数退避策略
  useCache: true, // 是否使用缓存
  cacheTTL: 3600000, // 缓存有效期(毫秒)，默认1小时
  modelFallback: true, // 是否启用模型回退
  maxFallbackAttempts: 2, // 最大模型回退尝试次数
  maxConcurrentRequests: 2, // 最大并发请求数
  streamResponse: false, // 是否使用流式响应
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

// 请求队列
let requestQueue = [];

// 是否正在处理队列
let isProcessingQueue = false;

// 结果缓存
const resultCache = new Map();

/**
 * 获取当前请求状态
 * @returns {Object} 当前请求状态
 */
function getRequestStatus() {
  return { ...requestStatus };
}

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
 * 从缓存中获取结果
 * @param {string} key - 缓存键
 * @param {number} ttl - 缓存有效期(毫秒)
 * @returns {Object|null} 缓存的结果或null
 */
function getFromCache(key, ttl) {
  if (!resultCache.has(key)) {
    return null;
  }

  const cachedItem = resultCache.get(key);
  const now = Date.now();

  // 检查缓存是否过期
  if (now - cachedItem.timestamp > ttl) {
    resultCache.delete(key);
    return null;
  }

  return cachedItem.data;
}

/**
 * 将结果存入缓存
 * @param {string} key - 缓存键
 * @param {Object} data - 要缓存的数据
 */
function saveToCache(key, data) {
  resultCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * 清除所有缓存
 * @returns {number} 清除的缓存项数量
 */
function clearCache() {
  const cacheSize = resultCache.size;
  resultCache.clear();
  console.log(`已清除 ${cacheSize} 个缓存项`);
  return cacheSize;
}

/**
 * 清除缓存
 * @param {string} [key] - 特定缓存键，如果不提供则清除所有缓存
 */
function clearCache(key) {
  if (key) {
    resultCache.delete(key);
  } else {
    resultCache.clear();
  }
}

/**
 * 使用AI分析报表数据
 * @param {Object} prompt - 构造好的prompt
 * @param {Object} [options] - 请求选项
 * @param {number} [options.maxRetries] - 最大重试次数
 * @param {number} [options.retryDelay] - 重试间隔(毫秒)
 * @param {number} [options.timeout] - 请求超时时间(毫秒)
 * @param {boolean} [options.exponentialBackoff] - 是否使用指数退避策略
 * @param {boolean} [options.useCache] - 是否使用缓存
 * @param {number} [options.cacheTTL] - 缓存有效期(毫秒)
 * @param {boolean} [options.modelFallback] - 是否启用模型回退
 * @param {number} [options.maxFallbackAttempts] - 最大模型回退尝试次数
 * @param {string} [dataTimestamp] - 数据时间戳，用于确保缓存与数据版本一致
 * @returns {Promise<Object>} AI分析结果
 */
async function analyzeWithAI(prompt, options = {}, dataTimestamp = null) {
  // 合并默认配置和用户配置
  const config = { ...DEFAULT_REQUEST_CONFIG, ...options };
  let retryCount = 0;
  let fallbackAttempts = 0;
  let lastError = null;
  const startTime = Date.now();

  // 更新请求状态
  requestStatus.inProgress = true;
  requestStatus.lastRequestTime = startTime;
  requestStatus.requestCount++;

  // 开始性能监控
  const requestId = startRequest(prompt, config, getAPIConfig().model);

  try {
    showLoadingIndicator();

    // 检查缓存
    let apiConfig = getAPIConfig();
    requestStatus.currentModel = apiConfig.model;

    // 初始化模型性能统计
    if (!requestStatus.modelPerformance[apiConfig.model]) {
      requestStatus.modelPerformance[apiConfig.model] = {
        requests: 0,
        successes: 0,
        failures: 0,
        totalResponseTime: 0,
      };
    }

    if (config.useCache && !options.forceRefresh) {
      const cacheKey = generateCacheKey(prompt, apiConfig, dataTimestamp);
      const cachedResult = getFromCache(cacheKey, config.cacheTTL);

      if (cachedResult) {
        console.log("使用缓存的AI分析结果");
        requestStatus.cacheHits++;

        // 记录缓存命中
        recordCacheHit(requestId);

        // 结束性能监控（成功，使用缓存）
        endRequest(requestId, "success", cachedResult, null, {
          duration: Date.now() - startTime,
          cacheHit: true,
        });

        // 添加响应时间信息
        cachedResult.responseTime = 0; // 缓存命中，响应时间为0
        cachedResult.responseTimeFormatted = "0毫秒 (缓存)"; // 格式化的响应时间

        return cachedResult;
      }
      requestStatus.cacheMisses++;
      recordCacheMiss();
    }

    // 模型回退循环
    while (fallbackAttempts <= config.maxFallbackAttempts) {
      // 更新当前模型的请求计数
      requestStatus.modelPerformance[apiConfig.model].requests++;

      // 重试循环
      retryCount = 0;
      while (retryCount <= config.maxRetries) {
        try {
          // 如果不是第一次尝试，则等待重试延迟
          if (retryCount > 0) {
            const delay = config.exponentialBackoff
              ? config.retryDelay * Math.pow(2, retryCount - 1)
              : config.retryDelay;
            console.log(`重试AI请求 (${retryCount}/${config.maxRetries})，等待${delay}毫秒...`);

            // 记录重试
            recordRetry(requestId);

            await new Promise((resolve) => setTimeout(resolve, delay));
          }

          // 发送请求
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), config.timeout);

          const response = await fetch(apiConfig.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: apiConfig.apiKey ? `Bearer ${apiConfig.apiKey}` : "",
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
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP错误! 状态码: ${response.status}, 响应: ${errorText}`);
          }

          const result = await response.json();

          // 更新请求统计
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          requestStatus.successCount++;
          requestStatus.averageResponseTime =
            (requestStatus.averageResponseTime * (requestStatus.successCount - 1) + responseTime) /
            requestStatus.successCount;

          // 更新模型性能统计
          requestStatus.modelPerformance[apiConfig.model].successes++;
          requestStatus.modelPerformance[apiConfig.model].totalResponseTime += responseTime;

          // 缓存结果
          if (config.useCache && result) {
            const cacheKey = generateCacheKey(prompt, apiConfig, dataTimestamp);
            saveToCache(cacheKey, result);
          }

          // 添加响应时间信息到结果
          result.responseTime = responseTime;
          result.responseTimeFormatted = formatDuration(responseTime);

          // 结束性能监控（成功）
          endRequest(requestId, "success", result, null, {
            duration: responseTime,
            model: apiConfig.model,
            retryCount: retryCount,
            fallbackCount: fallbackAttempts,
          });

          return result;
        } catch (error) {
          lastError = error;

          // 判断是否需要重试
          const isTimeoutError = error.name === "AbortError";
          const isNetworkError =
            error.message.includes("network") ||
            error.message.includes("连接") ||
            error.message.includes("connection");
          const isServerError = error.message.includes("5") && error.message.includes("HTTP");
          const isModelError = error.message.includes("model") || error.message.includes("模型");

          const shouldRetry = isTimeoutError || isNetworkError || isServerError;

          if (shouldRetry && retryCount < config.maxRetries) {
            retryCount++;
            console.warn(`AI请求失败 (尝试 ${retryCount}/${config.maxRetries}): ${error.message}`);
          } else {
            // 更新模型性能统计
            requestStatus.modelPerformance[apiConfig.model].failures++;

            // 达到最大重试次数，尝试模型回退
            if (config.modelFallback && fallbackAttempts < config.maxFallbackAttempts) {
              fallbackAttempts++;
              const fallbackModels = getFallbackModels();

              if (fallbackModels.length > 0) {
                // 选择下一个备用模型
                const nextModelIndex = fallbackAttempts - 1;
                if (nextModelIndex < fallbackModels.length) {
                  const nextModel = fallbackModels[nextModelIndex];
                  console.log(`切换到备用模型: ${nextModel.name}`);

                  // 切换模型
                  switchToModel(nextModel.id);
                  apiConfig = getAPIConfig(); // 获取更新后的配置
                  requestStatus.currentModel = apiConfig.model;
                  requestStatus.modelSwitchCount++;

                  // 记录模型回退
                  recordModelFallback(requestId, apiConfig.model);

                  // 初始化新模型的性能统计
                  if (!requestStatus.modelPerformance[apiConfig.model]) {
                    requestStatus.modelPerformance[apiConfig.model] = {
                      requests: 0,
                      successes: 0,
                      failures: 0,
                      totalResponseTime: 0,
                    };
                  }

                  showWarningMessage(`主模型请求失败，已切换到备用模型 ${nextModel.name}`);
                  break; // 跳出重试循环，使用新模型重新开始
                }
              }
            }

            // 没有可用的备用模型或已达到最大回退次数
            throw error;
          }
        }
      }
    }

    // 如果所有模型都失败了
    throw lastError || new Error("所有可用模型都请求失败");
  } catch (error) {
    console.error("AI分析出错:", error);

    // 更新失败统计
    requestStatus.failureCount++;

    // 确定错误类型
    let errorType = "unknown";
    let errorMessage = error.message;

    if (error.name === "AbortError") {
      errorType = "timeout";
      showErrorMessage("AI分析请求超时，请稍后再试。");
    } else if (
      error.message.includes("network") ||
      error.message.includes("连接") ||
      error.message.includes("connection")
    ) {
      errorType = "network";
      showErrorMessage("网络连接错误，请检查您的网络连接后再试。");
    } else if (error.message.includes("401")) {
      errorType = "auth";
      showErrorMessage("API密钥无效或已过期，请更新您的API配置。");
    } else if (error.message.includes("429")) {
      errorType = "rate_limit";
      showErrorMessage("请求过于频繁，请稍后再试。");
    } else if (error.message.includes("5")) {
      errorType = "server";
      showErrorMessage("AI服务暂时不可用，请稍后再试。");
    } else if (error.message.includes("所有可用模型都请求失败")) {
      errorType = "all_models_failed";
      showErrorMessage("所有可用的AI模型都请求失败，请稍后再试。");
    } else {
      showErrorMessage(`AI分析过程中发生错误: ${error.message}`);
    }

    // 结束性能监控（失败）
    endRequest(requestId, "error", null, error, {
      duration: Date.now() - startTime,
      model: apiConfig.model,
      errorType: errorType,
      errorMessage: errorMessage,
      retryCount: retryCount,
      fallbackCount: fallbackAttempts,
    });

    return null;
  } finally {
    requestStatus.inProgress = false;
    hideLoadingIndicator();
  }
}

/**
 * 批量分析多个提示
 * @param {Array<Object>} prompts - 提示数组，每个元素包含prompt和可选的options
 * @param {Object} [globalOptions] - 全局选项，将与每个提示的选项合并
 * @returns {Promise<Array<Object>>} 分析结果数组
 */
async function batchAnalyzeWithAI(prompts, globalOptions = {}) {
  if (!Array.isArray(prompts) || prompts.length === 0) {
    throw new Error("提示数组不能为空");
  }

  const results = [];
  const config = { ...DEFAULT_REQUEST_CONFIG, ...globalOptions };
  const concurrentLimit = config.maxConcurrentRequests;

  // 创建请求任务
  const tasks = prompts.map((item, index) => {
    const prompt = typeof item === "string" ? item : item.prompt;
    const options = typeof item === "string" ? {} : item.options || {};

    return async () => {
      try {
        const result = await analyzeWithAI(prompt, { ...config, ...options });
        results[index] = result;
        return result;
      } catch (error) {
        results[index] = null;
        console.error(`批量分析中第${index + 1}个提示失败:`, error);
        return null;
      }
    };
  });

  // 使用并发控制执行任务
  await executeWithConcurrencyLimit(tasks, concurrentLimit);

  return results;
}

/**
 * 将分析请求添加到队列
 * @param {string} prompt - 分析提示
 * @param {Object} [options] - 请求选项
 * @param {Function} [callback] - 完成回调函数
 * @returns {string} 请求ID
 */
function queueAnalysisRequest(prompt, options = {}, callback = null) {
  const requestId = generateRequestId();

  requestQueue.push({
    id: requestId,
    prompt,
    options,
    callback,
    timestamp: Date.now(),
  });

  requestStatus.queuedRequests = requestQueue.length;

  // 如果队列处理器未运行，则启动它
  if (!isProcessingQueue) {
    processRequestQueue();
  }

  return requestId;
}

/**
 * 处理请求队列
 */
async function processRequestQueue() {
  if (isProcessingQueue || requestQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;
  const config = DEFAULT_REQUEST_CONFIG;

  try {
    while (requestQueue.length > 0 && requestStatus.activeRequests < config.maxConcurrentRequests) {
      const request = requestQueue.shift();
      requestStatus.queuedRequests = requestQueue.length;
      requestStatus.activeRequests++;

      // 异步处理请求，不等待完成
      processRequest(request).finally(() => {
        requestStatus.activeRequests--;
        // 继续处理队列
        if (requestQueue.length > 0) {
          processRequestQueue();
        }
      });

      // 如果已达到并发限制，等待下一个循环
      if (requestStatus.activeRequests >= config.maxConcurrentRequests) {
        break;
      }
    }
  } finally {
    // 如果队列为空或已达到并发限制，标记为未处理
    if (requestQueue.length === 0 || requestStatus.activeRequests >= config.maxConcurrentRequests) {
      isProcessingQueue = false;
    }
  }
}

/**
 * 处理单个请求
 * @param {Object} request - 请求对象
 */
async function processRequest(request) {
  try {
    showInfoMessage(`正在处理分析请求 (ID: ${request.id.substring(0, 8)}...)`);
    const result = await analyzeWithAI(request.prompt, request.options);

    if (request.callback && typeof request.callback === "function") {
      request.callback(null, result, request.id);
    }

    return result;
  } catch (error) {
    console.error(`处理请求 ${request.id} 失败:`, error);

    if (request.callback && typeof request.callback === "function") {
      request.callback(error, null, request.id);
    }

    return null;
  }
}

/**
 * 生成唯一请求ID
 * @returns {string} 请求ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * 取消队列中的请求
 * @param {string} requestId - 请求ID
 * @returns {boolean} 是否成功取消
 */
function cancelQueuedRequest(requestId) {
  const initialLength = requestQueue.length;
  requestQueue = requestQueue.filter((req) => req.id !== requestId);
  requestStatus.queuedRequests = requestQueue.length;

  return requestQueue.length < initialLength;
}

/**
 * 清空请求队列
 */
function clearRequestQueue() {
  requestQueue = [];
  requestStatus.queuedRequests = 0;
}

/**
 * 使用并发限制执行任务
 * @param {Array<Function>} tasks - 任务函数数组
 * @param {number} limit - 并发限制
 */
async function executeWithConcurrencyLimit(tasks, limit) {
  const results = [];
  let activeTasks = 0;
  let taskIndex = 0;

  return new Promise((resolve) => {
    const executeTask = async () => {
      const currentTaskIndex = taskIndex++;
      if (currentTaskIndex >= tasks.length) {
        if (activeTasks === 0) resolve(results);
        return;
      }

      activeTasks++;
      try {
        results[currentTaskIndex] = await tasks[currentTaskIndex]();
      } catch (error) {
        console.error(`任务 ${currentTaskIndex} 执行失败:`, error);
        results[currentTaskIndex] = null;
      }
      activeTasks--;

      // 执行下一个任务
      executeTask();
    };

    // 启动初始任务
    const initialBatch = Math.min(limit, tasks.length);
    for (let i = 0; i < initialBatch; i++) {
      executeTask();
    }
  });
}

/**
 * 使用流式响应进行AI分析
 * @param {string} prompt - 分析提示
 * @param {Object} [options] - 请求选项
 * @param {Function} onChunk - 接收每个响应块的回调函数
 * @param {Function} [onComplete] - 分析完成时的回调函数
 * @param {string} [dataTimestamp] - 数据时间戳，用于确保缓存与数据版本一致
 * @returns {Promise<Object>} 完整的分析结果
 */
async function streamAnalyzeWithAI(
  prompt,
  options = {},
  onChunk,
  onComplete,
  dataTimestamp = null
) {
  if (typeof onChunk !== "function") {
    throw new Error("必须提供onChunk回调函数");
  }

  // 合并配置并强制启用流式响应
  const config = {
    ...DEFAULT_REQUEST_CONFIG,
    ...options,
    streamResponse: true,
  };

  let retryCount = 0;
  let fallbackAttempts = 0;
  let lastError = null;
  const startTime = Date.now();
  let completeResponse = "";
  let jsonResult = null;

  // 更新请求状态
  requestStatus.inProgress = true;
  requestStatus.lastRequestTime = startTime;
  requestStatus.requestCount++;

  // 开始性能监控
  const requestId = startRequest(prompt, config, getAPIConfig().model);

  try {
    showLoadingIndicator();

    // 检查缓存
    let apiConfig = getAPIConfig();
    requestStatus.currentModel = apiConfig.model;

    // 初始化模型性能统计
    if (!requestStatus.modelPerformance[apiConfig.model]) {
      requestStatus.modelPerformance[apiConfig.model] = {
        requests: 0,
        successes: 0,
        failures: 0,
        totalResponseTime: 0,
      };
    }

    if (config.useCache && !options.forceRefresh) {
      const cacheKey = generateCacheKey(prompt, apiConfig, dataTimestamp);
      const cachedResult = getFromCache(cacheKey, config.cacheTTL);

      if (cachedResult) {
        console.log("使用缓存的AI分析结果");
        requestStatus.cacheHits++;

        // 记录缓存命中
        recordCacheHit(requestId);

        // 添加响应时间信息到结果
        cachedResult.responseTime = 0; // 缓存命中，响应时间为0
        cachedResult.responseTimeFormatted = "0毫秒 (缓存)"; // 格式化的响应时间

        // 模拟流式响应
        if (typeof cachedResult.content === "string") {
          // 将缓存的响应分成小块，模拟流式传输
          const chunks = simulateStreamFromText(cachedResult.content);
          for (const chunk of chunks) {
            onChunk(chunk);
            await new Promise((resolve) => setTimeout(resolve, 10)); // 短暂延迟模拟流式效果
          }
        } else {
          // 如果不是字符串，直接发送完整响应
          onChunk(cachedResult);
        }

        // 结束性能监控（成功，使用缓存）
        endRequest(requestId, "success", cachedResult, null, {
          duration: Date.now() - startTime,
          cacheHit: true,
        });

        if (onComplete) onComplete(cachedResult);
        return cachedResult;
      }
      requestStatus.cacheMisses++;
      recordCacheMiss();
    }

    // 模型回退循环
    while (fallbackAttempts <= config.maxFallbackAttempts) {
      // 更新当前模型的请求计数
      requestStatus.modelPerformance[apiConfig.model].requests++;

      // 重试循环
      retryCount = 0;
      while (retryCount <= config.maxRetries) {
        try {
          // 如果不是第一次尝试，则等待重试延迟
          if (retryCount > 0) {
            const delay = config.exponentialBackoff
              ? config.retryDelay * Math.pow(2, retryCount - 1)
              : config.retryDelay;
            console.log(`重试AI请求 (${retryCount}/${config.maxRetries})，等待${delay}毫秒...`);

            // 记录重试
            recordRetry(requestId);

            await new Promise((resolve) => setTimeout(resolve, delay));
          }

          // 发送请求
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), config.timeout);

          const response = await fetch(apiConfig.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: apiConfig.apiKey ? `Bearer ${apiConfig.apiKey}` : "",
              Accept: "text/event-stream",
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
              stream: true,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP错误! 状态码: ${response.status}, 响应: ${errorText}`);
          }

          // 处理流式响应
          const reader = response.body.getReader();
          const decoder = new TextDecoder("utf-8");
          let buffer = "";
          let chunkCount = 0;
          let done = false;

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;

            if (done) break;

            // 解码接收到的数据
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // 处理SSE格式的数据
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // 保留最后一个不完整的行

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.substring(6);
                if (data === "[DONE]") {
                  done = true;
                  break;
                }

                try {
                  const json = JSON.parse(data);
                  const content = json.choices?.[0]?.delta?.content || "";
                  if (content) {
                    completeResponse += content;
                    onChunk(content);
                    chunkCount++;

                    // 更新加载进度
                    if (chunkCount % 5 === 0) {
                      updateLoadingProgress(Math.min(95, chunkCount / 2));
                    }
                  }
                } catch (e) {
                  console.warn("解析流式响应数据失败:", e);
                }
              }
            }
          }

          // 尝试将完整响应解析为JSON
          try {
            jsonResult = JSON.parse(completeResponse);
          } catch (e) {
            // 如果不是有效的JSON，则创建一个包含原始文本的对象
            jsonResult = {
              content: completeResponse,
              choices: [
                {
                  message: {
                    content: completeResponse,
                  },
                },
              ],
            };
          }

          // 更新请求统计
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          requestStatus.successCount++;
          requestStatus.averageResponseTime =
            (requestStatus.averageResponseTime * (requestStatus.successCount - 1) + responseTime) /
            requestStatus.successCount;

          // 更新模型性能统计
          requestStatus.modelPerformance[apiConfig.model].successes++;
          requestStatus.modelPerformance[apiConfig.model].totalResponseTime += responseTime;

          // 缓存结果
          if (config.useCache && jsonResult) {
            const cacheKey = generateCacheKey(prompt, apiConfig, dataTimestamp);
            saveToCache(cacheKey, jsonResult);
          }

          // 添加响应时间信息到结果
          jsonResult.responseTime = responseTime;
          jsonResult.responseTimeFormatted = formatDuration(responseTime);

          // 结束性能监控（成功）
          endRequest(requestId, "success", jsonResult, null, {
            duration: responseTime,
            model: apiConfig.model,
            retryCount: retryCount,
            fallbackCount: fallbackAttempts,
          });

          // 调用完成回调
          if (onComplete) onComplete(jsonResult);

          return jsonResult;
        } catch (error) {
          lastError = error;

          // 判断是否需要重试
          const isTimeoutError = error.name === "AbortError";
          const isNetworkError =
            error.message.includes("network") ||
            error.message.includes("连接") ||
            error.message.includes("connection");
          const isServerError = error.message.includes("5") && error.message.includes("HTTP");

          const shouldRetry = isTimeoutError || isNetworkError || isServerError;

          if (shouldRetry && retryCount < config.maxRetries) {
            retryCount++;
            console.warn(
              `流式AI请求失败 (尝试 ${retryCount}/${config.maxRetries}): ${error.message}`
            );
          } else {
            // 更新模型性能统计
            requestStatus.modelPerformance[apiConfig.model].failures++;

            // 达到最大重试次数，尝试模型回退
            if (config.modelFallback && fallbackAttempts < config.maxFallbackAttempts) {
              fallbackAttempts++;
              const fallbackModels = getFallbackModels();

              if (fallbackModels.length > 0) {
                // 选择下一个备用模型
                const nextModelIndex = fallbackAttempts - 1;
                if (nextModelIndex < fallbackModels.length) {
                  const nextModel = fallbackModels[nextModelIndex];
                  console.log(`切换到备用模型: ${nextModel.name}`);

                  // 切换模型
                  switchToModel(nextModel.id);
                  apiConfig = getAPIConfig(); // 获取更新后的配置
                  requestStatus.currentModel = apiConfig.model;
                  requestStatus.modelSwitchCount++;

                  // 记录模型回退
                  recordModelFallback(requestId, apiConfig.model);

                  // 初始化新模型的性能统计
                  if (!requestStatus.modelPerformance[apiConfig.model]) {
                    requestStatus.modelPerformance[apiConfig.model] = {
                      requests: 0,
                      successes: 0,
                      failures: 0,
                      totalResponseTime: 0,
                    };
                  }

                  showWarningMessage(`主模型请求失败，已切换到备用模型 ${nextModel.name}`);
                  break; // 跳出重试循环，使用新模型重新开始
                }
              }
            }

            // 没有可用的备用模型或已达到最大回退次数
            throw error;
          }
        }
      }
    }

    // 如果所有模型都失败了
    throw lastError || new Error("所有可用模型都请求失败");
  } catch (error) {
    console.error("流式AI分析出错:", error);

    // 更新失败统计
    requestStatus.failureCount++;

    // 确定错误类型
    let errorType = "unknown";
    let errorMessage = "";

    if (error.name === "AbortError") {
      errorType = "timeout";
      errorMessage = "AI分析请求超时，请稍后再试。";
    } else if (
      error.message.includes("network") ||
      error.message.includes("连接") ||
      error.message.includes("connection")
    ) {
      errorType = "network";
      errorMessage = "网络连接错误，请检查您的网络连接后再试。";
    } else if (error.message.includes("401")) {
      errorType = "auth";
      errorMessage = "API密钥无效或已过期，请更新您的API配置。";
    } else if (error.message.includes("429")) {
      errorType = "rate_limit";
      errorMessage = "请求过于频繁，请稍后再试。";
    } else if (error.message.includes("5")) {
      errorType = "server";
      errorMessage = "AI服务暂时不可用，请稍后再试。";
    } else if (error.message.includes("所有可用模型都请求失败")) {
      errorType = "all_models_failed";
      errorMessage = "所有可用的AI模型都请求失败，请稍后再试。";
    } else {
      errorMessage = `AI分析过程中发生错误: ${error.message}`;
    }

    // 结束性能监控（失败）
    endRequest(requestId, "error", null, error, {
      duration: Date.now() - startTime,
      model: apiConfig.model,
      errorType: errorType,
      errorMessage: error.message,
      retryCount: retryCount,
      fallbackCount: fallbackAttempts,
    });

    showErrorMessage(errorMessage);
    onChunk(`[错误] ${errorMessage}`);

    if (onComplete) onComplete(null);
    return null;
  } finally {
    requestStatus.inProgress = false;
    hideLoadingIndicator();
  }
}

/**
 * 将文本分割成小块以模拟流式响应
 * @param {string} text - 要分割的文本
 * @returns {Array<string>} 文本块数组
 */
function simulateStreamFromText(text) {
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

export {
  analyzeWithAI,
  getRequestStatus,
  clearCache,
  batchAnalyzeWithAI,
  queueAnalysisRequest,
  cancelQueuedRequest,
  clearRequestQueue,
  streamAnalyzeWithAI,
};
