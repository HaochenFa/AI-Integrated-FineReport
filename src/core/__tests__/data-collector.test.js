/**
 * @file data-collector.test.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description data-collector.js 模块的单元测试
 */

import { collectReportData } from "../data-collector.js";
import { getFRAPIWrapper } from "../../integration/fr-api-wrapper.js";

// 模拟 fr-api-wrapper 模块
// 这是本测试的核心，我们定义了所有FR API的模拟版本
const mockFRWrapper = {
  getTableData: jest.fn(),
  getChartData: jest.fn(),
  getCrossTableData: jest.fn(),
  getDashboardData: jest.fn(),
  getMapData: jest.fn(),
  getReportMetaData: jest.fn(),
};

// 确保 getFRAPIWrapper 返回我们完全控制的模拟对象
jest.mock("../../integration/fr-api-wrapper.js", () => ({
  getFRAPIWrapper: jest.fn(() => mockFRWrapper),
}));

describe("data-collector.js", () => {
  // 定义可复用的模拟返回数据
  const mockData = {
    table: [{ product: "A", sales: 100 }],
    chart: { type: "bar", data: [100, 200] },
    crossTable: { rows: ["Region"], data: [[]] },
    dashboard: { value: 95, target: 100 },
    map: { region: "North", value: 500 },
    meta: { reportName: "Sales_Report" },
  };

  // 在每个测试用例开始前，清空所有模拟函数的调用记录
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("应调用所有API并正确组装返回的数据", () => {
    // 安排 (Arrange): 设置每个模拟函数的返回值
    mockFRWrapper.getTableData.mockReturnValue(mockData.table);
    mockFRWrapper.getChartData.mockReturnValue(mockData.chart);
    mockFRWrapper.getCrossTableData.mockReturnValue(mockData.crossTable);
    mockFRWrapper.getDashboardData.mockReturnValue(mockData.dashboard);
    mockFRWrapper.getMapData.mockReturnValue(mockData.map);
    mockFRWrapper.getReportMetaData.mockReturnValue(mockData.meta);

    // 执行 (Act): 调用待测函数
    const result = collectReportData();

    // 断言 (Assert): 验证行为和结果
    // 1. 验证所有API是否都被调用
    expect(mockFRWrapper.getTableData).toHaveBeenCalledTimes(1);
    expect(mockFRWrapper.getChartData).toHaveBeenCalledTimes(1);
    expect(mockFRWrapper.getCrossTableData).toHaveBeenCalledTimes(1);
    expect(mockFRWrapper.getDashboardData).toHaveBeenCalledTimes(1);
    expect(mockFRWrapper.getMapData).toHaveBeenCalledTimes(1);
    expect(mockFRWrapper.getReportMetaData).toHaveBeenCalledTimes(1);

    // 2. 验证返回对象的结构和内容
    expect(result.tableData).toEqual(mockData.table);
    expect(result.chartData).toEqual(mockData.chart);
    expect(result.crossTableData).toEqual(mockData.crossTable);
    expect(result.dashboardData).toEqual(mockData.dashboard);
    expect(result.mapData).toEqual(mockData.map);
    expect(result.metaData).toEqual(mockData.meta);

    // 3. 验证时间戳存在
    expect(result).toHaveProperty("timestamp");
    expect(typeof result.timestamp).toBe("string");
  });

  it("当部分数据源返回空时，应能正常处理", () => {
    // 安排: 只有表格和元数据返回有效值，其他返回空
    mockFRWrapper.getTableData.mockReturnValue(mockData.table);
    mockFRWrapper.getChartData.mockReturnValue({}); // 空对象
    mockFRWrapper.getCrossTableData.mockReturnValue([]); // 空数组
    mockFRWrapper.getDashboardData.mockReturnValue(null); // null
    mockFRWrapper.getMapData.mockReturnValue(undefined); // undefined
    mockFRWrapper.getReportMetaData.mockReturnValue(mockData.meta);

    const result = collectReportData();

    // 断言: 验证返回的数据是否与我们模拟的一致
    expect(result.tableData).toEqual(mockData.table);
    expect(result.chartData).toEqual({});
    expect(result.crossTableData).toEqual([]);
    expect(result.dashboardData).toBeNull();
    expect(result.mapData).toBeUndefined();
    expect(result.metaData).toEqual(mockData.meta);
  });

  it("当所有数据源都为空时，应返回一个包含空数据和时间戳的对象", () => {
    // 安排: 所有API都返回假值
    mockFRWrapper.getTableData.mockReturnValue([]);
    mockFRWrapper.getChartData.mockReturnValue({});
    mockFRWrapper.getCrossTableData.mockReturnValue([]);
    mockFRWrapper.getDashboardData.mockReturnValue({});
    mockFRWrapper.getMapData.mockReturnValue({});
    mockFRWrapper.getReportMetaData.mockReturnValue({});

    const result = collectReportData();

    // 断言
    expect(result.tableData).toEqual([]);
    expect(result.chartData).toEqual({});
    expect(result.metaData).toEqual({});
    expect(result).toHaveProperty("timestamp");
  });
});
