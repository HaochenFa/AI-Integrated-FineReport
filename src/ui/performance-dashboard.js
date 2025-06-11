/**
 * @file performance-dashboard.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description 性能监控仪表盘模块 - 用于显示AI分析性能数据
 */
import {
  getPerformanceData,
  resetPerformanceData,
  formatDuration,
} from "../core/performance-monitor.js";

// 默认仪表盘配置
const DEFAULT_DASHBOARD_CONFIG = {
  refreshInterval: 5000, // 自动刷新间隔(毫秒)
  showModelDetails: true, // 是否显示模型详情
  showTokenUsage: true, // 是否显示Token使用情况
  showRecentRequests: true, // 是否显示最近请求
  maxRecentRequests: 10, // 显示的最近请求数量
  accessKey: "admin", // 访问密钥
};

// 仪表盘配置
let dashboardConfig = { ...DEFAULT_DASHBOARD_CONFIG };

// 仪表盘刷新定时器
let refreshTimer = null;

/**
 * 显示性能监控仪表盘
 * @param {string|Element} container - 容器元素或ID
 * @param {string} accessKey - 访问密钥
 * @returns {boolean} 是否成功显示
 */
function showPerformanceDashboard(container, accessKey) {
  // 验证访问密钥
  if (!verifyAccessKey(accessKey)) {
    console.error("访问密钥无效，无法显示性能监控仪表盘");
    return false;
  }

  // 获取容器元素
  let containerElement;

  if (typeof container === "string") {
    // 尝试使用帆软报表API获取容器
    if (window.FR && window.FR.Widget) {
      containerElement = window.FR.Widget.getWidgetByName(container);
    }

    // 如果帆软API不可用或未找到组件，则尝试使用DOM API
    if (!containerElement) {
      containerElement = document.getElementById(container);
    }
  } else if (container instanceof Element) {
    containerElement = container;
  }

  if (!containerElement) {
    console.error(`未找到容器元素: ${container}`);
    return false;
  }

  // 注入CSS样式
  injectDashboardStyles();

  // 构建仪表盘HTML
  const dashboardHTML = buildDashboardHTML();

  // 更新容器内容
  if (typeof containerElement.setValue === "function") {
    // 帆软组件
    containerElement.setValue(dashboardHTML);
  } else if (containerElement.innerHTML !== undefined) {
    // DOM元素
    containerElement.innerHTML = dashboardHTML;
  } else {
    console.error("无法更新容器内容");
    return false;
  }

  // 设置事件监听器
  setTimeout(() => {
    setupEventListeners(containerElement);
  }, 100);

  // 设置自动刷新
  if (dashboardConfig.refreshInterval > 0) {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }

    refreshTimer = setInterval(() => {
      updateDashboard(containerElement);
    }, dashboardConfig.refreshInterval);
  }

  return true;
}

/**
 * 验证访问密钥
 * @param {string} key - 访问密钥
 * @returns {boolean} 是否有效
 */
function verifyAccessKey(key) {
  return key === dashboardConfig.accessKey;
}

/**
 * 配置性能监控仪表盘
 * @param {Object} config - 配置选项
 */
function configureDashboard(config = {}) {
  dashboardConfig = { ...DEFAULT_DASHBOARD_CONFIG, ...config };
}

/**
 * 构建仪表盘HTML
 * @returns {string} 仪表盘HTML
 */
