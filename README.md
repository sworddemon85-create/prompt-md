# 📝 prompt-md

[![CI](https://github.com/sworddemon85-create/prompt-md/actions/workflows/ci.yml/badge.svg)](https://github.com/sworddemon85-create/prompt-md/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Zero deps](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)

**用 Markdown 管理 LLM 提示词模板**：一个 .md 文件装下一整套提示词，`{{变量}}` 占位、`{{变量|默认值}}` 兜底，命令行一键渲染成最终提示词。

> Manage LLM prompts as Markdown. One file, many templates, `{{variable}}` substitution with defaults, zero dependencies.

## ✨ 特性

- **一个文件一套提示词** — `# 标题` 就是一个模板，可以往 Git 里提交、做 diff、做 code review
- **变量系统** — `{{变量}}` 必填（缺失时报错并列出）、`{{变量|默认值}}` 可选；变量名支持中文
- **自动提取变量清单** — `list` 命令告诉你每个模板需要什么
- **零依赖** — 只用 Node 内置模块
- **库 + CLI 双形态** — 嵌入你自己的脚本，或直接命令行使用

## 🚀 用法

```bash
git clone https://github.com/sworddemon85-create/prompt-md.git
cd prompt-md

# 列出示例文件里的模板与变量
node cli.js list prompts.md

# 渲染（可选变量用默认值）
node cli.js render prompts.md 中译英 --set 原文=今天天气不错

# 全部显式指定
node cli.js render prompts.md 中译英 --set 原文=今天天气不错 --set 语气=正式

# 查看模板原文
node cli.js show prompts.md 代码审查

# 作为库使用
node -e "const {parsePrompts,render}=require('./lib');const {prompts}=parsePrompts(require('fs').readFileSync('prompts.md','utf8'));console.log(render(prompts[0].template,{原文:'你好'}))"
```

## 📄 模板格式

```markdown
---
collection: 我的提示词集        ← 可选的文件级元信息
---

# 模板名                        ← 每个模板一个标题

标题后的第一段文字是描述（给人看的）。   ← 支持 {{变量}}

正文从这里开始，{{变量}} 会被替换，
{{变量|默认值}} 在缺省时使用默认值。
```

规则：

- `#` 到 `##` 等更深级的标题都属于当前模板（正文的一部分）
- 同级或更高级标题开启下一个模板
- 描述里的变量同样参与渲染

## 🧪 测试

```bash
npm test    # node --test，14 个用例
```

覆盖：frontmatter 解析、模板拆分与描述提取、正文清理、变量替换/默认值/缺失报错、中文变量名、`{{ name }}` 宽松空白。

## 📁 结构

```
prompt-md/
├── lib/
│   ├── parser.js   # Markdown → 提示词数组（frontmatter + 标题分节）
│   ├── render.js   # {{变量}} 渲染与变量提取
│   └── index.js    # 模块入口
├── cli.js          # list / show / render 三个子命令
├── prompts.md      # 示例提示词集
└── test/           # 单元测试
```

## 💡 为什么不用 JSON/YAML 存提示词？

Markdown 是写给人和模型看的格式：多行文本、代码块、列表都自然表达，
Git diff 清晰可读，还能直接粘贴到任何聊天框里用。变量系统补上了"模板化"这最后一块拼图。

## 📄 许可证

[MIT](LICENSE)
