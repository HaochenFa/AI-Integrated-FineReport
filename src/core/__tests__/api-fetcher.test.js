/**
 * @file api-fetcher.test.js (Complete Version)
 * @author Haochen (Billy) Fa 法昊辰
 * @description api-fetcher.js 的单元测试，包含成功和失败路径。
 */

import { TextEncoder, TextDecoder } from "util";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import { fetchStandard, fetchStream } from "../api-fetcher.js";

const mockApiConfig = {
  url: "http://test.api/completions",
  apiKey: "test-key",
  model: "test-model",
  systemPrompt: "You are a testing assistant.",
};
const mockOptions = { temperature: 0.5, maxTokens: 50 };
const mockPrompt = "test prompt";

describe("api-fetcher.js", () => {
  beforeEach(() => {
    global.fetch.mockClear();
  });

  describe("fetchStandard", () => {
    const bodyPayload = {
      model: mockApiConfig.model,
      messages: [
        { role: "system", content: mockApiConfig.systemPrompt },
        { role: "user", content: mockPrompt },
      ],
      stream: false,
      ...mockOptions,
    };

    it("应该能成功发起请求并返回解析后的JSON", async () => {
      const mockData = { id: "123", content: "success" };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await fetchStandard(
        mockApiConfig.url,
        mockApiConfig.apiKey,
        bodyPayload,
        5000
      );
      expect(result).toEqual(mockData);
    });

    // --- 新增测试用例 ---
    it("当遇到HTTP错误时，应该抛出包含状态码的错误", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error"),
      });

      await expect(
        fetchStandard(mockApiConfig.url, mockApiConfig.apiKey, bodyPayload, 5000)
      ).rejects.toThrow("HTTP 错误! 状态码: 500");
    });

    // --- 新增测试用例 ---
    it("当fetch本身因网络问题失败时，应该向上抛出错误", async () => {
      const networkError = new Error("Network request failed");
      global.fetch.mockRejectedValueOnce(networkError);

      await expect(
        fetchStandard(mockApiConfig.url, mockApiConfig.apiKey, bodyPayload, 5000)
      ).rejects.toThrow(networkError);
    });
  });

  describe("fetchStream", () => {
    const bodyPayload = {
      model: mockApiConfig.model,
      messages: [
        { role: "system", content: mockApiConfig.systemPrompt },
        { role: "user", content: mockPrompt },
      ],
      stream: true,
      ...mockOptions,
    };

    it("应该能处理流式响应并正确调用onChunk回调", async () => {
      const mockReader = {
        read: jest
          .fn()
          .mockResolvedValueOnce({
            value: new TextEncoder().encode(
              'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'
            ),
            done: false,
          })
          .mockResolvedValueOnce({
            value: new TextEncoder().encode(
              'data: {"choices":[{"delta":{"content":" world"}}]}\n\n'
            ),
            done: false,
          })
          .mockResolvedValueOnce({
            value: new TextEncoder().encode("data: [DONE]\n\n"),
            done: false,
          })
          .mockResolvedValueOnce({ value: undefined, done: true }),
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader },
      });
      const onChunk = jest.fn();

      await fetchStream(mockApiConfig.url, mockApiConfig.apiKey, bodyPayload, 5000, onChunk);
      expect(onChunk).toHaveBeenCalledTimes(2);
      expect(onChunk).toHaveBeenNthCalledWith(1, "Hello");
    });

    // --- 新增测试用例 ---
    it("当遇到流式请求的HTTP错误时，也应该抛出错误", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      });
      const onChunk = jest.fn();

      await expect(
        fetchStream(mockApiConfig.url, mockApiConfig.apiKey, bodyPayload, 5000, onChunk)
      ).rejects.toThrow("HTTP 错误! 状态码: 401");
    });
  });
});
