/**
 * 帆软API封装模块 - 封装帆软报表API的调用
 */
import { processResult } from "../core/result-processor.js";

// 帆软报表组件ID (占位符，实际使用时需替换为实际的组件ID)
const TABLE_COMPONENT_ID = "table1";
const CHART_COMPONENT_ID = "chart1";
const CROSSTABLE_COMPONENT_ID = "crosstable1";
const DASHBOARD_COMPONENT_ID = "dashboard1";
const MAP_COMPONENT_ID = "map1";
const RESULT_CONTAINER_ID = "ai-analysis-result";

// 单例实例
let instance = null;

/**
 * 帆软API封装类
 */
class FRAPIWrapper {
  constructor() {
    // 检查帆软API是否可用
    this.isAPIAvailable = this._checkAPIAvailability();
  }

  /**
   * 检查帆软API是否可用
   * @returns {Boolean} API是否可用
   */
  _checkAPIAvailability() {
    return window.FR && window.FR.Report && window.FR.Widget;
  }

  /**
   * 获取表格数据
   * @returns {Array} 表格数据数组
   */
  getTableData() {
    try {
      if (!this.isAPIAvailable) {
        console.warn("帆软API不可用");
        return [];
      }

      // 获取表格组件
      const tableWidget = window.FR.Widget.getWidgetByName(TABLE_COMPONENT_ID);
      if (!tableWidget) {
        console.warn(`未找到ID为${TABLE_COMPONENT_ID}的表格组件`);
        return [];
      }

      // 获取表格数据
      // 注意：这里使用的是占位符API，实际使用时需要根据帆软报表的实际API进行调整
      const tableData = tableWidget.getValue();

      // 处理表格数据为标准格式
      return this._processTableData(tableData);
    } catch (error) {
      console.error("获取表格数据出错:", error);
      return [];
    }
  }

  /**
   * 处理表格数据为标准格式
   * @param {Object} rawData - 原始表格数据
   * @returns {Array} 处理后的表格数据
   */
  _processTableData(rawData) {
    // 这里的处理逻辑需要根据帆软报表的实际数据结构进行调整
    // 返回格式应为 [{column1: value1, column2: value2, ...}, ...]
    if (!rawData || !rawData.data || !Array.isArray(rawData.data)) {
      return [];
    }

    const headers = rawData.header || [];
    return rawData.data.map((row) => {
      const rowObj = {};
      headers.forEach((header, index) => {
        rowObj[header] = row[index];
      });
      return rowObj;
    });
  }

  /**
   * 获取图表数据
   * @returns {Object} 图表数据对象
   */
  getChartData() {
    try {
      if (!this.isAPIAvailable) {
        console.warn("帆软API不可用");
        return {};
      }

      // 获取图表组件
      const chartWidget = window.FR.Widget.getWidgetByName(CHART_COMPONENT_ID);
      if (!chartWidget) {
        console.warn(`未找到ID为${CHART_COMPONENT_ID}的图表组件`);
        return {};
      }

      // 获取图表数据
      // 注意：这里使用的是占位符API，实际使用时需要根据帆软报表的实际API进行调整
      const chartData = chartWidget.getValue();

      // 处理图表数据为标准格式
      return this._processChartData(chartData);
    } catch (error) {
      console.error("获取图表数据出错:", error);
      return {};
    }
  }

  /**
   * 处理图表数据为标准格式
   * @param {Object} rawData - 原始图表数据
   * @returns {Object} 处理后的图表数据
   */
  _processChartData(rawData) {
    // 这里的处理逻辑需要根据帆软报表的实际数据结构进行调整
    if (!rawData) {
      return {};
    }

    // 返回标准格式的图表数据
    return {
      type: rawData.type || "unknown",
      title: rawData.title || "",
      categories: rawData.categories || [],
      series: rawData.series || [],
      data: rawData.data || [],
    };
  }

