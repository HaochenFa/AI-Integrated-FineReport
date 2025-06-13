/**
 * @file prompt-templates.test.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description prompt-templates.js 模块的单元测试
 */

// 声明变量，以便在 beforeEach 中进行赋值
let getPromptTemplates, updatePromptTemplates, resetPromptTemplates, defaultPromptTemplates;

describe("prompt-templates.js", () => {
  // 在每个测试用例运行前，重置模块以获得一个干净的、无污染的实例
  beforeEach(() => {
    jest.resetModules();
    // 重新加载模块。由于测试文件现在与源文件在同一目录下，路径变为'../'
    const promptTemplatesModule = require("../prompt-templates.js");
    getPromptTemplates = promptTemplatesModule.getPromptTemplates;
    updatePromptTemplates = promptTemplatesModule.updatePromptTemplates;
    resetPromptTemplates = promptTemplatesModule.resetPromptTemplates;

    resetPromptTemplates(); // 确保开始时是默认状态
    defaultPromptTemplates = getPromptTemplates();
  });

  // 测试1: 初始状态验证
  test("getPromptTemplates 应该返回默认的模板对象", () => {
    const currentTemplates = getPromptTemplates();
    expect(currentTemplates).toEqual(defaultPromptTemplates);
  });

  // 测试2: 更新功能验证
  test("updatePromptTemplates 应该能正确合并新的模板", () => {
    const newHeader = "这是一个新的分析报告头。";
    const updates = {
      defaultBasicAnalysis: {
        header: newHeader,
      },
    };

    updatePromptTemplates(updates);

    const updatedTemplates = getPromptTemplates();

    expect(updatedTemplates.defaultBasicAnalysis.header).toBe(newHeader);
    expect(updatedTemplates.defaultBasicAnalysis.requirements).toBe(
      defaultPromptTemplates.defaultBasicAnalysis.requirements
    );
  });

  // 测试3: 重置功能验证
  test("resetPromptTemplates 应该能将模板恢复到默认状态", () => {
    updatePromptTemplates({
      defaultBasicAnalysis: {
        header: "一个临时修改的头",
      },
    });

    const modifiedTemplates = getPromptTemplates();
    expect(modifiedTemplates).not.toEqual(defaultPromptTemplates);

    resetPromptTemplates();

    const restoredTemplates = getPromptTemplates();
    expect(restoredTemplates).toEqual(defaultPromptTemplates);
  });

  // 测试4: 验证 getPromptTemplates 返回的是一个副本
  test("getPromptTemplates 返回的应该是模板的副本，防止外部修改", () => {
    const templates1 = getPromptTemplates();
    templates1.defaultBasicAnalysis.header = "外部修改";

    const templates2 = getPromptTemplates();
    expect(templates2.defaultBasicAnalysis.header).not.toBe("外部修改");
    expect(templates2).toEqual(defaultPromptTemplates);
  });
});
