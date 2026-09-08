// api-lint.js - fail when an addon calls a global, reads/writes a CVar, or
// registers an event that does not exist on the 1.12.1 client.
//
// Why: this client's C functions THROW on unknown input (GetCVar("rotateMinimap")
// killed OctoTravel's minimap for every user, 2026-09-08), and a reviewer's
// "fix" written from 2.x memory sails through syntax checks and a stubbed
// harness. The allowlist is built from WoW.exe's own identifier strings plus
// the shipped FrameXML/GlueXML (see api-allowlist.json "note"), so absence
// from it means "does not exist on this client".
//
// Usage: node api-lint.js <addon dir> [allowlist.json]   (exit 1 on findings)
// Heuristics: a bare `Name(` call whose Name is not declared local / defined
// by the addon / in the allowlist is reported. Method calls (a:b(), a.b())
// are not checked. Add a name to EXTRA below only with evidence it exists.
const fs = require("fs"), path = require("path");
const dir = path.resolve(process.argv[2] || path.join(__dirname, "..", ".."));
const listPath = process.argv[3] || path.join(__dirname, "api-allowlist.json");
const allow = JSON.parse(fs.readFileSync(listPath, "utf8"));
const FN = new Set(allow.functions), CV = new Set(allow.cvars), EV = new Set(allow.events);
// names known to exist on this client that neither the exe strings nor FrameXML define
const EXTRA = new Set(["arg", "this", "event", "_G"]);

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === ".git" || e.name === "node_modules" || e.name === "tools" || e.name === ".github") continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out); else if (/\.(lua|xml)$/i.test(e.name)) out.push(p);
  }
  return out;
}
const files = walk(dir);
const defined = new Set();      // globals the addon itself defines
const srcOf = {};
for (const f of files) {
  let src = fs.readFileSync(f, "latin1");
  if (f.endsWith(".lua")) src = src.replace(/--\[\[[\s\S]*?\]\]/g, "").replace(/--[^\n]*/g, "");
  srcOf[f] = src;
  for (const m of src.matchAll(/\bfunction\s+([A-Za-z_][A-Za-z0-9_]*)\s*[.:(]/g)) defined.add(m[1]);
  for (const m of src.matchAll(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=[^=]/gm)) defined.add(m[1]);
  for (const m of src.matchAll(/\bname="([A-Za-z_][A-Za-z0-9_]*)"/g)) defined.add(m[1]);
  for (const m of src.matchAll(/\b(SLASH_[A-Z0-9_]+)\s*=/g)) defined.add(m[1]);
}
let findings = 0;
function report(f, kind, name, line) { findings++; console.log(`API-LINT ${kind}: ${path.relative(dir, f)}:${line} ${name}`); }
function lineOf(src, idx) { return src.slice(0, idx).split("\n").length; }
for (const f of files) {
  const src = srcOf[f];
  const locals = new Set();
  for (const m of src.matchAll(/\blocal\s+(?:function\s+)?([A-Za-z_][A-Za-z0-9_,\s]*)/g)) for (const n of m[1].split(/[,\s]+/)) if (n) locals.add(n);
  for (const m of src.matchAll(/\bfunction\s*[A-Za-z0-9_.:]*\s*\(([^)]*)\)/g)) for (const n of m[1].split(/[,\s]+/)) if (n && n !== "...") locals.add(n);
  for (const m of src.matchAll(/\bfor\s+([A-Za-z_][A-Za-z0-9_,\s]*?)\s*(?:=|in)\b/g)) for (const n of m[1].split(/[,\s]+/)) if (n) locals.add(n);
  // string literals are not code: blank them (keeps offsets by replacing with spaces)
  const code = src.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, (s) => " ".repeat(s.length));
  for (const m of code.matchAll(/(?<![\w.:])([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)) {
    const n = m[1];
    if (locals.has(n) || defined.has(n) || FN.has(n) || EXTRA.has(n)) continue;
    if (/^(function|if|while|elseif|return|and|or|not|then|do|end|in|until|repeat)$/.test(n)) continue;
    report(f, "unknown global", n, lineOf(src, m.index));
  }
  for (const m of src.matchAll(/\b(?:Get|Set)CVar(?:Default)?\s*\(\s*"([^"]+)"/g)) if (!CV.has(m[1])) report(f, "unknown cvar", m[1], lineOf(src, m.index));
  for (const m of src.matchAll(/RegisterEvent\s*\(\s*"([^"]+)"/g)) if (!EV.has(m[1])) report(f, "unknown event", m[1], lineOf(src, m.index));
}
if (findings) { console.log(`api-lint: ${findings} finding(s) in ${path.basename(dir)} - names above do not exist on the 1.12 client (or add evidence to EXTRA)`); process.exit(1); }
console.log(`api-lint ok: ${path.basename(dir)} (${files.length} files) - every global, cvar and event exists on the 1.12 client`);
