/**
 * @file jest.config.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description Jest 配置文件
 */

export default {
  // 基础配置
  testEnvironment: "jsdom",
  transform: {},

  // 自动收集测试覆盖率
  collectCoverage: true,

  // 指定覆盖率报告的生成目录
  coverageDirectory: "coverage",

  // 指定覆盖率报告的格式
  coverageReporters: ["json", "lcov", "text", "clover"],

  // 指定覆盖率统计的提供者 (v8 更快)
  coverageProvider: "v8",

  // 在运行每个测试文件之前，执行一些设置脚本
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // 清理模拟调用、实例和宏
  // 确保测试之间不会相互影响
  clearMocks: true,
};