  /**
   * 获取交叉表数据
   * @returns {Object} 交叉表数据对象
   */
  getCrossTableData() {
    try {
      if (!this.isAPIAvailable) {
        console.warn("帆软API不可用");
        return {};
      }

      // 获取交叉表组件
      const crossTableWidget = window.FR.Widget.getWidgetByName(CROSSTABLE_COMPONENT_ID);
      if (!crossTableWidget) {
        console.warn(`未找到ID为${CROSSTABLE_COMPONENT_ID}的交叉表组件`);
        return {};
      }

      // 获取交叉表数据
      // 注意：这里使用的是占位符API，实际使用时需要根据帆软报表的实际API进行调整
      // 交叉表没有直接获取所有数据的API，需要通过获取单元格值来构建数据
      const crossTableData = this._extractCrossTableData(crossTableWidget);

      // 处理交叉表数据为标准格式
      return this._processCrossTableData(crossTableData);
    } catch (error) {
      console.error("获取交叉表数据出错:", error);
      return {};
    }
  }

  /**
   * 提取交叉表数据
   * @param {Object} crossTableWidget - 交叉表组件
   * @returns {Object} 提取的交叉表原始数据
   */
  _extractCrossTableData(crossTableWidget) {
    // 这里的实现需要根据帆软报表的实际API进行调整
    // 以下是一个示例实现，假设我们可以获取交叉表的行数和列数，然后遍历单元格
    try {
      // 获取报表对象
      const report = window.FR.Report.getCurrentReport();
      if (!report) {
        console.warn("未找到当前报表对象");
        return {};
      }

      // 假设我们可以通过以下方式获取交叉表的行数和列数
      // 实际使用时需要根据帆软报表的实际API进行调整
      const rowCount = crossTableWidget.getRowCount ? crossTableWidget.getRowCount() : 10;
      const colCount = crossTableWidget.getColCount ? crossTableWidget.getColCount() : 10;

      // 获取交叉表的表头信息（假设前两行是表头，第一列是行标题）
      const headers = [];
      for (let col = 1; col < colCount; col++) {
        // 使用getCellValue获取表头单元格的值
        // 注意：实际使用时需要根据帆软报表的实际API进行调整
        // 这里假设使用_g().getCellValue或crossTableWidget.getCellValue方法
        const headerValue = crossTableWidget.getCellValue
          ? crossTableWidget.getCellValue(0, col)
          : window._g
          ? window._g().getCellValue(0, 0, col)
          : `列${col}`;

        headers.push(headerValue || `列${col}`);
      }

      // 获取行标题
      const rowTitles = [];
      for (let row = 2; row < rowCount; row++) {
        const rowTitle = crossTableWidget.getCellValue
          ? crossTableWidget.getCellValue(row, 0)
          : window._g
          ? window._g().getCellValue(0, row, 0)
          : `行${row}`;

        rowTitles.push(rowTitle || `行${row}`);
      }

      // 获取数据单元格的值
      const data = [];
      for (let row = 2; row < rowCount; row++) {
        const rowData = {};
        // 添加行标题
        rowData.rowTitle = rowTitles[row - 2];

        for (let col = 1; col < colCount; col++) {
          const cellValue = crossTableWidget.getCellValue
            ? crossTableWidget.getCellValue(row, col)
            : window._g
            ? window._g().getCellValue(0, row, col)
            : null;

          rowData[headers[col - 1]] = cellValue;
        }

        data.push(rowData);
      }

      return {
        headers,
        rowTitles,
        data,
        rowCount,
        colCount,
      };
    } catch (error) {
      console.error("提取交叉表数据出错:", error);
      return {};
    }
  }

  /**
   * 处理交叉表数据为标准格式
   * @param {Object} rawData - 原始交叉表数据
   * @returns {Object} 处理后的交叉表数据
   */
  _processCrossTableData(rawData) {
    // 这里的处理逻辑需要根据帆软报表的实际数据结构进行调整
    if (!rawData || !rawData.data) {
      return {};
    }

    // 返回标准格式的交叉表数据
    return {
      type: "crosstable",
      headers: rawData.headers || [],
      rowTitles: rawData.rowTitles || [],
      data: rawData.data || [],
      dimensions: {
        rows: rawData.rowCount || 0,
        columns: rawData.colCount || 0,
      },
    };
  }

