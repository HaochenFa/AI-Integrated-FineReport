/**
 * @file fr-api-wrapper.test.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description fr-api-wrapper.js 模块的单元测试
 */

// todo)) 未通过的测试

import { jest } from "@jest/globals";

// Mock dependencies
jest.mock("../core/result-processor.js");

describe("fr-api-wrapper.js", () => {
  let frApiWrapperModule;
  let mockProcessResult;

  // Mock the global FineReport API objects
  const mockFRWidget = {
    getWidgetByName: jest.fn(),
  };
  const mockFRReport = {
    getCurrentReport: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetModules();

    // Set up global mocks for window.FR
    global.window = {
      FR: {
        Widget: mockFRWidget,
        Report: mockFRReport,
      },
    };

    // Dynamically import the module after mocks are set up
    frApiWrapperModule = await import("../fr-api-wrapper.example.js"); // Assuming this will be fr-api-wrapper.js
    mockProcessResult = await import("../core/result-processor.js");

    // Clear all mocks before each test
    jest.clearAllMocks();

    // Default mock implementations
    mockFRWidget.getWidgetByName.mockReturnValue(null); // Default to widget not found
    mockFRReport.getCurrentReport.mockReturnValue(null); // Default to report not found
    mockProcessResult.processResult.mockImplementation((result) => result); // Default to pass-through
  });

  // Test 1: _checkAPIAvailability when FR API is available
  test("should return true for isAPIAvailable when window.FR is fully available", () => {
    const frAPI = new frApiWrapperModule.FRAPIWrapper();
    expect(frAPI.isAPIAvailable).toBe(true);
  });

  // Test 2: _checkAPIAvailability when FR API is not available
  test("should return false for isAPIAvailable when window.FR is not available", () => {
    global.window.FR = undefined;
    const frAPI = new frApiWrapperModule.FRAPIWrapper();
    expect(frAPI.isAPIAvailable).toBe(false);
  });

  // Test 3: getTableData when API is available and widget found
  test("getTableData should return processed table data when API is available and widget found", () => {
    const mockTableWidget = {
      getValue: jest.fn(() => ({
        header: ["col1", "col2"],
        data: [
          [1, "a"],
          [2, "b"],
        ],
      })),
    };
    mockFRWidget.getWidgetByName.mockReturnValue(mockTableWidget);

    const frAPI = new frApiWrapperModule.FRAPIWrapper();
    const data = frAPI.getTableData();

    expect(mockFRWidget.getWidgetByName).toHaveBeenCalledWith("table1");
    expect(mockTableWidget.getValue).toHaveBeenCalledTimes(1);
    expect(data).toEqual([
      { col1: 1, col2: "a" },
      { col1: 2, col2: "b" },
    ]);
  });

  // Test 4: getTableData when API is not available
  test("getTableData should return empty array when API is not available", () => {
    global.window.FR = undefined;
    const frAPI = new frApiWrapperModule.FRAPIWrapper();
    const data = frAPI.getTableData();
    expect(data).toEqual([]);
  });

  // Test 5: getChartData when API is available and widget found
  test("getChartData should return processed chart data when API is available and widget found", () => {
    const mockChartWidget = {
      getValue: jest.fn(() => ({
        type: "bar",
        title: "Sales",
        categories: ["Q1", "Q2"],
        series: ["series1"],
        data: [[100, 200]],
      })),
    };
    mockFRWidget.getWidgetByName.mockReturnValue(mockChartWidget);

    const frAPI = new frApiWrapperModule.FRAPIWrapper();
    const data = frAPI.getChartData();

    expect(mockFRWidget.getWidgetByName).toHaveBeenCalledWith("chart1");
    expect(mockChartWidget.getValue).toHaveBeenCalledTimes(1);
    expect(data).toEqual({
      type: "bar",
      title: "Sales",
      categories: ["Q1", "Q2"],
      series: ["series1"],
      data: [[100, 200]],
    });
  });

  // Test 6: getCrossTableData when API is available and widget found
  test("getCrossTableData should return processed crosstable data", () => {
    const mockCrossTableWidget = {
      getCellValue: jest.fn((row, col) => {
        if (row === 0 && col === 1) return "Header1";
        if (row === 0 && col === 2) return "Header2";
        if (row === 2 && col === 0) return "RowTitle1";
        if (row === 3 && col === 0) return "RowTitle2";
        if (row === 2 && col === 1) return 10;
        if (row === 2 && col === 2) return 20;
        if (row === 3 && col === 1) return 30;
        if (row === 3 && col === 2) return 40;
        return null;
      }),
      getRowCount: jest.fn(() => 4),
      getColCount: jest.fn(() => 3),
    };
    mockFRWidget.getWidgetByName.mockReturnValue(mockCrossTableWidget);
    mockFRReport.getCurrentReport.mockReturnValue({}); // Mock report object for _extractCrossTableData

    const frAPI = new frApiWrapperModule.FRAPIWrapper();
    const data = frAPI.getCrossTableData();

    expect(mockFRWidget.getWidgetByName).toHaveBeenCalledWith("crosstable1");
    expect(data).toEqual({
      type: "crosstable",
      headers: ["Header1", "Header2"],
      rowTitles: ["RowTitle1", "RowTitle2"],
      data: [
        { rowTitle: "RowTitle1", Header1: 10, Header2: 20 },
        { rowTitle: "RowTitle2", Header1: 30, Header2: 40 },
      ],
      dimensions: { rows: 4, columns: 3 },
    });
  });

  // Test 7: updateAnalysisResult should call processResult and update widget
  test("updateAnalysisResult should process result and update widget", () => {
    const mockResultContainer = {
      setValue: jest.fn(),
    };
    mockFRWidget.getWidgetByName.mockReturnValue(mockResultContainer);

    const analysisResult = { summary: "Test Summary" };
    mockProcessResult.processResult.mockReturnValue({ summary: "Processed Summary" });

    const frAPI = new frApiWrapperModule.FRAPIWrapper();
    const success = frAPI.updateAnalysisResult(analysisResult);

    expect(mockFRWidget.getWidgetByName).toHaveBeenCalledWith("ai-analysis-result");
    expect(mockProcessResult.processResult).toHaveBeenCalledWith(
      analysisResult,
      expect.any(Object)
    );
    expect(mockResultContainer.setValue).toHaveBeenCalledWith(
      expect.stringContaining("Processed Summary")
    );
    expect(success).toBe(true);
  });

  // Test 8: updateAnalysisResult should return false if result container not found
  test("updateAnalysisResult should return false if result container not found", () => {
    mockFRWidget.getWidgetByName.mockReturnValue(null);

    const frAPI = new frApiWrapperModule.FRAPIWrapper();
    const success = frAPI.updateAnalysisResult({});

    expect(success).toBe(false);
    expect(mockProcessResult.processResult).not.toHaveBeenCalled();
  });

  // Test 9: _buildResultHTML should generate correct HTML for success result
  test("_buildResultHTML should generate correct HTML for success result", () => {
    const analysisResult = {
      summary: "This is a summary.",
      trends: "Key trends observed.",
      insights: "Valuable insights.",
      recommendations: "Actionable recommendations.",
    };
    const frAPI = new frApiWrapperModule.FRAPIWrapper();
    const html = frAPI._buildResultHTML(analysisResult);

    expect(html).toContain("<h3>摘要</h3><div>This is a summary.</div>");
    expect(html).toContain("<h3>趋势</h3><div>Key trends observed.</div>");
    expect(html).toContain("<h3>洞察</h3><div>Valuable insights.</div>");
    expect(html).toContain("<h3>建议</h3><div>Actionable recommendations.</div>");
    expect(html).not.toContain("ai-analysis-error");
  });

  // Test 10: _buildResultHTML should generate correct HTML for error result
  test("_buildResultHTML should generate correct HTML for error result", () => {
    const analysisResult = {
      error: { message: "Something went wrong." },
      timestamp: Date.now(),
    };
    const frAPI = new frApiWrapperModule.FRAPIWrapper();
    const html = frAPI._buildResultHTML(analysisResult);

    expect(html).toContain("<h3>分析错误</h3>");
    expect(html).toContain("<div>Something went wrong.</div>");
    expect(html).toContain("ai-analysis-timestamp");
    expect(html).toContain("ai-analysis-error");
  });
});
