const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

async function fixture(t, markdown) {
  const root = await fs.mkdtemp(path.join(__dirname, ".cli-render-"));
  t.after(async () => {
    const relative = path.relative(__dirname, root);
    assert.ok(relative.startsWith(".cli-render-") && !relative.includes(path.sep));
    await fs.rm(root, { recursive: true, force: true });
  });
  const file = path.join(root, "prompts.md");
  await fs.writeFile(file, markdown);
  return (command, ...args) => {
    const result = spawnSync(process.execPath, [path.resolve(__dirname, "../cli.js"), command, file, ...args], {
      encoding: "utf8", timeout: 10000,
    });
    assert.ifError(result.error);
    return result;
  };
}

test("CLI preserves explicitly supplied prototype-named variables in description and body", async t => {
  const run = await fixture(t, "# Example\nDescription {{__proto__}}\n\n{{constructor}} / {{toString}} / {{hasOwnProperty}}\n");
  const result = run("render", "Example", "--set", "__proto__=literal", "--set", "constructor=builder",
    "--set", "toString=text", "--set", "hasOwnProperty=own");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "Description literal\n\nbuilder / text / own\n");
  assert.equal(result.stderr, "");
});

test("CLI uses defaults instead of inherited object properties", async t => {
  const run = await fixture(t, "# Example\n{{__proto__|fallback}}\n\n{{constructor|builder}} / {{toString|text}}\n");
  const result = run("render", "Example");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "fallback\n\nbuilder / text\n");
});

test("CLI missing prototype-named variables fail without partial rendered output", async t => {
  const run = await fixture(t, "# Example\nDescription\n\n{{__proto__}} / {{constructor}} / {{toString}}\n");
  const result = run("render", "Example");
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /缺少变量: __proto__, constructor, toString/);
});

test("CLI preserves equals signs, repeated assignments, and empty-value defaults", async t => {
  const run = await fixture(t, "# Example\nDescription\n\n{{__proto__}} / {{原文}} / {{tone|自然}}\n");
  const result = run("render", "Example", "--set", "__proto__=old", "--set", "__proto__=new=value",
    "--set", "原文=hello=world", "--set", "tone=");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "Description\n\nnew=value / hello=world / 自然\n");
});

test("CLI list reports required variables across description and body", async t => {
  const run = await fixture(t, "# Example\nDescription {{name}}\n\nHello {{name|guest}} / {{tone|自然}}\n");
  const result = run("list");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /必填: name/);
  assert.match(result.stdout, /可选: tone=自然/);
  assert.doesNotMatch(result.stdout, /可选:.*name=/);
  assert.equal(run("render", "Example").status, 1);
});

test("CLI explains malformed and missing --set values", async t => {
  const run = await fixture(t, "# Example\nDescription\n\nBody\n");
  for (const args of [[], ["no-equals"], ["=no-key"]]) {
    const result = run("render", "Example", "--set", ...args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /--set 需要 k=v 形式/);
    assert.doesNotMatch(result.stderr, /Cannot read properties/);
  }
});
