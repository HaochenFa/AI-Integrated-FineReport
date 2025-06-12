/**
 * @file prompt-builder.test.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description prompt-builder.js 模块的单元测试
 */

import { buildBasicAnalysisPrompt } from "../prompt-builder.js";

const mockTemplates = {
  defaultBasicAnalysis: {
    header: "分析报表：\n",
    tableSection: "表格数据部分：",
    chartSection: "图表数据部分：",
    crossTableSection: "交叉表数据部分：",
    dashboardSection: "仪表盘数据部分：",
    mapSection: "地图数据部分：",
    requirements: "\n请分析。",
  },
};

describe("prompt-builder.js (依赖注入)", () => {
  describe("buildBasicAnalysisPrompt", () => {
    // 使用 test.each 来优雅地测试所有独立分支
    test.each([
      // 修复：将 tableData 的值从对象 {} 改为数组 [{}]
      ["tableData", [{ product: "A", sales: 100 }], "表格数据部分："],
      ["chartData", { type: "bar", values: [1, 2, 3] }, "图表数据部分："],
      ["crossTableData", { rows: ["a"], cols: ["b"], data: [[1]] }, "交叉表数据部分："],
      ["dashboardData", { value: 95, target: 100 }, "仪表盘数据部分："],
      ["mapData", { region: "North", value: 500 }, "地图数据部分："],
    ])("当只提供 %s 时，应该只包含对应的部分", (key, data, expectedText) => {
      const reportData = { [key]: data };
      const prompt = buildBasicAnalysisPrompt(reportData, mockTemplates);

      expect(prompt).toContain(expectedText);
      expect(prompt).toContain(JSON.stringify(data, null, 2));
      expect(prompt).toContain(mockTemplates.defaultBasicAnalysis.header);
      expect(prompt).toContain(mockTemplates.defaultBasicAnalysis.requirements);
    });

    it("当提供的数据字段为空数组或空对象时，不应包含该部分", () => {
      const emptyData = {
        tableData: [],
        chartData: {},
      };
      const prompt = buildBasicAnalysisPrompt(emptyData, mockTemplates);

      const expectedPrompt =
        mockTemplates.defaultBasicAnalysis.header +
        "\n\n" +
        mockTemplates.defaultBasicAnalysis.requirements;
      expect(prompt).toBe(expectedPrompt);
    });

    it("当不提供任何数据时，应该只返回头部和要求部分", () => {
      const prompt = buildBasicAnalysisPrompt({}, mockTemplates);

      const expectedPrompt =
        mockTemplates.defaultBasicAnalysis.header +
        "\n\n" +
        mockTemplates.defaultBasicAnalysis.requirements;
      expect(prompt).toBe(expectedPrompt);
    });
  });
});
