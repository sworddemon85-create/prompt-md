/** prompt-md：Markdown 提示词模板库。 */

const { parsePrompts } = require("./parser");
const { render, extractVars } = require("./render");

module.exports = { parsePrompts, render, extractVars };
