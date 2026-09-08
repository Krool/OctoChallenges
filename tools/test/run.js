// Syntax check (luaparse, Lua 5.1 grammar - the 1.12 client accepts this
// superset of its Lua 5.0) for every .lua in the addon, then the 1.12 API
// allowlist lint (api-lint.js). No behavior harness here yet.
const fs = require("fs");
const path = require("path");
const luaparse = require("luaparse");
const { execFileSync } = require("child_process");
const root = path.join(__dirname, "..", "..");
let failed = false;
for (const f of fs.readdirSync(root)) {
  if (!f.endsWith(".lua")) continue;
  try {
    luaparse.parse(fs.readFileSync(path.join(root, f), "utf8"), { luaVersion: "5.1" });
    console.log("syntax ok: " + f);
  } catch (e) {
    console.log("SYNTAX FAIL: " + f + ": " + e.message);
    failed = true;
  }
}
if (failed) process.exit(1);
execFileSync(process.execPath, [path.join(__dirname, "api-lint.js"), root], { stdio: "inherit" });
console.log("ALL CHECKS PASSED");
