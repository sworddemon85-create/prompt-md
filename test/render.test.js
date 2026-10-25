const test = require("node:test");
const assert = require("node:assert");
const { render, extractVars } = require("../lib/render.js");

test("基本变量替换", () => {
  assert.strictEqual(render("你好，{{名字}}！", { 名字: "Sword" }), "你好，Sword！");
  assert.strictEqual(render("{{a}}-{{b}}", { a: "1", b: "2" }), "1-2");
});

test("默认值在变量缺失时生效", () => {
  assert.strictEqual(render("语言是 {{语言|Python}}", {}), "语言是 Python");
  assert.strictEqual(render("语言是 {{语言|Python}}", { 语言: "Go" }), "语言是 Go");
});

test("空字符串视为缺失（回退默认值）", () => {
  assert.strictEqual(render("{{x|默认}}", { x: "" }), "默认");
});

test("缺失必填变量时抛错并列出全部缺失项", () => {
  try {
    render("{{a}} {{b}} {{a}}", {});
    assert.fail("应当抛错");
  } catch (err) {
    assert.ok(err.message.includes("a"));
    assert.ok(err.message.includes("b"));
  }
});

test("变量名支持中文与连字符", () => {
  assert.strictEqual(render("{{原文-内容}}", { "原文-内容": "ok" }), "ok");
});

test("extractVars 去重并报告默认值", () => {
  const vars = extractVars("{{a}} {{b|默认}} {{a|重复}}");
  assert.deepStrictEqual(
    vars.map((v) => v.name),
    ["a", "b"]
  );
  assert.strictEqual(vars[1].hasDefault, true);
  assert.strictEqual(vars[1].defaultValue, "默认");
  assert.strictEqual(vars[0].hasDefault, false);
});

test("模板中无变量时原样返回", () => {
  const text = "没有任何变量的模板\n第二行";
  assert.strictEqual(render(text, {}), text);
});

test("变量两侧允许空白：{{ name }}", () => {
  assert.strictEqual(render("{{ name }}", { name: "Sword" }), "Sword");
});
