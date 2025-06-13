/**
 * @file analyzer-utils.test.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description analyzer-utils.js 的单元测试。
 */

import { generateCacheKey, simulateStreamFromText } from "../analyzer-utils.js";

describe("analyzer-utils.js", () => {
  // --- 测试 generateCacheKey ---
  describe("generateCacheKey()", () => {
    const mockApiConfig = {
      model: "test-model",
      temperature: 0.7,
      maxTokens: 100,
    };

    it("应能根据所有输入参数生成一个确定的、可预测的缓存键", () => {
      const prompt = "分析数据";
      const timestamp = "2025-06-13T15:00:00Z";

      const expectedKey = JSON.stringify([prompt, "test-model", 0.7, 100, timestamp]);

      expect(generateCacheKey(prompt, mockApiConfig, timestamp)).toBe(expectedKey);
    });

    it("当 dataTimestamp 为 null 或 undefined 时，也应能正常工作", () => {
      const prompt = "分析数据";

      const expectedKeyWithNull = JSON.stringify([prompt, "test-model", 0.7, 100, null]);
      const expectedKeyWithUndefined = JSON.stringify([prompt, "test-model", 0.7, 100, undefined]);

      expect(generateCacheKey(prompt, mockApiConfig, null)).toBe(expectedKeyWithNull);
      expect(generateCacheKey(prompt, mockApiConfig, undefined)).toBe(expectedKeyWithUndefined);
    });

    it("当任何一个输入参数改变时，生成的缓存键都应该不同", () => {
      const prompt1 = "分析数据 A";
      const prompt2 = "分析数据 B";
      const timestamp = "2025-06-13T15:00:00Z";

      const key1 = generateCacheKey(prompt1, mockApiConfig, timestamp);
      const key2 = generateCacheKey(prompt2, mockApiConfig, timestamp);

      expect(key1).not.toBe(key2);
    });
  });

  // --- 测试 simulateStreamFromText ---
  describe("simulateStreamFromText()", () => {
    it("应能将一个非空字符串分割成一个或多个小块", () => {
      const text = "这是一个用于测试的示例文本。";
      const chunks = simulateStreamFromText(text);

      expect(Array.isArray(chunks)).toBe(true);
      expect(chunks.length).toBeGreaterThan(0);
    });

    it("分割后的所有小块拼接起来应等于原始文本", () => {
      const originalText =
        "这是一个长长长长长长长长长长长长长长长长长长的示例文本，用于验证拼接的完整性。";
      const chunks = simulateStreamFromText(originalText);
      const reconstructedText = chunks.join("");

      expect(reconstructedText).toBe(originalText);
    });

    it("当输入为空字符串时，应返回一个空数组", () => {
      const chunks = simulateStreamFromText("");
      expect(chunks).toEqual([]);
    });

    it("当输入为 null 或 undefined 时，应返回一个空数组", () => {
      expect(simulateStreamFromText(null)).toEqual([]);
      expect(simulateStreamFromText(undefined)).toEqual([]);
    });
  });
});
