# 开发指南

本文档旨在为 AI 集成帆软报表框架 (AIDA Watchboard) 的开发者提供指导。

## 目录

- [环境准备](#环境准备)
- [项目结构](#项目结构)
- [构建项目](#构建项目)
- [运行测试](#运行测试)
- [代码规范](#代码规范)
- [调试指南](#调试指南)
- [模块说明](#模块说明)

## 环境准备

1. 确保已安装 Node.js (建议使用最新 LTS 版本)。
2. 克隆项目到本地：`git clone <repository-url>`
3. 进入项目目录：`cd AI_FineReport_Dashboard`
4. 安装依赖：`npm install`

## 项目结构

项目的核心代码位于 `src` 目录下，主要结构如下：

```plaintext
/AI_FineReport_Dashboard/
├── src/                              # 源代码目录
│   ├── core/                         # 核心功能模块
│   │   ├── ai-analyzer.js            # AI分析模块
│   │   ├── chat-manager.js           # 聊天管理模块
│   │   ├── chat-prompt-builder.js    # 聊天提示构建模块
│   │   ├── data-collector.js         # 数据收集模块
│   │   ├── performance-monitor.js    # 性能监控模块
│   │   ├── prompt-builder.js         # Prompt构建模块
│   │   └── result-processor.js       # 结果处理模块
│   │   └── __tests__/                # 核心模块单元测试
│   │       ├── performance-monitor.test.js # 性能监控模块测试
│   │       ├── prompt-builder.test.js      # Prompt构建模块测试
│   │       └── result-processor.test.js    # 结果处理模块测试
│   ├── config/                       # 配置文件
│   │   ├── api-config.example.js     # API配置模版
│   │   └── prompt-templates.js       # Prompt模板
│   ├── ui/                           # UI相关模块
│   │   ├── chat-styles.js            # 聊天窗口样式
│   │   ├── chat-window.js            # 聊天窗口组件
│   │   ├── loading-indicator.js      # 加载指示器
│   │   ├── message-box.js            # 消息框
│   │   ├── performance-dashboard.js  # 性能监控仪表盘
│   │   └── styles.js                 # 通用样式
│   ├── integration/                  # 帆软报表集成模块
│   │   ├── fr-api-wrapper.example.js # 帆软API封装
│   │   └── fr-chat-integration.js    # 聊天功能集成
│   └── main.js                       # 主入口文件
├── examples/                         # 示例代码
├── docs/                             # 文档
└── README.md                         # 项目说明
```

## 构建项目

本项目使用 Rollup 进行打包。可用的 npm 脚本包括：

- `npm run dev`: 开发模式，会监视文件变化并实时构建。方便本地开发和调试。
- `npm run build`: 生产构建，会进行代码压缩和优化，生成最终部署的文件。
- `npm run lint`: 代码规范检查，使用 ESLint。

构建后的文件将输出到 `dist` 目录，主要产物是 `ai-integrated-fr.esm.js`。

## 运行测试

项目使用 Jest 进行单元测试，以确保核心模块的正确性和稳定性。

要运行测试，请在项目根目录下执行：

```bash
npm test
```

测试覆盖了以下核心模块：

- `src/core/performance-monitor.js`: 测试性能数据记录、配置、持久化等功能。
- `src/core/prompt-builder.js`: 测试基于不同报表数据构建 AI 分析提示的逻辑。
- `src/core/result-processor.js`: 测试 AI 响应结果的解析、验证和格式化功能。

建议在提交代码前运行测试，确保所有测试用例通过。

## 代码规范

项目遵循 ESLint 定义的代码规范。请在开发过程中遵守这些规范，并在提交代码前运行 `npm run lint` 进行检查和自动修复（如果配置了）。

## 调试指南

- **浏览器开发者工具**: 在帆软报表环境中集成和调试时，浏览器的开发者工具是主要的调试手段。可以查看控制台输出、网络请求、设置断点等。
- **`console.log`**: 对于模块内部逻辑，可以使用 `console.log` 输出变量状态进行调试。
- **Rollup `dev` 模式**: `npm run dev` 会生成 sourcemaps，有助于在浏览器中直接调试源码。

## 模块说明

### `src/core/` - 核心功能模块

- **`ai-analyzer.js`**: 负责协调整个 AI 分析流程，包括数据收集、Prompt 构建、API 请求和结果处理。
- **`chat-manager.js`**: 管理聊天窗口的状态、消息历史和与 AI 的交互逻辑。
- **`chat-prompt-builder.js`**: 专门为聊天功能构建上下文感知和多轮对话的 Prompt。
- **`data-collector.js`**: 从帆软报表环境中提取表格、图表等数据，为 AI 分析提供原始数据。
- **`performance-monitor.js`**: 记录和统计 AI 分析过程中的各项性能指标，如请求耗时、Token 使用量、成功率等。支持数据持久化和仪表盘展示。
- **`prompt-builder.js`**: 根据收集到的报表数据和预设模板，构建发送给大语言模型的分析 Prompt。
- **`result-processor.js`**: 解析大语言模型返回的 JSON 或文本结果，进行数据校验、格式转换（如 Markdown 转 HTML），并提取关键分析内容。

### `src/config/` - 配置文件

- **`api-config.example.js`**: API 相关的配置模板，实际使用时应复制并重命名为 `api-config.js` 并填入真实配置。
- **`prompt-templates.js`**: 存储用于构建 Prompt 的模板字符串。

### `src/ui/` - UI 相关模块

- **`chat-styles.js` / `styles.js`**: 定义聊天窗口及其他 UI 组件的 CSS 样式。
- **`chat-window.js`**: 实现可交互的聊天窗口组件，包括消息显示、输入框等。
- **`loading-indicator.js`**: 加载状态指示器组件。
- **`message-box.js`**: 通用的消息提示框组件。
- **`performance-dashboard.js`**: 性能监控数据的可视化仪表盘组件。

### `src/integration/` - 帆软报表集成模块

- **`fr-api-wrapper.example.js`**: 封装帆软报表 JS API 的示例，方便在框架中调用帆软功能。
- **`fr-chat-integration.js`**: 负责将聊天窗口和 AI 分析功能集成到帆软报表环境的具体逻辑。

### `src/main.js` - 主入口文件

项目的总入口，负责初始化各个模块，并暴露公共 API 给帆软报表环境调用。
