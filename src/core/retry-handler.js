/**
 * @file retry-handler.js (Final, Recursive & Simple Version)
 * @author Haochen (Billy) Fa 法昊辰
 * @description 重试与回退处理器模块
 */

function isRetriableError(error) {
  if (!error) return false;
  const message = String(error.message || "").toLowerCase();
  if (/http.*4\d{2}/.test(message)) {
    if (message.includes("429")) return true;
    return false;
  }
  return true;
}

// 这是一个内部的、递归的辅助函数
async function tryRequest(attempt, options, fetcherFn, hooks) {
  try {
    if (attempt > 1) {
      const delay = options.exponentialBackoff
        ? options.retryDelay * Math.pow(2, attempt - 2)
        : options.retryDelay;
      if (hooks.onRetry) hooks.onRetry();
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return await fetcherFn();
  } catch (error) {
    if (!isRetriableError(error) || attempt > options.maxRetries) {
      // 如果错误不可重试，或已达到最大重试次数，则直接抛出
      throw error;
    }
    // 否则，进行下一次递归尝试
    return tryRequest(attempt + 1, options, fetcherFn, hooks);
  }
}

export async function executeRequestWithRetry(
  initialApiConfig,
  fallbackModels,
  requestOptions,
  fetcherFunction,
  hooks = {}
) {
  const modelsToTry = [initialApiConfig, ...(requestOptions.modelFallback ? fallbackModels : [])];
  let lastError = null;

  for (const modelConfig of modelsToTry) {
    let currentApiConfig = modelConfig;
    if (modelConfig !== initialApiConfig && hooks.onFallback) {
      currentApiConfig = await hooks.onFallback(modelConfig.id);
    }

    try {
      // 对每个模型，调用我们的递归重试函数
      return await tryRequest(1, requestOptions, () => fetcherFunction(currentApiConfig), hooks);
    } catch (error) {
      lastError = error;
      // 如果错误是不可重试的，立即中断回退
      if (!isRetriableError(error)) {
        throw lastError;
      }
      // 否则，继续尝试下一个备用模型
    }
  }

  throw lastError || new Error("所有可用模型都请求失败");
}
