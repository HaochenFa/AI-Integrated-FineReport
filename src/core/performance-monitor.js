/**
 * @file performance-monitor.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description 性能监控模块 - 负责收集和存储AI分析性能数据
 */

// 性能监控配置
const DEFAULT_MONITOR_CONFIG = {
  enabled: true, // 是否启用性能监控
  maxRecentRequests: 50, // 最近请求记录的最大数量
  persistData: false, // 是否持久化存储数据
  storageKey: "aida_performance_data", // 本地存储的键名
};

// 性能数据存储
let performanceData = {
  // 总体统计
  overall: {
    totalRequests: 0, // 总请求数
    successfulRequests: 0, // 成功请求数
    failedRequests: 0, // 失败请求数
    totalResponseTime: 0, // 总响应时间(毫秒)
    averageResponseTime: 0, // 平均响应时间(毫秒)
    minResponseTime: Infinity, // 最小响应时间(毫秒)
    maxResponseTime: 0, // 最大响应时间(毫秒)
    totalRetries: 0, // 总重试次数
    totalModelFallbacks: 0, // 总模型回退次数
  },

  // 模型性能
  modelPerformance: {}, // 按模型ID索引的性能数据

  // Token使用统计
  tokenUsage: {
    totalPromptTokens: 0, // 总提示词token数
    totalCompletionTokens: 0, // 总完成token数
    totalTokens: 0, // 总token数
    estimatedCost: 0, // 估计成本(美元)
  },

  // 缓存统计
  cacheStats: {
    hits: 0, // 缓存命中次数
    misses: 0, // 缓存未命中次数
    hitRate: 0, // 缓存命中率
  },

  // 最近请求记录
  recentRequests: [], // 最近的请求记录数组
};

// 监控配置
let monitorConfig = { ...DEFAULT_MONITOR_CONFIG };

// 当前活跃请求映射 (requestId -> requestData)
const activeRequests = new Map();

/**
 * 开始记录请求
 * @param {string} prompt - 请求的提示词
 * @param {Object} options - 请求选项
 * @param {string} [modelId] - 模型ID
 * @returns {string} 请求ID
 */
function startRequest(prompt, options = {}, modelId = null) {
  if (!monitorConfig.enabled) return null;

  const requestId = generateRequestId();
  const startTime = Date.now();

  // 创建请求记录
  const requestData = {
    id: requestId,
    prompt,
    options,
    modelId,
    startTime,
    endTime: null,
    duration: null,
    status: "pending", // pending, success, error
    retryCount: 0,
    modelFallbacks: 0,
    tokenUsage: {
      promptTokens: estimateTokenCount(prompt),
      completionTokens: 0,
      totalTokens: 0,
    },
    cacheHit: false,
    error: null,
    streamResponse: options.streamResponse || false,
  };

  // 存储活跃请求
  activeRequests.set(requestId, requestData);

  return requestId;
}

/**
 * 结束请求记录
 * @param {string} requestId - 请求ID
 * @param {string} status - 请求状态 (success, error)
 * @param {Object} [result] - 请求结果
 * @param {Error} [error] - 错误对象
 * @param {Object} [metadata] - 额外元数据
 */
function endRequest(requestId, status, result = null, error = null, metadata = {}) {
  if (!monitorConfig.enabled || !requestId || !activeRequests.has(requestId)) return;

  const requestData = activeRequests.get(requestId);
  const endTime = Date.now();
  const duration = endTime - requestData.startTime;

  // 更新请求数据
  requestData.endTime = endTime;
  requestData.duration = duration;
  requestData.status = status;
  requestData.result = result;
  requestData.error = error;

  // 合并元数据
  Object.assign(requestData, metadata);

  // 如果有token使用信息，更新它
  if (metadata.tokenUsage) {
    requestData.tokenUsage.completionTokens = metadata.tokenUsage.completionTokens || 0;
    requestData.tokenUsage.totalTokens =
      requestData.tokenUsage.promptTokens + requestData.tokenUsage.completionTokens;
  }

  // 从活跃请求中移除
  activeRequests.delete(requestId);

  // 更新性能统计数据
  updatePerformanceStats(requestData);

  // 如果配置了持久化存储，则保存数据
  if (monitorConfig.persistData) {
    persistPerformanceData();
  }
}

