# 📝 prompt-md

**English** | [中文](README.zh-CN.md)

[![CI](https://github.com/sworddemon85-create/prompt-md/actions/workflows/ci.yml/badge.svg)](https://github.com/sworddemon85-create/prompt-md/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Zero deps](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)

**Manage LLM prompts as Markdown.** One `.md` file holds a whole prompt collection: `# headings` split templates, `{{variable}}` placeholders render with required-variable validation, `{{variable|default}}` provides fallbacks. A tiny CLI turns templates into final prompts.

Because prompts are plain Markdown, they get git history, diffs, and code review for free.

## ✨ Features

- **One file, many prompts** — each `# heading` starts a template; keep a whole collection in a single tracked file
- **Variable system** — `{{variable}}` is required (missing ones are reported together with names), `{{variable|default}}` is optional; Chinese variable names supported
- **Variable introspection** — `list` tells you exactly what each template needs (required vs. optional with defaults)
- **Zero dependencies** — Node.js built-ins only
- **Library + CLI** — embed in your own scripts or use from the terminal

## 🚀 Usage

```bash
git clone https://github.com/sworddemon85-create/prompt-md.git
cd prompt-md

# list templates and their variables
node cli.js list prompts.md

# render (optional variables fall back to defaults; the sample collection
# uses Chinese template/variable names — yours can be anything)
node cli.js render prompts.md 中译英 --set 原文="hello world"

# specify everything explicitly
node cli.js render prompts.md 中译英 --set 原文="hello world" --set 语气=formal

# view the raw template
node cli.js show prompts.md 代码审查

# as a library
node -e "const {parsePrompts,render}=require('./lib');const {prompts}=parsePrompts(require('fs').readFileSync('prompts.md','utf8'));console.log(render(prompts[0].template,{原文:'hi'}))"
```

## 📄 Template format

```markdown
---
collection: my prompts        ← optional file-level metadata
---

# Template name               ← one template per heading

First paragraph is the description (for humans).   ← supports {{variables}}

Body starts here; {{variable}} gets substituted,
{{variable|default}} kicks in when a value is missing.
```

Rules:

- Deeper headings (`##`, `###`) belong to the current template's body
- A same-level or higher heading starts the next template
- Variables inside descriptions are rendered too

## 🧪 Tests

```bash
npm test    # node --test — 14 unit tests
```

Covers: frontmatter parsing, template splitting and description extraction, body trimming, variable substitution / defaults / missing-variable errors, Chinese variable names, tolerant `{{ name }}` whitespace.

## 📁 Structure

```
prompt-md/
├── lib/
│   ├── parser.js   # Markdown → prompt array (frontmatter + heading sections)
│   ├── render.js   # {{variable}} rendering and variable extraction
│   └── index.js    # module entry
├── cli.js          # list / show / render subcommands
├── prompts.md      # sample prompt collection
└── test/           # unit tests
```

## 💡 Why Markdown instead of JSON/YAML?

Markdown is the format both humans and models read best: multi-line text, code blocks, and lists all come naturally. Git diffs stay readable, and any prompt pastes straight into any chat window. The variable system adds the last missing piece — templating.

## 📄 License

[MIT](LICENSE)
