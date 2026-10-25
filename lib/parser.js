/**
 * 解析 Markdown 提示词集：一个 .md 文件包含多个提示词模板。
 *
 * 文件格式：
 *   ---                      ← 可选的文件级元信息（--- 包裹）
 *   collection: 翻译助手
 *   ---
 *   # 模板名                  ← 一级/二级标题 = 提示词名
 *   描述文字（可选）
 *
 *   正文，支持 {{变量}} 与 {{变量|默认值}}
 *
 * 标题之后到下一个同级或更高级标题之前的全部内容都属于该模板。
 */

const HEADING = /^(#{1,6})\s+(.+?)\s*$/;

/** 从 markdown 文本解析出提示词数组。 */
function parsePrompts(markdown) {
  const lines = String(markdown).split(/\r?\n/);
  const prompts = [];
  let meta = {};
  let current = null;

  // 文件级 frontmatter（--- 开头的首块）
  let i = 0;
  if (lines[0] !== undefined && lines[0].trim() === "---") {
    const fm = [];
    for (i = 1; i < lines.length; i++) {
      if (lines[i].trim() === "---") { i++; break; }
      fm.push(lines[i]);
    }
    meta = parseSimpleYaml(fm);
  }

  for (; i < lines.length; i++) {
    const m = HEADING.exec(lines[i]);
    if (m) {
      // 同级或更高级标题开启新模板；更深级标题并入当前模板正文
      if (current && m[1].length <= current._level) {
        finalize(current);
        prompts.push(current);
        current = null;
      }
      if (!current) {
        current = { name: m[2].trim(), description: "", template: "", _level: m[1].length, _seenContent: false };
        continue;
      }
    }
    if (current) {
      if (!current._seenContent) {
        // 标题后的空行不算内容；第一段非空文字作为描述
        if (lines[i].trim() === "") continue;
        current._seenContent = true;
        current.description = lines[i].trim();
        continue;
      }
      current.template += lines[i] + "\n";
    }
  }
  if (current) {
    finalize(current);
    prompts.push(current);
  }
  return { meta, prompts };
}

function finalize(prompt) {
  // 描述不吃进正文后，正文去掉首尾空行
  prompt.template = prompt.template.replace(/^\n+/, "").replace(/\s+$/, "");
  delete prompt._level;
  delete prompt._seenContent;
}

/** 解析极简 key: value 行（够用就好，不引入 YAML 依赖）。 */
function parseSimpleYaml(lines) {
  const out = {};
  for (const line of lines) {
    const m = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

module.exports = { parsePrompts };
