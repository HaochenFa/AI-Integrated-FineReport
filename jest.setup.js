/**
 * @file jest.setup.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description Jest 测试环境配置
 */

import { jest } from "@jest/globals";

// 在所有测试运行前，用一个 jest.fn() 来模拟全局的 fetch 函数。
// jest.fn() 是一个简单的模拟函数，可以让我们在测试中控制它的行为。
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: "mocked response" }),
  })
);
