/**
 * 帆软API封装模块 - 封装帆软报表API的调用
 */

// 帆软报表组件ID (占位符，实际使用时需替换为实际的组件ID)
const TABLE_COMPONENT_ID = "table1";
const CHART_COMPONENT_ID = "chart1";
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
   * @returns {Boolean} 更新是否成功
   */
  updateAnalysisResult(analysisResult) {
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

      // 构建HTML内容
      const htmlContent = this._buildResultHTML(analysisResult);

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

    const excludeFields = ["timestamp", "rawResponse", "error"];

    Object.keys(analysisResult).forEach((key) => {
      if (!excludeFields.includes(key) && analysisResult[key]) {
        const displayName = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
        html += `<div class="ai-analysis-${key}">
          <h3>${displayName}</h3>
          <div>${analysisResult[key]}</div> 
        </div>`;
      }
    });

    // 添加时间戳
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
