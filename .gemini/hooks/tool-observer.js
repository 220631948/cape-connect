#!/usr/bin/env node
/**
 * Tool Observer (AfterTool)
 * 
 * - Log executions.
 * - Track tool success/failure.
 * - Attach structured metadata to context.
 */

const fs = require('fs');
const path = require('path');

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

  if (event.type === 'AfterTool') {
    const { tool_name, args, result, success } = event;

    const sessionPath = path.join('.gemini', 'session.json');
    if (fs.existsSync(sessionPath)) {
      try {
        const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
        if (!session.tool_executions) {
          session.tool_executions = [];
        }

        session.tool_executions.push({
          tool_name,
          args,
          success,
          time: new Date().toISOString()
        });

        // Limit to last 50 executions
        if (session.tool_executions.length > 50) {
          session.tool_executions.shift();
        }

        fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
      } catch (e) {
        // Ignore malformed session file
      }
    }

    // Attach metadata to context (optional, but requested)
    // Actually, context mutation is usually done in BeforeAgent, but some 
    // CLI implementations may support it in AfterTool.
    const metadata = {
      tool: tool_name,
      status: success ? 'OK' : 'FAIL',
      timestamp: new Date().toISOString()
    };

    console.log(JSON.stringify({
      status: 'success',
      metadata: metadata
    }));
    process.exit(0);
  }

  // Fallback
  console.log(JSON.stringify({ status: 'ignored' }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
