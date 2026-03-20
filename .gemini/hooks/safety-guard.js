#!/usr/bin/env node
/**
 * Safety Guard (BeforeTool)
 * 
 * - Block dangerous shell/file operations.
 * - Detect secrets exposure.
 * - Validate write paths.
 * - Deny unsafe commands with reason.
 */

const fs = require('fs');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
  });
}

async function main() {
  const inputData = await readStdin();
  if (!inputData) {
    console.error('No input data received');
    process.exit(1);
  }

  let event;
  try {
    event = JSON.parse(inputData);
  } catch (e) {
    console.error('Failed to parse input data as JSON');
    process.exit(1);
  }

  if (event.type === 'BeforeTool') {
    const { tool_name, args } = event;

    // --- Dangerous shell command check ---
    if (tool_name === 'run_shell_command' && args.command) {
      const { command } = args;
      const dangerousPatterns = [
        
        
        
        /DROP\s+DATABASE/i,
        /DROP\s+TABLE/i,
        /TRUNCATE\s+TABLE/i,
        /DELETE\s+FROM/i, // Potentially dangerous without WHERE
        /curl\s+.*\|\s+bash/i,
        /sudo\s+/i, // Block sudo unless explicitly allowed (not here)
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(command)) {
          console.log(JSON.stringify({ 
            status: 'blocked', 
            reason: `Potentially dangerous shell command detected: "${command}" (Pattern: ${pattern})`,
            exit_code: 2 // Critical block
          }));
          process.exit(0);
        }
      }
    }

    // --- Path traversal check ---
    if (args.file_path || args.dir_path || args.path) {
      const filePath = args.file_path || args.dir_path || args.path;
      if (filePath.includes('..')) {
        console.log(JSON.stringify({ 
          status: 'blocked', 
          reason: `Potential path traversal detected in path: "${filePath}"`,
          exit_code: 2
        }));
        process.exit(0);
      }
    }

    // --- Secret exposure check in write operations ---
    if (tool_name === 'write_file' || tool_name === 'replace' || tool_name === 'write_files_batch') {
      const content = args.content || args.new_string || '';
      const secretPatterns = [
        /pk_live_[a-zA-Z0-9]{24}/i, // Stripe live key
        /sk_live_[a-zA-Z0-9]{24}/i, // Stripe secret key
        /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/i, // JWT-like (potential service role key)
        /password\s*=\s*['"][^'"]+['"]/i,
        /API_KEY\s*=\s*['"][^'"]+['"]/i,
        /SUPABASE_(?:SERVICE_ROLE|ANON)_KEY\s*=\s*['"][^'"]+['"]/i,
      ];

      for (const pattern of secretPatterns) {
        if (pattern.test(content)) {
          console.log(JSON.stringify({ 
            status: 'blocked', 
            reason: `Potential secret exposure detected in write operation: "${pattern}"`,
            exit_code: 2
          }));
          process.exit(0);
        }
      }
    }

    // --- Allowed tool execution ---
    console.log(JSON.stringify({ status: 'success' }));
    process.exit(0);
  }

  // Fallback
  console.log(JSON.stringify({ status: 'ignored' }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
