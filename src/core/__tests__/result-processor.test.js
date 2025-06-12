/**
 * @file result-processor.test.js
 * @author Haochen (Billy) Fa 法昊辰
 * @description result-processor.js 模块的单元测试
 */

import {
  processResult,
  validateAnalysisData,
  convertMarkdownToHTML,
  validateResult,
} from "../result-processor.js";

// --- 模拟数据 ---
const mockValidAIResponse = {
  choices: [
    {
      message: {
        content: JSON.stringify({
          summary:
            "这是一个非常非常非常非常非常非常非常非常非常非常长的摘要，它的唯一目的就是为了通过那个该死的长度必须大于50的验证测试。", // 长度已>50
          trends: "* 这是一个趋势，并且内容也足够长。\n* 这是另一个趋势，内容同样足够长。",
          insights: "这是一个洞察，内容也足够长。",
          recommendations: "这是一个建议，内容也足够长。",
        }),
      },
    },
  ],
};
const mockIncompleteAIResponse = {
  choices: [
    {
      message: {
        content: JSON.stringify({
          summary: "这是摘要。",
          insights: "这是一个洞察。",
          recommendations: "这是一个建议。",
        }),
      },
    },
  ],
};
const mockJsonInTextResponse = {
  choices: [
    {
      message: {
        content: `报告如下：\n\`\`\`json\n${JSON.stringify({
          summary: "报告摘要",
          trends: "报告趋势",
          insights: "报告洞察",
          recommendations: "报告建议",
        })}\n\`\`\``,
      },
    },
  ],
};
const mockMalformedJsonResponse = {
  choices: [{ message: { content: '{"summary":"这是一个摘要", "trends":' } }],
};
const mockPlainTextResponse = {
  choices: [{ message: { content: "分析无法完成，因为数据不足。" } }],
};

// --- 测试开始 ---

describe("result-processor.js", () => {
  describe("processResult", () => {
    it("应该正确处理一个有效的、完整的AI响应", () => {
      const result = processResult(mockValidAIResponse);
      expect(result.summary).toContain("这是一个非常非常非常非常非常非常非常非常非常非常长的摘要");
      expect(result.trends).toContain("<li>这是一个趋势，并且内容也足够长。</li>");
      expect(result.isComplete).toBe(true);
      expect(result.missingFields).toHaveLength(0);
      expect(result.error).toBeUndefined();
    });

    it("应该能从文本中提取并解析JSON", () => {
      const result = processResult(mockJsonInTextResponse);
      expect(result.summary).toBe("<p>报告摘要</p>");
      expect(result.isComplete).toBe(true);
    });

    it("应该处理缺少字段的响应，并将isComplete标记为false", () => {
      const result = processResult(mockIncompleteAIResponse);
      expect(result.summary).toBe("<p>这是摘要。</p>");
      expect(result.isComplete).toBe(false);
      expect(result.missingFields).toEqual(["trends"]);
    });

    it("当响应为格式错误的JSON时，应优雅降级", () => {
      const result = processResult(mockMalformedJsonResponse);
      expect(result.error).toBeUndefined();
      expect(result.isComplete).toBe(false);
      expect(result.summary).toContain('{"summary":"这是一个摘要", "trends":');
    });

    it("当响应为纯文本时，应将文本内容作为摘要返回", () => {
      const result = processResult(mockPlainTextResponse);
      expect(result.summary).toBe("<p>分析无法完成，因为数据不足。</p>");
      expect(result.isComplete).toBe(false);
    });

    it("当AI响应结构不符合预期时，应返回一个错误对象", () => {
      const badResponse = { choices: [{ message: null }] };
      const result = processResult(badResponse);
      expect(result.error).toBeDefined();
      expect(result.error.errorType).toBe("TYPE_ERROR");
    });

    it("应该根据options.outputFormat返回不同格式的文本", () => {
      const markdownContent = "**粗体** 和 `代码`";
      const response = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: markdownContent,
                trends: "",
                insights: "",
                recommendations: "",
              }),
            },
          },
        ],
      };

      const htmlResult = processResult(response, { outputFormat: "html" });
      expect(htmlResult.summary).toBe("<p><strong>粗体</strong> 和 <code>代码</code></p>");

      const textResult = processResult(response, { outputFormat: "text" });
      expect(textResult.summary).toBe("粗体 和 代码");

      const markdownResult = processResult(response, { outputFormat: "markdown" });
      expect(markdownResult.summary).toBe("**粗体** 和 `代码`");
    });
  });

  describe("validateAnalysisData", () => {
    it("当所有字段都存在时，应该返回isValid: true", () => {
      const data = { summary: "a", trends: "b", insights: "c", recommendations: "d" };
      const { isValid, missingFields } = validateAnalysisData(data);
      expect(isValid).toBe(true);
      expect(missingFields).toHaveLength(0);
    });
    it("当缺少一个或多个字段时，应该返回isValid: false并列出缺失字段", () => {
      const data = { summary: "a", insights: "c" };
      const { isValid, missingFields } = validateAnalysisData(data);
      expect(isValid).toBe(false);
      expect(missingFields).toEqual(["trends", "recommendations"]);
    });
  });

  describe("validateResult", () => {
    it("对于高质量的完整结果，应该返回高分且无问题", () => {
      const data = JSON.parse(mockValidAIResponse.choices[0].message.content);
      const validation = validateResult(data);
      expect(validation.isValid).toBe(true);
      expect(validation.qualityScore).toBe(10);
      expect(validation.issues).toHaveLength(0);
    });

    it("对于缺少字段的结果，应该扣分并报告问题", () => {
      const result = {
        summary: "这是一个非常详细和完整的摘要，内容长度绝对超过了50个字符的要求。",
        trends: "趋势分析也很到位。",
      };
      const validation = validateResult(result);
      expect(validation.isValid).toBe(false);
      expect(validation.qualityScore).toBeLessThan(10);
    });

    it("对于内容过短的结果，应该扣分并报告问题", () => {
      const result = { summary: "太短", trends: "短", insights: "短", recommendations: "短" };
      const validation = validateResult(result);
      expect(validation.qualityScore).toBeLessThan(10);
    });
  });

  describe("convertMarkdownToHTML", () => {
    it("应该正确转换标题 (h1, h2, h3)", () => {
      const markdown = "# 标题1\n\n## 标题2";
      const html = convertMarkdownToHTML(markdown);
      expect(html).toBe("<h1>标题1</h1><h2>标题2</h2>");
    });

    it("应该正确转换无序列表", () => {
      const markdown = "* 项目1\n* 项目2";
      const html = convertMarkdownToHTML(markdown);
      expect(html).toBe("<ul><li>项目1</li><li>项目2</li></ul>");
    });

    it("应该正确转换粗体和斜体", () => {
      const markdown = "**粗体** 和 *斜体*";
      const html = convertMarkdownToHTML(markdown);
      expect(html).toBe("<p><strong>粗体</strong> 和 <em>斜体</em></p>");
    });

    it("应该正确转换代码块和行内代码", () => {
      const markdown = "行内代码 `console.log()`\n\n```\nconst a = 1;\n```";
      const html = convertMarkdownToHTML(markdown);
      expect(html).toContain("<p>行内代码 <code>console.log()</code></p>");
      expect(html).toContain("<pre><code>const a = 1;</code></pre>");
    });
  });
});
