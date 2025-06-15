/**
 * @file api-fetcher.js (Final, Decoupled Version)
 * @author Haochen (Billy) Fa 法昊辰
 * @description API 请求器模块 - 一个无依赖的、纯粹的网络通信单元。
 */

async function fetchStandard(url, apiKey, bodyPayload, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey ? `Bearer ${apiKey}` : "",
      },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP 错误! 状态码: ${response.status}, 响应: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function fetchStream(url, apiKey, bodyPayload, timeout, onChunk) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  let completeResponse = "";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey ? `Bearer ${apiKey}` : "",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP 错误! 状态码: ${response.status}, 响应: ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const {value, done} = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, {stream: true});
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.substring(6);
          if (data.trim() === "[DONE]") break;
          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content || "";
            if (content) {
              completeResponse += content;
              if (onChunk) onChunk(content);
            }
          } catch (e) {
            console.warn("解析流式JSON失败:", data, e);
          }
        }
      }
    }
    return completeResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export {fetchStandard, fetchStream};