/**
 * 记录请求重试
 * @param {string} requestId - 请求ID
 */
function recordRetry(requestId) {
  if (!monitorConfig.enabled || !requestId || !activeRequests.has(requestId)) return;

  const requestData = activeRequests.get(requestId);
  requestData.retryCount++;
}

/**
 * 记录模型回退
 * @param {string} requestId - 请求ID
 * @param {string} newModelId - 新模型ID
 */
function recordModelFallback(requestId, newModelId) {
  if (!monitorConfig.enabled || !requestId || !activeRequests.has(requestId)) return;

  const requestData = activeRequests.get(requestId);
  requestData.modelFallbacks++;
  requestData.modelId = newModelId;
}

/**
 * 记录缓存命中
 * @param {string} requestId - 请求ID
 */
function recordCacheHit(requestId) {
  if (!monitorConfig.enabled || !requestId || !activeRequests.has(requestId)) return;

  const requestData = activeRequests.get(requestId);
  requestData.cacheHit = true;
  performanceData.cacheStats.hits++;

  // 更新缓存命中率
  const totalCacheAttempts = performanceData.cacheStats.hits + performanceData.cacheStats.misses;
  performanceData.cacheStats.hitRate =
    totalCacheAttempts > 0 ? performanceData.cacheStats.hits / totalCacheAttempts : 0;
}

/**
 * 记录缓存未命中
 */
function recordCacheMiss() {
  if (!monitorConfig.enabled) return;

  performanceData.cacheStats.misses++;

  // 更新缓存命中率
  const totalCacheAttempts = performanceData.cacheStats.hits + performanceData.cacheStats.misses;
  performanceData.cacheStats.hitRate =
    totalCacheAttempts > 0 ? performanceData.cacheStats.hits / totalCacheAttempts : 0;
}

/**
 * 更新性能统计数据
 * @param {Object} requestData - 请求数据
 */
function updatePerformanceStats(requestData) {
  // 更新总体统计
  performanceData.overall.totalRequests++;

  if (requestData.status === "success") {
    performanceData.overall.successfulRequests++;

    // 更新响应时间统计
    performanceData.overall.totalResponseTime += requestData.duration;
    performanceData.overall.averageResponseTime =
      performanceData.overall.totalResponseTime / performanceData.overall.successfulRequests;

    performanceData.overall.minResponseTime = Math.min(
      performanceData.overall.minResponseTime,
      requestData.duration
    );
    performanceData.overall.maxResponseTime = Math.max(
      performanceData.overall.maxResponseTime,
      requestData.duration
    );
  } else {
    performanceData.overall.failedRequests++;
  }

  // 更新重试和回退统计
  performanceData.overall.totalRetries += requestData.retryCount;
  performanceData.overall.totalModelFallbacks += requestData.modelFallbacks;

  // 更新模型性能统计
  if (requestData.modelId) {
    if (!performanceData.modelPerformance[requestData.modelId]) {
      performanceData.modelPerformance[requestData.modelId] = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        totalTokens: 0,
      };
    }

    const modelStats = performanceData.modelPerformance[requestData.modelId];
    modelStats.totalRequests++;

    if (requestData.status === "success") {
      modelStats.successfulRequests++;
      modelStats.totalResponseTime += requestData.duration;
      modelStats.averageResponseTime = modelStats.totalResponseTime / modelStats.successfulRequests;
    } else {
      modelStats.failedRequests++;
    }

    // 更新token使用
    if (requestData.tokenUsage) {
      modelStats.totalTokens += requestData.tokenUsage.totalTokens;
    }
  }

  // 更新token使用统计
  if (requestData.tokenUsage) {
    performanceData.tokenUsage.totalPromptTokens += requestData.tokenUsage.promptTokens;
    performanceData.tokenUsage.totalCompletionTokens += requestData.tokenUsage.completionTokens;
    performanceData.tokenUsage.totalTokens += requestData.tokenUsage.totalTokens;

    // 这里可以添加成本估算逻辑
    // performanceData.tokenUsage.estimatedCost += calculateCost(requestData);
  }

  // 更新最近请求记录
  performanceData.recentRequests.unshift({
    id: requestData.id,
    modelId: requestData.modelId,
    timestamp: requestData.startTime,
    duration: requestData.duration,
    status: requestData.status,
    promptLength: requestData.prompt.length,
    cacheHit: requestData.cacheHit,
    retryCount: requestData.retryCount,
    modelFallbacks: requestData.modelFallbacks,
    streamResponse: requestData.streamResponse,
    tokenUsage: requestData.tokenUsage,
  });

  // 限制最近请求记录数量
  if (performanceData.recentRequests.length > monitorConfig.maxRecentRequests) {
    performanceData.recentRequests = performanceData.recentRequests.slice(
      0,
      monitorConfig.maxRecentRequests
    );
  }
}