  /**
   * 获取仪表盘数据
   * @returns {Object} 仪表盘数据对象
   */
  getDashboardData() {
    try {
      if (!this.isAPIAvailable) {
        console.warn("帆软API不可用");
        return {};
      }

      // 获取仪表盘组件
      const dashboardWidget = window.FR.Widget.getWidgetByName(DASHBOARD_COMPONENT_ID);
      if (!dashboardWidget) {
        console.warn(`未找到ID为${DASHBOARD_COMPONENT_ID}的仪表盘组件`);
        return {};
      }

      // 获取仪表盘数据
      // 注意：这里使用的是占位符API，实际使用时需要根据帆软报表的实际API进行调整
      const dashboardData = this._extractDashboardData(dashboardWidget);

      // 处理仪表盘数据为标准格式
      return this._processDashboardData(dashboardData);
    } catch (error) {
      console.error("获取仪表盘数据出错:", error);
      return {};
    }
  }

  /**
   * 提取仪表盘数据
   * @param {Object} dashboardWidget - 仪表盘组件
   * @returns {Object} 提取的仪表盘原始数据
   */
  _extractDashboardData(dashboardWidget) {
    try {
      // 这里的实现需要根据帆软报表的实际API进行调整
      // 以下是一个示例实现，假设我们可以获取仪表盘的指标值和目标值

      // 获取仪表盘的值
      // 注意：实际使用时需要根据帆软报表的实际API进行调整
      const currentValue = dashboardWidget.getValue ? dashboardWidget.getValue() : 0;

      // 获取仪表盘的目标值
      // 注意：实际使用时需要根据帆软报表的实际API进行调整
      const targetValue = dashboardWidget.getTargetValue ? dashboardWidget.getTargetValue() : 100;

      // 获取仪表盘的标题
      const title = dashboardWidget.getTitle ? dashboardWidget.getTitle() : "仪表盘";

      // 获取仪表盘的单位
      const unit = dashboardWidget.getUnit ? dashboardWidget.getUnit() : "";

      // 获取仪表盘的最小值和最大值
      const minValue = dashboardWidget.getMinValue ? dashboardWidget.getMinValue() : 0;
      const maxValue = dashboardWidget.getMaxValue ? dashboardWidget.getMaxValue() : 100;

      return {
        title,
        currentValue,
        targetValue,
        unit,
        minValue,
        maxValue,
      };
    } catch (error) {
      console.error("提取仪表盘数据出错:", error);
      return {};
    }
  }

  /**
   * 处理仪表盘数据为标准格式
   * @param {Object} rawData - 原始仪表盘数据
   * @returns {Object} 处理后的仪表盘数据
   */
  _processDashboardData(rawData) {
    // 这里的处理逻辑需要根据帆软报表的实际数据结构进行调整
    if (!rawData) {
      return {};
    }

    // 计算完成率
    const completionRate = rawData.targetValue
      ? ((rawData.currentValue / rawData.targetValue) * 100).toFixed(2)
      : 0;

    // 返回标准格式的仪表盘数据
    return {
      type: "dashboard",
      title: rawData.title || "仪表盘",
      currentValue: rawData.currentValue || 0,
      targetValue: rawData.targetValue || 100,
      completionRate: parseFloat(completionRate),
      unit: rawData.unit || "",
      range: {
        min: rawData.minValue || 0,
        max: rawData.maxValue || 100,
      },
    };
  }

  /**
   * 获取地图数据
   * @returns {Object} 地图数据对象
   */
  getMapData() {
    try {
      if (!this.isAPIAvailable) {
        console.warn("帆软API不可用");
        return {};
      }

      // 获取地图组件
      const mapWidget = window.FR.Widget.getWidgetByName(MAP_COMPONENT_ID);
      if (!mapWidget) {
        console.warn(`未找到ID为${MAP_COMPONENT_ID}的地图组件`);
        return {};
      }

      // 获取地图数据
      // 注意：这里使用的是占位符API，实际使用时需要根据帆软报表的实际API进行调整
      const mapData = this._extractMapData(mapWidget);

      // 处理地图数据为标准格式
      return this._processMapData(mapData);
    } catch (error) {
      console.error("获取地图数据出错:", error);
      return {};
    }
  }

