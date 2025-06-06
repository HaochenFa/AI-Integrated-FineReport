/**
 * 帆软报表集成示例
 *
 * 本示例展示如何在帆软报表中集成和使用AI分析框架
 */

// 在帆软报表的HTML页面中引入框架
// <script type="module" src="/path/to/AIDA_Watchboard/src/main.js"></script>

// 在帆软报表的自定义JS代码中添加以下代码

// 等待页面加载完成
document.addEventListener("DOMContentLoaded", function () {
  // 初始化框架
  if (window.AIDA_Watchboard) {
    // 配置API参数
    window.AIDA_Watchboard.init({
      api: {
        url: "http://internal-vllm-service.company.com/v1/chat/completions",
        apiKey: "YOUR_API_KEY",
        model: "deepseek-coder",
        systemPrompt:
          "你是一个专业的数据分析助手，擅长分析报表数据并提供洞察。请基于提供的数据进行分析，并给出关键发现和建议。",
        temperature: 0.3,
        maxTokens: 2000,
      },
    });

    console.log("AI分析框架初始化完成");
  } else {
    console.error("AI分析框架未加载");
  }
});

// 为分析按钮添加点击事件
function setupAnalysisButton() {
  // 获取分析按钮元素
  const analysisButton = document.getElementById("ai-analysis-button");
  if (!analysisButton) {
    console.warn("未找到分析按钮元素");
    return;
  }

  // 添加点击事件
  analysisButton.addEventListener("click", async function () {
    if (!window.AIDA_Watchboard) {
      alert("AI分析框架未加载");
      return;
    }

    // 执行基础分析
    const success = await window.AIDA_Watchboard.runBasicAnalysis();
    if (success) {
      console.log("AI分析完成");
    } else {
      console.error("AI分析失败");
    }
  });

  console.log("分析按钮设置完成");
}

// 为自定义分析按钮添加点击事件
function setupCustomAnalysisButton() {
  // 获取自定义分析按钮元素
  const customAnalysisButton = document.getElementById("ai-custom-analysis-button");
  if (!customAnalysisButton) {
    console.warn("未找到自定义分析按钮元素");
    return;
  }

  // 添加点击事件
  customAnalysisButton.addEventListener("click", async function () {
    if (!window.AIDA_Watchboard) {
      alert("AI分析框架未加载");
      return;
    }

    // 获取自定义选项
    const focusAreas = [];
    const focusCheckboxes = document.querySelectorAll(".focus-area-checkbox:checked");
    focusCheckboxes.forEach((checkbox) => {
      focusAreas.push(checkbox.value);
    });

    const additionalContext = document.getElementById("additional-context-input")?.value || "";

    // 执行自定义分析
    const success = await window.AIDA_Watchboard.runCustomAnalysis({
      focusAreas,
      additionalContext,
    });

    if (success) {
      console.log("自定义AI分析完成");
    } else {
      console.error("自定义AI分析失败");
    }
  });

  console.log("自定义分析按钮设置完成");
}

// 在帆软报表加载完成后设置按钮
function onReportLoaded() {
  setupAnalysisButton();
  setupCustomAnalysisButton();
  console.log("报表加载完成，按钮设置完成");
}

// 监听帆软报表加载完成事件
if (window.FR && window.FR.Report) {
  window.FR.Report.addListener("afterload", onReportLoaded);
} else {
  // 如果帆软API不可用，则使用DOM加载事件
  window.addEventListener("load", function () {
    setTimeout(onReportLoaded, 1000); // 延迟1秒，确保报表加载完成
  });
}
