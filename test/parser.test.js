const test = require("node:test");
const assert = require("node:assert");
const { parsePrompts } = require("../lib/parser.js");

const SAMPLE = `---
collection: 翻译助手
author: Sword
---

# 中译英

把下面的中文翻译成英文，语气{{语气}}：

{{原文}}

## 备注块（属于中译英）

翻译时保留原文格式。

# 代码审查

审查以下 {{语言|Python}} 代码，指出问题：

\`\`\`{{语言|Python}}
{{代码}}
\`\`\`
`;

test("解析 frontmatter 元信息", () => {
  const { meta } = parsePrompts(SAMPLE);
  assert.strictEqual(meta.collection, "翻译助手");
  assert.strictEqual(meta.author, "Sword");
});

test("按一级标题拆分模板，更深标题并入正文", () => {
  const { prompts } = parsePrompts(SAMPLE);
  assert.strictEqual(prompts.length, 2);
  assert.strictEqual(prompts[0].name, "中译英");
  assert.strictEqual(prompts[1].name, "代码审查");
  // 二级标题「备注块」是中译英正文的一部分
  assert.ok(prompts[0].template.includes("## 备注块"));
  assert.ok(prompts[0].template.includes("翻译时保留原文格式"));
});

test("模板正文前的第一段非空文字作为描述", () => {
  const { prompts } = parsePrompts(SAMPLE);
  assert.strictEqual(prompts[0].description, "把下面的中文翻译成英文，语气{{语气}}：");
  assert.strictEqual(prompts[1].description, "审查以下 {{语言|Python}} 代码，指出问题：");
  // 描述不应重复出现在正文里
  assert.ok(!prompts[1].template.startsWith("审查以下"));
});

test("正文首尾空白被清理", () => {
  const { prompts } = parsePrompts(SAMPLE);
  for (const p of prompts) {
    assert.strictEqual(p.template, p.template.replace(/^\n+/, "").replace(/\s+$/, ""));
  }
});

test("空输入与无标题输入", () => {
  assert.deepStrictEqual(parsePrompts("").prompts, []);
  const { prompts } = parsePrompts("没有任何标题的普通文本");
  assert.deepStrictEqual(prompts, []);
});

test("仅有 frontmatter 时返回空模板", () => {
  const { meta, prompts } = parsePrompts("---\ncollection: x\n---\n");
  assert.strictEqual(meta.collection, "x");
  assert.deepStrictEqual(prompts, []);
});
