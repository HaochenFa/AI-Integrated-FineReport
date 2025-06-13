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
│   │   ├── result-processor.js       # 结果处理模块
│   │   └── __tests__/                # 核心模块单元测试
│   │       ├── chat-manager.test.js        # 聊天管理模块测试
│   │       ├── chat-prompt-builder.test.js # 聊天提示构建模块测试
│   │       ├── data-collector.test.js      # 数据收集模块测试
│   │       ├── performance-monitor.test.js # 性能监控模块测试
│   │       ├── prompt-builder.test.js      # Prompt构建模块测试
│   │       └── result-processor.test.js    # 结果处理模块测试
│   ├── config/                       # 配置文件
│   │   ├── __tests__/                # 配置模块单元测试
│   │   │   └── prompt-templates.test.js    # Prompt模板测试
│   │   ├── api-config.example.js     # API配置模版
│   │   ├── api-config.js             # API配置文件
│   │   └── prompt-templates.js       # Prompt模板
│   ├── ui/                           # UI相关模块
│   │   ├── chat-styles.js            # 聊天窗口样式
│   │   ├── chat-window.js            # 聊天窗口组件
│   │   ├── loading-indicator.js      # 加载指示器
│   │   ├── message-box.js            # 消息框
│   │   ├── performance-dashboard.js  # 性能监控仪表盘
│   │   └── styles.js                 # 通用样式
│   ├── integration/                  # 帆软报表集成模块
│   │   ├── fr-api-wrapper.example.js # 帆软API封装示例
│   │   ├── fr-api-wrapper.js         # 帆软API封装
│   │   └── fr-chat-integration.js    # 聊天功能集成
│   ├── __mocks__/                    # 测试模拟文件
│   │   ├── config/                   # 配置模块模拟
│   │   ├── core/                     # 核心模块模拟
│   │   └── ui/                       # UI模块模拟
│   └── main.js                       # 主入口文件
├── examples/                         # 示例代码
│   ├── integration.example.html      # 集成示例HTML
│   └── integration.example.js        # 集成示例代码
├── docs/                             # 文档
│   └── development.md                # 开发指南
├── dist/                             # 构建输出目录
├── coverage/                         # 测试覆盖率报告
├── jest.config.js                    # Jest测试配置
├── jest.setup.js                     # Jest测试环境设置
├── rollup.config.js                  # Rollup构建配置
├── babel.config.cjs                  # Babel转译配置
└── README.md                         # 项目说明
```

## 项目当前状态

### 开发进度

项目目前处于 **0.0.1-alpha** 版本，核心功能已基本完成：

✅ **已完成的功能**:

- 核心 AI 分析模块 (`ai-analyzer.js`)
- 数据收集和处理 (`data-collector.js`, `result-processor.js`)
- 提示构建系统 (`prompt-builder.js`, `chat-prompt-builder.js`)
- 聊天管理功能 (`chat-manager.js`)
- 性能监控系统 (`performance-monitor.js`)
- UI 组件库 (聊天窗口、性能仪表盘等)
- 帆软报表集成接口 (`fr-api-wrapper.js`, `fr-chat-integration.js`)
- 完整的单元测试覆盖 (94.31% 覆盖率)

🔄 **进行中的工作**:

- UI 模块的单元测试
- 集成测试和端到端测试
- 性能优化和错误处理改进

📋 **待开发功能**:

- 更多的报表数据类型支持
- 高级分析模板
- 用户自定义配置界面

### 技术栈

- **核心语言**: JavaScript (ES6+)
- **模块系统**: ES Modules
- **构建工具**: Rollup
- **测试框架**: Jest
- **代码规范**: ESLint
- **转译工具**: Babel
- **测试环境**: jsdom

## 构建项目

本项目使用 Rollup 进行打包。可用的 npm 脚本包括：

### 开发命令

```bash
# 开发模式 - 监视文件变化并实时构建
npm run dev

# 生产构建 - 代码压缩和优化
npm run build

# 代码规范检查
npm run lint

# 运行测试
npm test
```

### 构建配置

- **入口文件**: `src/main.js`
- **输出目录**: `dist/`
- **主要产物**: `ai-integrated-fr.esm.js`
- **格式**: ES Module
- **Source Map**: 开发和生产环境都生成
- **代码压缩**: 生产环境启用 Terser

构建后的文件将输出到 `dist` 目录，可直接在帆软报表环境中使用。

## 运行测试

项目使用 Jest 进行单元测试，以确保核心模块的正确性和稳定性。当前测试覆盖率达到 **94.31%**，包含 **7 个测试套件** 和 **52 个测试用例**。

### 基本测试命令

```bash
# 运行所有测试
npm test

# 运行测试并生成详细覆盖率报告
npm test -- --coverage

# 运行测试并监视文件变化
npm test -- --watch

# 运行特定测试文件
npm test -- src/core/__tests__/performance-monitor.test.js

# 运行特定测试套件
npm test -- --testNamePattern="performance-monitor"
```

### 测试覆盖的模块

#### 核心模块测试 (`src/core/__tests__/`)

- **`chat-manager.test.js`**: 测试聊天管理功能，包括消息处理、会话管理等 (覆盖率: 94.86%)
- **`chat-prompt-builder.test.js`**: 测试聊天提示构建逻辑，验证不同场景下的提示生成 (覆盖率: 100%)
- **`data-collector.test.js`**: 测试数据收集功能，包括报表数据提取和格式化 (覆盖率: 100%)
- **`performance-monitor.test.js`**: 测试性能数据记录、配置、持久化等功能 (覆盖率: 99.56%)
- **`prompt-builder.test.js`**: 测试基于不同报表数据构建 AI 分析提示的逻辑 (覆盖率: 100%)
- **`result-processor.test.js`**: 测试 AI 响应结果的解析、验证和格式化功能 (覆盖率: 82.99%)

#### 配置模块测试 (`src/config/__tests__/`)

- **`prompt-templates.test.js`**: 测试提示模板的管理和更新功能 (覆盖率: 96.73%)

### 测试环境配置

- **Jest 配置** (`jest.config.js`): 使用 jsdom 环境，自动收集覆盖率，支持 ES6 模块
- **测试设置** (`jest.setup.js`): 全局模拟 fetch API，为测试提供统一的网络请求模拟
- **Babel 配置** (`babel.config.cjs`): 支持 ES6+ 语法转译，确保测试兼容性
- **模拟文件** (`src/__mocks__/`): 为依赖模块提供测试模拟，隔离测试环境

### 测试最佳实践

1. **提交前测试**: 建议在提交代码前运行 `npm test`，确保所有测试用例通过
2. **覆盖率监控**: 新增功能应编写相应测试，保持高覆盖率
3. **模拟依赖**: 使用 Jest 的模拟功能隔离外部依赖，确保测试的可靠性
4. **测试命名**: 测试用例应具有描述性的名称，清楚表达测试意图

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
