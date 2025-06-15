/**
 * @file api-config.test.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description api-config.js 模块的单元测试
 */

import { jest } from "@jest/globals";

describe("api-config.js", () => {
  let apiConfigModule;
  let defaultAPIConfigValue;

  beforeEach(async () => {
    jest.resetModules(); // Reset modules to get a fresh import each time
    apiConfigModule = await import("../api-config.example.js"); // Assuming api-config.js will be based on this example

    // Capture the initial default config after a fresh import
    defaultAPIConfigValue = apiConfigModule.getAPIConfig();
  });

  // Test 1: getAPIConfig should return the current API configuration
  test("getAPIConfig should return the current API configuration", () => {
    const config = apiConfigModule.getAPIConfig();
    expect(config).toEqual(defaultAPIConfigValue);
    // Ensure it returns a copy, not the direct reference
    config.model = "changed-model";
    expect(apiConfigModule.getAPIConfig().model).toEqual(defaultAPIConfigValue.model);
  });

  // Test 2: updateAPIConfig should merge new configuration items
  test("updateAPIConfig should merge new configuration items", () => {
    const newConfig = {
      model: "new-test-model",
      temperature: 0.5,
    };
    apiConfigModule.updateAPIConfig(newConfig);
    const updatedConfig = apiConfigModule.getAPIConfig();

    expect(updatedConfig.model).toBe("new-test-model");
    expect(updatedConfig.temperature).toBe(0.5);
    expect(updatedConfig.apiKey).toBe(defaultAPIConfigValue.apiKey); // Other properties should remain
  });

  // Test 3: resetAPIConfig should restore configuration to default values
  test("resetAPIConfig should restore configuration to default values", () => {
    apiConfigModule.updateAPIConfig({
      model: "temporary-model",
      apiKey: "temporary-key",
    });
    expect(apiConfigModule.getAPIConfig().model).toBe("temporary-model");

    apiConfigModule.resetAPIConfig();
    expect(apiConfigModule.getAPIConfig()).toEqual(defaultAPIConfigValue);
  });

  // Test 4: getAvailableModels should return a list of available models
  test("getAvailableModels should return a list of available models", () => {
    const models = apiConfigModule.getAvailableModels();
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
    expect(models[0]).toHaveProperty("id");
    expect(models[0]).toHaveProperty("name");
  });

  // Test 5: getPrimaryModel should return the primary model
  test("getPrimaryModel should return the primary model", () => {
    const primaryModel = apiConfigModule.getPrimaryModel();
    expect(primaryModel).toBeDefined();
    expect(primaryModel.isPrimary).toBe(true);
    expect(primaryModel.id).toBe("deepseek-ai/DeepSeek-R1-Distill-Qwen-14B");
  });

  // Test 6: getFallbackModels should return a list of fallback models
  test("getFallbackModels should return a list of fallback models", () => {
    const fallbackModels = apiConfigModule.getFallbackModels();
    expect(Array.isArray(fallbackModels)).toBe(true);
    expect(fallbackModels.length).toBeGreaterThan(0);
    expect(fallbackModels.every((model) => !model.isPrimary)).toBe(true);
  });

  // Test 7: switchToModel should update the current model and related configs
  test("switchToModel should update the current model and related configs", () => {
    const targetModelId = "Qwen/Qwen-7B-Chat";
    const success = apiConfigModule.switchToModel(targetModelId);
    const currentConfig = apiConfigModule.getAPIConfig();

    expect(success).toBe(true);
    expect(currentConfig.model).toBe(targetModelId);
    expect(currentConfig.url).toBe("http://internal-vllm-service.company.com/v1/chat/completions");
    expect(currentConfig.maxTokens).toBe(1500);
  });

  // Test 8: switchToModel should return false for an invalid model ID
  test("switchToModel should return false for an invalid model ID", () => {
    const invalidModelId = "non-existent-model";
    const success = apiConfigModule.switchToModel(invalidModelId);
    const currentConfig = apiConfigModule.getAPIConfig();

    expect(success).toBe(false);
    expect(currentConfig.model).toBe(defaultAPIConfigValue.model); // Should not change
  });
});
