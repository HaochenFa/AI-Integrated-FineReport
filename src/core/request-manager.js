/**
 * @file request-manager.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description 请求管理器模块 - 处理所有与请求相关的操作
 */

import { analyzeWithAI } from "./ai-analyzer";

/** @type {Array<{id: string, prompt: string, options: object, callback: function, timestamp: number}>} */
let requestQueue = [];
let isProcessingQueue = false;
let activeRequests = 0;

const DEFAULT_CONCURRENT_LIMIT = 2; // 默认最大并发请求数

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
 * 处理请求队列
 */
async function processRequestQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  // 检查是否有可用的并发槽位
  while (requestQueue.length > 0 && activeRequests < DEFAULT_CONCURRENT_LIMIT) {
    const request = requestQueue.shift();
    activeRequests++; // 占用一个槽位

    console.log(`开始处理请求 ${request.id.substring(0, 8)}... 当前活跃请求数: ${activeRequests}`);

    // 异步执行分析，不阻塞 processRequestQueue 的循环
    analyzeWithAI(request.prompt, request.options)
      .then((result) => {
        if (request.callback) {
          request.callback(null, result, request.id);
        }
      })
      .catch((error) => {
        console.error(`处理请求 ${request.id} 失败:`, error);
        if (request.callback) {
          request.callback(error, null, request.id);
        }
      })
      .finally(() => {
        activeRequests--; // 释放一个槽位
        console.log(
          `请求 ${request.id.substring(0, 8)} 处理完成。当前活跃请求数: ${activeRequests}`
        );

        // 尝试处理队列中的下一个任务
        // 必须在 finally 中再次调用，以确保任务完成后能立即补充新任务
        processRequestQueue();
      });
  }

  isProcessingQueue = false;
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

export {
  queueAnalysisRequest,
  batchAnalyzeWithAI,
  processRequestQueue,
  cancelQueuedRequest,
  clearRequestQueue,
  processRequest,
  executeWithConcurrencyLimit,
};
