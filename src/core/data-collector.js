/**
 * 数据收集模块 - 从帆软报表中收集数据
 */
import { getFRAPIWrapper } from "../integration/fr-api-wrapper.js";

/**
 * 获取报表数据
 * @returns {Object} 报表数据对象
 */
function collectReportData() {
  const frAPI = getFRAPIWrapper();

  // 获取表格数据
  const tableData = frAPI.getTableData();

  // 获取图表数据
  const chartData = frAPI.getChartData();

  // 获取其他相关数据
  const metaData = frAPI.getReportMetaData();

  return {
    tableData,
    chartData,
    metaData,
    timestamp: new Date().toISOString(),
  };
}

export { collectReportData };
