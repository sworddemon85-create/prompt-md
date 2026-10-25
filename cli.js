#!/usr/bin/env node
/*
 * prompt-md CLI — 查看/渲染 Markdown 提示词模板
 *
 * 用法：
 *   node cli.js list <文件.md>                       列出文件里的所有模板及变量
 *   node cli.js show <文件.md> <模板名>               查看模板原文
 *   node cli.js render <文件.md> <模板名> --set k=v   渲染成最终提示词
 *
 * 示例：
 *   node cli.js list prompts.md
 *   node cli.js render prompts.md 代码审查 --set 代码="def add(a,b): return a+b" --set 语言=Python
 *   node cli.js render prompts.md 中译英 --set 原文=你好 --set 语气=正式
 */

function parseArgs(argv) {
  const args = { _: [], set: {} };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--set") {
      const kv = argv[++i];
      const eq = kv.indexOf("=");
      if (eq <= 0) { console.error(`--set 需要 k=v 形式，收到: ${kv}`); process.exit(1); }
      args.set[kv.slice(0, eq)] = kv.slice(eq + 1);
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      args.help = true;
    } else {
      args._.push(argv[i]);
    }
  }
  return args;
}

function printHelp() {
  console.log(`prompt-md — 用 Markdown 管理 LLM 提示词模板

用法:
  node cli.js list   <文件.md>                列出所有模板及所需变量
  node cli.js show   <文件.md> <模板名>        查看模板原文
  node cli.js render <文件.md> <模板名> --set k=v ...   渲染为最终提示词

模板语法:
  # 标题 = 模板名；标题后第一段是描述；正文支持 {{变量}} 与 {{变量|默认值}}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return printHelp();

  const [cmd, file, name] = args._;
  if (!cmd || !file) return printHelp();

  const fs = require("fs");
  const { parsePrompts, render, extractVars } = require("./lib");

  const markdown = fs.readFileSync(file, "utf8");
  const { meta, prompts } = parsePrompts(markdown);

  if (cmd === "list") {
    if (meta.collection) console.log(`集合: ${meta.collection}\n`);
    if (!prompts.length) { console.log("（文件中没有模板：需要 # 标题）"); return; }
    for (const p of prompts) {
      console.log(`■ ${p.name}`);
      if (p.description) console.log(`  ${p.description}`);
      const vars = extractVars(p.template + (p.description || ""));
      if (vars.length) {
        const req = vars.filter((v) => !v.hasDefault).map((v) => v.name);
        const opt = vars.filter((v) => v.hasDefault).map((v) => `${v.name}=${v.defaultValue}`);
        if (req.length) console.log(`  必填: ${req.join(", ")}`);
        if (opt.length) console.log(`  可选: ${opt.join(", ")}`);
      } else {
        console.log("  （无变量）");
      }
      console.log();
    }
    return;
  }

  const prompt = prompts.find((p) => p.name === name);
  if (!prompt) {
    console.error(`找不到模板「${name}」。可用模板: ${prompts.map((p) => p.name).join(", ") || "（无）"}`);
    process.exit(1);
  }

  if (cmd === "show") {
    console.log(prompt.template);
    return;
  }

  if (cmd === "render") {
    // 描述里的变量也参与渲染（描述常含变量展示用途）
    try {
      const body = render(prompt.template, args.set);
      const desc = prompt.description ? render(prompt.description, args.set) + "\n\n" : "";
      process.stdout.write(desc + body + "\n");
    } catch (err) {
      console.error(`渲染失败: ${err.message}`);
      console.error(`提示: node cli.js render ${file} "${name}" --set 变量=值`);
      process.exit(1);
    }
    return;
  }

  printHelp();
}

main().catch((err) => { console.error(`错误: ${err.message}`); process.exit(1); });