  /**
   * 提取地图数据
   * @param {Object} mapWidget - 地图组件
   * @returns {Object} 提取的地图原始数据
   */
  _extractMapData(mapWidget) {
    try {
      // 这里的实现需要根据帆软报表的实际API进行调整
      // 以下是一个示例实现，假设我们可以获取地图的区域数据

      // 获取地图的值
      // 注意：实际使用时需要根据帆软报表的实际API进行调整
      const mapValues = mapWidget.getValues ? mapWidget.getValues() : [];

      // 获取地图的标题
      const title = mapWidget.getTitle ? mapWidget.getTitle() : "地图";

      // 获取地图的类型
      const mapType = mapWidget.getMapType ? mapWidget.getMapType() : "china";

      // 假设我们可以获取地图的区域数据
      // 实际使用时需要根据帆软报表的实际API进行调整
      const regions = [];
      if (Array.isArray(mapValues)) {
        for (let i = 0; i < mapValues.length; i++) {
          const value = mapValues[i];
          regions.push({
            name: value.name || `区域${i}`,
            value: value.value || 0,
            properties: value.properties || {},
          });
        }
      }

      return {
        title,
        mapType,
        regions,
      };
    } catch (error) {
      console.error("提取地图数据出错:", error);
      return {};
    }
  }

  /**
   * 处理地图数据为标准格式
   * @param {Object} rawData - 原始地图数据
   * @returns {Object} 处理后的地图数据
   */
  _processMapData(rawData) {
    // 这里的处理逻辑需要根据帆软报表的实际数据结构进行调整
    if (!rawData) {
      return {};
    }

    // 计算最大值和最小值
    let maxValue = 0;
    let minValue = Number.MAX_SAFE_INTEGER;
    let totalValue = 0;

    if (rawData.regions && Array.isArray(rawData.regions)) {
      for (const region of rawData.regions) {
        if (region.value > maxValue) {
          maxValue = region.value;
        }
        if (region.value < minValue) {
          minValue = region.value;
        }
        totalValue += region.value;
      }
    }

    // 如果没有数据，将最小值设为0
    if (minValue === Number.MAX_SAFE_INTEGER) {
      minValue = 0;
    }

    // 返回标准格式的地图数据
    return {
      type: "map",
      title: rawData.title || "地图",
      mapType: rawData.mapType || "china",
      regions: rawData.regions || [],
      statistics: {
        max: maxValue,
        min: minValue,
        total: totalValue,
        average:
          rawData.regions && rawData.regions.length > 0
            ? (totalValue / rawData.regions.length).toFixed(2)
            : 0,
      },
    };
  }

  /**
   * 获取报表元数据
   * @returns {Object} 报表元数据
   */
  getReportMetaData() {
    try {
      if (!this.isAPIAvailable) {
        console.warn("帆软API不可用");
        return {};
      }

      // 获取报表对象
      const report = window.FR.Report.getCurrentReport();
      if (!report) {
        console.warn("未找到当前报表对象");
        return {};
      }

      // 获取报表元数据
      // 注意：这里使用的是占位符API，实际使用时需要根据帆软报表的实际API进行调整
      return {
        reportName: report.getName() || "",
        reportPath: report.getPath() || "",
        parameters: this._getReportParameters(report),
        lastUpdateTime: new Date().toISOString(),
      };
    } catch (error) {
      console.error("获取报表元数据出错:", error);
      return {};
    }
  }

  /**
   * 获取报表参数
   * @param {Object} report - 报表对象
   * @returns {Object} 报表参数
   */
  _getReportParameters(report) {
    try {
      // 获取报表参数
      // 注意：这里使用的是占位符API，实际使用时需要根据帆软报表的实际API进行调整
      const parameters = report.getParameters() || {};

      // 处理参数为标准格式
      const result = {};
      for (const key in parameters) {
        if (parameters.hasOwnProperty(key)) {
          result[key] = parameters[key];
        }
      }

      return result;
    } catch (error) {
      console.error("获取报表参数出错:", error);
      return {};
    }
  }