function buildDashboardHTML() {
  const performanceData = getPerformanceData();

  let html = `
    <div class="aida-performance-dashboard">
      <div class="dashboard-header">
        <h2>AI分析性能监控仪表盘</h2>
        <div class="dashboard-controls">
          <button id="refresh-dashboard" class="dashboard-btn">刷新</button>
          <button id="reset-performance-data" class="dashboard-btn danger">重置数据</button>
        </div>
      </div>
      
      <div class="dashboard-section">
        <h3>总体统计</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${performanceData.overall.totalRequests}</div>
            <div class="stat-label">总请求数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${performanceData.overall.successfulRequests}</div>
            <div class="stat-label">成功请求</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${performanceData.overall.failedRequests}</div>
            <div class="stat-label">失败请求</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${formatDuration(
              performanceData.overall.averageResponseTime
            )}</div>
            <div class="stat-label">平均响应时间</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${performanceData.overall.totalRetries}</div>
            <div class="stat-label">总重试次数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${performanceData.overall.totalModelFallbacks}</div>
            <div class="stat-label">总模型回退次数</div>
          </div>
        </div>
      </div>
      
      <div class="dashboard-section">
        <h3>缓存统计</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${performanceData.cacheStats.hits}</div>
            <div class="stat-label">缓存命中</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${performanceData.cacheStats.misses}</div>
            <div class="stat-label">缓存未命中</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${(performanceData.cacheStats.hitRate * 100).toFixed(2)}%</div>
            <div class="stat-label">缓存命中率</div>
          </div>
        </div>
      </div>
  `;

  // 添加模型性能部分
  if (dashboardConfig.showModelDetails) {
    html += `
      <div class="dashboard-section">
        <h3>模型性能</h3>
        <table class="performance-table">
          <thead>
            <tr>
              <th>模型</th>
              <th>请求数</th>
              <th>成功率</th>
              <th>平均响应时间</th>
              <th>总Token数</th>
            </tr>
          </thead>
          <tbody>
    `;

    const modelIds = Object.keys(performanceData.modelPerformance);
    if (modelIds.length > 0) {
      modelIds.forEach((modelId) => {
        const model = performanceData.modelPerformance[modelId];
        const successRate =
          model.totalRequests > 0
            ? ((model.successfulRequests / model.totalRequests) * 100).toFixed(2)
            : "0.00";

        html += `
          <tr>
            <td>${modelId}</td>
            <td>${model.totalRequests}</td>
            <td>${successRate}%</td>
            <td>${formatDuration(model.averageResponseTime)}</td>
            <td>${model.totalTokens}</td>
          </tr>
        `;
      });
    } else {
      html += `
        <tr>
          <td colspan="5" class="no-data">暂无模型性能数据</td>
        </tr>
      `;
    }

    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  // 添加Token使用情况
  if (dashboardConfig.showTokenUsage) {
    html += `
      <div class="dashboard-section">
        <h3>Token使用情况</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${performanceData.tokenUsage.totalPromptTokens}</div>
            <div class="stat-label">提示词Token</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${performanceData.tokenUsage.totalCompletionTokens}</div>
            <div class="stat-label">完成Token</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${performanceData.tokenUsage.totalTokens}</div>
            <div class="stat-label">总Token数</div>
          </div>
        </div>
      </div>
    `;
  }

  // 添加最近请求记录
  if (dashboardConfig.showRecentRequests) {
    html += `
      <div class="dashboard-section">
        <h3>最近请求</h3>
        <table class="performance-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>模型</th>
              <th>时间</th>
              <th>耗时</th>
              <th>状态</th>
              <th>缓存</th>
              <th>重试</th>
              <th>回退</th>
              <th>流式</th>
            </tr>
          </thead>
          <tbody>
    `;

    const recentRequests = performanceData.recentRequests.slice(
      0,
      dashboardConfig.maxRecentRequests
    );
    if (recentRequests.length > 0) {
      recentRequests.forEach((request) => {
        const timestamp = new Date(request.timestamp).toLocaleString("zh-CN");
        const shortId = request.id.substring(0, 8) + "...";

        html += `
          <tr>
            <td title="${request.id}">${shortId}</td>
            <td>${request.modelId || "-"}</td>
            <td>${timestamp}</td>
            <td>${formatDuration(request.duration)}</td>
            <td class="status-${request.status}">${request.status}</td>
            <td>${request.cacheHit ? "✓" : "✗"}</td>
            <td>${request.retryCount}</td>
            <td>${request.modelFallbacks}</td>
            <td>${request.streamResponse ? "✓" : "✗"}</td>
          </tr>
        `;
      });
    } else {
      html += `
        <tr>
          <td colspan="9" class="no-data">暂无请求记录</td>
        </tr>
      `;
    }

    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  html += `
    </div>
  `;

  return html;
}

/**
 * 设置事件监听器
 * @param {Element} containerElement - 容器元素
 */
function setupEventListeners(containerElement) {
  // 获取元素
  let refreshButton;
  let resetButton;

  if (typeof containerElement.setValue === "function") {
    // 帆软组件，需要通过DOM查找按钮
    const dashboardElement = document.querySelector(".aida-performance-dashboard");
    if (dashboardElement) {
      refreshButton = dashboardElement.querySelector("#refresh-dashboard");
      resetButton = dashboardElement.querySelector("#reset-performance-data");
    }
  } else {
    // DOM元素
    refreshButton = containerElement.querySelector("#refresh-dashboard");
    resetButton = containerElement.querySelector("#reset-performance-data");
  }

  // 设置刷新按钮事件
  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      updateDashboard(containerElement);
    });
  }

  // 设置重置按钮事件
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      if (confirm("确定要重置所有性能数据吗？此操作不可撤销。")) {
        resetPerformanceData();
        updateDashboard(containerElement);
      }
    });
  }
}

