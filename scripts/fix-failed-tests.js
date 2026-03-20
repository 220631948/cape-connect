#!/usr/bin/env node
const fs = require("fs");
const { spawnSync } = require("child_process");

// Configuration
const EXCLUDED_PATHS = [
  ".github/workflows",
  ".env",
  "package-lock.json",
  "pnpm-lock.yaml",
];

function log(msg) {
  console.error(`[FixAgent] ${msg}`);
}

// 1. Read the test log from stdin
const input = fs.readFileSync(0, "utf8");
if (!input) {
  log("No input received on stdin.");
  process.exit(1);
}

// 2. Identify the failing file path from the log
// Vitest output usually has FAIL  src/...
const fileMatch = input.match(/FAIL\s+([\w\-\/\.]+\.(?:ts|tsx|js|jsx))/);
if (!fileMatch) {
  log("Could not identify a failing source file from the log.");
  process.exit(0);
}

const filePath = fileMatch[1];
log(`Identified failing file: ${filePath}`);

if (EXCLUDED_PATHS.some((p) => filePath.includes(p))) {
  log("File is in an excluded directory. Skipping.");
  process.exit(0);
}

// 3. Read the file content
let fileContent;
try {
  fileContent = fs.readFileSync(filePath, "utf8");
} catch (err) {
  log(`Could not read file ${filePath}: ${err.message}`);
  process.exit(1);
}

// 4. Agent instructions
const systemPrompt = `You are a specialized test-fixing agent.
CRITICAL RULES:
1. ONLY suggest fixes for: code formatting, broken dependencies (e.g., imports), or simple typos.
2. NEVER modify workflow YAML files or any file in .github/workflows.
3. NEVER attempt to access secrets, credentials, or environment variables.
4. Output ONLY the full content of the corrected file. No explanation, no markdown blocks.
5. If you cannot fix it within these constraints, output: NO_FIX_POSSIBLE`;

const prompt = `${systemPrompt}\n\nERROR LOG:\n${input}\n\nORIGINAL FILE (${filePath}):\n${fileContent}`;

let fixedContent = null;

// Try agents in order: copilot -> claude -> gemini
const tryAgent = (name, cmd, args) => {
  log(`Trying agent: ${name}`);
  const result = spawnSync(cmd, args, { encoding: "utf8", timeout: 60000 });
  if (result.status === 0 && result.stdout) {
    let output = result.stdout.trim();
    if (output && !output.includes("NO_FIX_POSSIBLE")) {
      // Basic cleanup of markdown if agent didn't follow instructions
      output = output.replace(/^```[\w]*\n/, "").replace(/\n```$/, "");
      if (output.length > 20 && output !== fileContent) {
        return output;
      }
    }
  } else {
    log(`${name} failed: ${result.stderr || "No output"}`);
  }
  return null;
};

// Try Copilot
fixedContent = tryAgent("copilot", "copilot", [
  "-p",
  prompt,
  "--silent",
  "--yolo",
  "--available-tools",
  '""',
]);

// Try Claude if Copilot failed
if (!fixedContent) {
  fixedContent = tryAgent("claude", "claude", [
    "-p",
    prompt,
    "--print",
    "--tools",
    '""',
  ]);
}

// Try Gemini as last resort
if (!fixedContent) {
  fixedContent = tryAgent("gemini", "gemini", [
    "-p",
    prompt,
    "--output-format",
    "text",
    "-y",
    "--extensions",
    '""',
    "--approval-mode",
    "yolo",
  ]);
}

// 5. Security & Safety Check
if (fixedContent) {
  // Check for suspicious content (secrets-like strings)
  const secretPattern =
    /(?:key|token|secret|password|auth|pwd)\s*[:=]\s*["'][a-zA-Z0-9\-_]{20,}["']/i;
  if (secretPattern.test(fixedContent) && !secretPattern.test(fileContent)) {
    log("Security alert: Potential secret injection detected. Rejecting fix.");
    process.exit(1);
  }

  // Ensure no workflow files are being targeted (extra check)
  if (filePath.includes(".github/workflows")) {
    log("Security alert: Attempted to modify workflow file. Rejecting fix.");
    process.exit(1);
  }

  try {
    fs.writeFileSync(filePath, fixedContent);
    log(`Successfully applied fix to ${filePath}`);
    process.exit(0);
  } catch (err) {
    log(`Could not write to file ${filePath}: ${err.message}`);
    process.exit(1);
  }
} else {
  log("No fix was suggested by any agent.");
  process.exit(1);
}