  /**
   * 更新分析结果到报表
   * @param {Object} analysisResult - 分析结果
   * @param {Object} options - 处理选项
   * @returns {Boolean} 更新是否成功
   */
  updateAnalysisResult(analysisResult, options = {}) {
    try {
      if (!this.isAPIAvailable) {
        console.warn("帆软API不可用");
        return false;
      }

      // 获取结果容器组件
      const resultContainer = window.FR.Widget.getWidgetByName(RESULT_CONTAINER_ID);
      if (!resultContainer) {
        console.warn(`未找到ID为${RESULT_CONTAINER_ID}的结果容器组件`);
        return false;
      }

      // 使用增强的结果处理器处理分析结果
      const processedResult = processResult(analysisResult, {
        outputFormat: "html",
        includeRaw: false,
        validateResult: true,
        ...options,
      });

      // 构建HTML内容
      const htmlContent = this._buildResultHTML(processedResult);

      // 更新结果容器
      // 注意：这里使用的是占位符API，实际使用时需要根据帆软报表的实际API进行调整
      resultContainer.setValue(htmlContent);

      return true;
    } catch (error) {
      console.error("更新分析结果出错:", error);
      return false;
    }
  }

  /**
   * 构建结果HTML
   * @param {Object} analysisResult - 分析结果
   * @returns {String} HTML内容
   */
  _buildResultHTML(analysisResult) {
    if (!analysisResult) {
      return '<div class="ai-analysis-error">无分析结果</div>';
    }

    // 构建HTML内容
    let html = '<div class="ai-analysis-container">';

    // 如果有错误，显示错误信息
    if (analysisResult.error) {
      html += `<div class="ai-analysis-error">
        <h3>分析错误</h3>
        <div>${analysisResult.error.message || "未知错误"}</div>
      </div>`;

      // 添加时间戳并返回
      if (analysisResult.timestamp) {
        const timestamp = new Date(analysisResult.timestamp);
        const formattedTime = timestamp.toLocaleString("zh-CN");
        html += `<div class="ai-analysis-timestamp">
          分析时间: ${formattedTime}
        </div>`;
      }

      html += "</div>";
      return html;
    }

    // 主要分析结果部分
    const mainSections = [
      { key: "summary", title: "摘要" },
      { key: "trends", title: "趋势" },
      { key: "insights", title: "洞察" },
      { key: "recommendations", title: "建议" },
    ];

    mainSections.forEach((section) => {
      if (analysisResult[section.key]) {
        html += `<div class="ai-analysis-${section.key}">
          <h3>${section.title}</h3>
          <div>${analysisResult[section.key]}</div> 
        </div>`;
      }
    });

    // 如果有验证结果，显示验证信息
    if (analysisResult.validation && !analysisResult.validation.isValid) {
      html += `<div class="ai-analysis-validation">
        <h3>分析质量</h3>
        <div class="quality-score">质量评分: ${analysisResult.validation.qualityScore}/10</div>`;

      if (analysisResult.validation.issues && analysisResult.validation.issues.length > 0) {
        html += '<ul class="validation-issues">';
        analysisResult.validation.issues.forEach((issue) => {
          html += `<li>${issue}</li>`;
        });
        html += "</ul>";
      }

      html += "</div>";
    }

    // 如果有缺失字段，显示提示
    if (analysisResult.missingFields && analysisResult.missingFields.length > 0) {
      html += `<div class="ai-analysis-missing">
        <h3>注意</h3>
        <div>分析结果缺少以下部分: ${analysisResult.missingFields.join(", ")}</div>
      </div>`;
    }

    // 添加时间戳和响应时间
    html += '<div class="ai-analysis-footer">';

    if (analysisResult.timestamp) {
      const timestamp = new Date(analysisResult.timestamp);
      const formattedTime = timestamp.toLocaleString("zh-CN");
      html += `<div class="ai-analysis-timestamp">分析时间: ${formattedTime}</div>`;
    }

    // 添加响应时间信息（如果有）
    if (analysisResult.responseTime !== undefined) {
      html += `<div class="ai-response-time">响应时间: ${
        analysisResult.responseTimeFormatted || analysisResult.responseTime + "毫秒"
      }</div>`;
    }

    html += "</div>";

    html += "</div>";

    return html;
  }
}

/**
 * 获取帆软API封装实例
 * @returns {FRAPIWrapper} 帆软API封装实例
 */
function getFRAPIWrapper() {
  if (!instance) {
    instance = new FRAPIWrapper();
  }
  return instance;
}

export { getFRAPIWrapper };