/**
 * 更新仪表盘
 * @param {Element} containerElement - 容器元素
 */
function updateDashboard(containerElement) {
  const dashboardHTML = buildDashboardHTML();

  if (typeof containerElement.setValue === "function") {
    // 帆软组件
    containerElement.setValue(dashboardHTML);
  } else if (containerElement.innerHTML !== undefined) {
    // DOM元素
    containerElement.innerHTML = dashboardHTML;
  }

  // 重新设置事件监听器
  setupEventListeners(containerElement);
}

/**
 * 注入仪表盘样式
 */
function injectDashboardStyles() {
  // 检查是否已注入样式
  if (document.getElementById("aida-performance-dashboard-styles")) {
    return;
  }

  const styleElement = document.createElement("style");
  styleElement.id = "aida-performance-dashboard-styles";
  styleElement.textContent = `
    .aida-performance-dashboard {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      color: #333;
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }
    
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    
    .dashboard-header h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #2c3e50;
    }
    
    .dashboard-controls {
      display: flex;
      gap: 10px;
    }
    
    .dashboard-btn {
      padding: 8px 12px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.2s;
    }
    
    .dashboard-btn:hover {
      background-color: #45a049;
    }
    
    .dashboard-btn.danger {
      background-color: #f44336;
    }
    
    .dashboard-btn.danger:hover {
      background-color: #d32f2f;
    }
    
    .dashboard-section {
      margin-bottom: 25px;
      background-color: white;
      padding: 15px;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .dashboard-section h3 {
      margin-top: 0;
      margin-bottom: 15px;
      font-size: 1.2rem;
      color: #2c3e50;
      border-bottom: 1px solid #eee;
      padding-bottom: 8px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 15px;
    }
    
    .stat-card {
      background-color: #f5f7fa;
      padding: 15px;
      border-radius: 6px;
      text-align: center;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    
    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #3498db;
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 0.9rem;
      color: #7f8c8d;
    }
    
    .performance-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 0.9rem;
    }
    
    .performance-table th,
    .performance-table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    
    .performance-table th {
      background-color: #f5f7fa;
      font-weight: 600;
      color: #2c3e50;
    }
    
    .performance-table tr:hover {
      background-color: #f9f9f9;
    }
    
    .performance-table .no-data {
      text-align: center;
      color: #7f8c8d;
      padding: 20px;
    }
    
    .status-success {
      color: #27ae60;
    }
    
    .status-error {
      color: #e74c3c;
    }
    
    .status-pending {
      color: #f39c12;
    }
  `;

  document.head.appendChild(styleElement);
}

export { showPerformanceDashboard, configureDashboard };
