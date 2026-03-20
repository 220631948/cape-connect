#!/usr/bin/env node
/**
 * Session Memory (SessionEnd)
 * 
 * - Persist learned context.
 * - Save architectural decisions.
 * - Prepare next-session bootstrap.
 * - Update progress.md.
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

  if (event.type === 'SessionEnd') {
    const sessionPath = path.join('.gemini', 'session.json');

    if (fs.existsSync(sessionPath)) {
      try {
        const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
        const endTime = new Date().toISOString();
        const startTime = session.start_time || endTime;
        const duration = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000;

        // Update progress.md with session summary
        if (fs.existsSync('progress.md')) {
          let progress = fs.readFileSync('progress.md', 'utf8');
          const lastToolExecutions = (session.tool_executions || [])
            .map(t => `- ${t.time}: ${t.tool_name} (success: ${t.success})`)
            .join('\n');

          const sessionSummary = `\n### Session ${session.session_id}\n` +
            `- Duration: ${duration} seconds\n` +
            `- Tools Executed: ${session.tool_executions ? session.tool_executions.length : 0}\n` +
            `- Milestone: ${session.milestone_at_start || 'Unknown'}\n` +
            `- Summary Log:\n${lastToolExecutions}\n`;

          fs.appendFileSync('progress.md', sessionSummary);
        }

        // Archive the session
        const historyDir = path.join('.gemini', 'history');
        if (!fs.existsSync(historyDir)) {
          fs.mkdirSync(historyDir, { recursive: true });
        }
        const archivePath = path.join(historyDir, `${session.session_id}.json`);
        fs.writeFileSync(archivePath, JSON.stringify(session, null, 2));

      } catch (e) {
        console.error(`SessionEnd hook error: ${e.message}`);
      }
    }

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
