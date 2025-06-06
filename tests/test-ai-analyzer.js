/**
 * AI分析模块测试
 */
import { analyzeWithAI } from '../src/core/ai-analyzer.js';
import { mockReportData } from './mock-data/sample-report-data.js';
import { buildBasicAnalysisPrompt } from '../src/core/prompt-builder.js';
import { getAPIConfig, updateAPIConfig } from '../src/config/api-config.example.js';

// 配置测试环境
function setupTestEnvironment() {
  // 更新API配置为测试配置
  updateAPIConfig({
    url: 'http://internal-vllm-service.company.com/v1/chat/completions',
    apiKey: 'TEST_API_KEY',
    model: 'deepseek-coder',
    systemPrompt: '你是一个测试用的数据分析助手。',
    temperature: 0.3,
    maxTokens: 500
  });
  
  // 模拟UI组件
  global.showLoadingIndicator = () => console.log('显示加载指示器');
  global.hideLoadingIndicator = () => console.log('隐藏加载指示器');
  global.showErrorMessage = (msg) => console.error('错误消息:', msg);
  
  console.log('测试环境设置完成');
}

// 模拟fetch API
function mockFetch() {
  global.fetch = async (url, options) => {
    console.log('模拟API调用:', url);
    console.log('请求参数:', options.body);
    
    // 模拟API响应
    return {
      ok: true,
      json: async () => ({
        id: 'test-response-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'deepseek-coder',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                summary: '这是一个测试的AI分析摘要。根据数据显示，智能手机B的销售额高于智能手机A，且两款产品都呈现增长趋势。',
                trends: '1. 智能手机B的销售额持续高于智能手机A。\n2. 所有产品在华东地区的销售表现最好。\n3. 两款产品的销售额都呈现逐月增长趋势。',
                insights: '1. 智能手机B虽然销售量低于智能手机A，但单价更高，总销售额更大。\n2. 华东地区是最重要的市场，贡献了最高的销售额。\n3. 西部地区的销售表现相对较弱，可能需要加强营销策略。',
                recommendations: '1. 考虑在西部地区增加营销投入，提升销售表现。\n2. 智能手机A可以考虑提高单价，增加利润空间。\n3. 继续保持华东地区的市场优势，同时关注华南地区的增长潜力。'
              })
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 500,
          completion_tokens: 300,
          total_tokens: 800
        }
      })
    };
  };
  
  console.log('模拟Fetch API设置完成');
}

// 测试AI分析功能
async function testAIAnalyzer() {
  console.log('开始测试AI分析功能...');
  
  // 设置测试环境
  setupTestEnvironment();
  mockFetch();
  
  // 构建测试prompt
  const prompt = buildBasicAnalysisPrompt(mockReportData);
  console.log('测试Prompt构建完成，长度:', prompt.length);
  
  // 执行AI分析
  console.log('执行AI分析...');
  const result = await analyzeWithAI(prompt);
  
  // 验证结果
  if (result && result.choices && result.choices.length > 0) {
    console.log('AI分析测试成功!');
    console.log('分析结果:', result.choices[0].message.content);
  } else {
    console.error('AI分析测试失败!');
    console.error('返回结果:', result);
  }
}

// 执行测试
testAIAnalyzer().catch(error => {
  console.error('测试过程中发生错误:', error);
});