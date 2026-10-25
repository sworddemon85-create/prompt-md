/**
 * 模板渲染：{{变量}} 替换。
 * 支持 {{变量|默认值}}；未提供且无默认值的变量会抛错并列出缺失项。
 */

const VAR_PATTERN = /\{\{\s*([\w\u4e00-\u9fa5-]+)(?:\s*\|\s*([^}]*?))?\s*\}\}/g;

/**
 * 提取模板中声明的变量。
 * @returns {{name: string, hasDefault: boolean, defaultValue: string}[]}
 */
function extractVars(template) {
  const seen = new Map();
  for (const m of String(template).matchAll(VAR_PATTERN)) {
    const [, name, def] = m;
    if (!seen.has(name)) {
      seen.set(name, { name, hasDefault: def !== undefined, defaultValue: def ?? "" });
    }
  }
  return [...seen.values()];
}

/**
 * 渲染模板。
 * @param {string} template
 * @param {Record<string, string>} vars
 * @returns {string}
 * @throws {Error} 缺失必填变量时（错误信息包含全部缺失变量名）
 */
function render(template, vars = {}) {
  const missing = [];
  const out = String(template).replace(VAR_PATTERN, (whole, name, def) => {
    const value = vars[name];
    if (value !== undefined && value !== null && String(value) !== "") return String(value);
    if (def !== undefined) return def;
    missing.push(name);
    return whole;
  });
  if (missing.length) {
    throw new Error(`缺少变量: ${[...new Set(missing)].join(", ")}`);
  }
  return out;
}

module.exports = { render, extractVars };