/**
 * 获取性能数据
 * @returns {Object} 性能数据
 */
function getPerformanceData() {
  return { ...performanceData };
}

/**
 * 重置性能数据
 */
function resetPerformanceData() {
  performanceData = {
    overall: {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      totalRetries: 0,
      totalModelFallbacks: 0,
    },
    modelPerformance: {},
    tokenUsage: {
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
    },
    cacheStats: {
      hits: 0,
      misses: 0,
      hitRate: 0,
    },
    recentRequests: [],
  };

  // 如果配置了持久化存储，则清除存储的数据
  if (monitorConfig.persistData && typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(monitorConfig.storageKey);
    } catch (error) {
      console.error("清除持久化性能数据出错:", error);
    }
  }
}

/**
 * 配置性能监控
 * @param {Object} config - 配置选项
 */
function configurePerformanceMonitor(config = {}) {
  monitorConfig = { ...DEFAULT_MONITOR_CONFIG, ...config };

  // 如果启用了持久化存储，则尝试加载之前的数据
  if (monitorConfig.enabled && monitorConfig.persistData) {
    loadPerformanceData();
  }
}

/**
 * 持久化存储性能数据
 */
function persistPerformanceData() {
  if (typeof localStorage === "undefined") return;

  try {
    localStorage.setItem(monitorConfig.storageKey, JSON.stringify(performanceData));
  } catch (error) {
    console.error("持久化存储性能数据出错:", error);
  }
}

/**
 * 加载持久化的性能数据
 */
function loadPerformanceData() {
  if (typeof localStorage === "undefined") return;

  try {
    const storedDataJSON = localStorage.getItem(monitorConfig.storageKey);
    if (storedDataJSON) {
      const storedData = JSON.parse(storedDataJSON);

      // 安全地合并数据，而不是完全覆盖
      // 这样可以确保即使存储的数据不完整，默认的结构依然存在
      performanceData = {
        ...performanceData, // 保持默认结构
        ...storedData, // 应用存储的数据
        // 对嵌套对象进行深度合并
        overall: {
          ...performanceData.overall,
          ...(storedData.overall || {}),
        },
        tokenUsage: {
          ...performanceData.tokenUsage,
          ...(storedData.tokenUsage || {}),
        },
        cacheStats: {
          ...performanceData.cacheStats,
          ...(storedData.cacheStats || {}),
        },
        // 对数组和复杂对象，可以根据需要进行更精细的合并
        // 这里为了简单起见，直接使用存储的值（如果存在）
        modelPerformance: storedData.modelPerformance || performanceData.modelPerformance,
        recentRequests: storedData.recentRequests || performanceData.recentRequests,
      };
    }
  } catch (error) {
    console.error("加载持久化性能数据出错:", error);
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
 * 估算token数量
 * @param {string} text - 文本内容
 * @returns {number} 估算的token数量
 */
function estimateTokenCount(text) {
  if (!text) return 0;

  // todo)) 是否应该精细化token的计算
  // 简单估算：平均每4个字符约为1个token
  // 这只是一个粗略估计，实际token数量取决于具体的tokenizer
  return Math.ceil(text.length / 4);
}

/**
 * 格式化持续时间
 * @param {number} ms - 毫秒数
 * @returns {string} 格式化后的持续时间
 */
function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms}毫秒`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}秒`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(2);
    return `${minutes}分${seconds}秒`;
  }
}

export {
  startRequest,
  endRequest,
  recordRetry,
  recordModelFallback,
  recordCacheHit,
  recordCacheMiss,
  getPerformanceData,
  resetPerformanceData,
  configurePerformanceMonitor,
  formatDuration,
  estimateTokenCount,
};
